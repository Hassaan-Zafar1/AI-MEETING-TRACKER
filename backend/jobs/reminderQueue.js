const Bull = require('bull');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');

// Create a queue named 'reminders' connected to Redis
// Bull uses Redis to persist jobs — if server restarts, jobs survive
let reminderQueue = null;
let redisConnected = false;

try {
  reminderQueue = new Bull('reminders', {
    redis: process.env.REDIS_URL,
    maxRetriesPerRequest: null, // Disable max retries limit
    enableReadyCheck: false,
    enableOfflineQueue: false,
    socket: {
      reconnectStrategy: (retries) => {
        const delay = Math.min(retries * 100, 3000);
        return delay;
      },
      connectTimeout: 10000,
      keepAlive: 30000,
    },
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  
  reminderQueue.on('error', (err) => {
    // Suppress expected connection reset and retry limit errors
    if (err.code !== 'ECONNRESET' && !err.message.includes('max retries')) {
      console.error('❌ Redis connection error:', err.message);
    }
    redisConnected = false;
  });
  
  reminderQueue.on('ready', () => {
    console.log('✅ Redis connected for reminder queue');
    redisConnected = true;
  });

  // Suppress connection error logs for expected transient errors
  reminderQueue.client.on('error', (err) => {
    // ECONNRESET is expected with Upstash, it auto-retries
    if (err.code !== 'ECONNRESET' && err.code !== 'ETIMEDOUT' && !err.message.includes('max retries')) {
      console.error('Redis client error:', err.message);
    }
  });

} catch (error) {
  console.warn('⚠️ Failed to initialize Bull queue:', error.message);
  reminderQueue = null;
}

// Define what happens when a job is processed
// This function runs when a scheduled reminder fires
if (reminderQueue) {
  reminderQueue.process(async (job) => {
    const { taskId, taskDescription, assigneeName, assigneeId, dueDate, dueTime } = job.data;

    console.log(`🔔 [Reminder Job] Processing reminder for task: "${taskDescription}"`);

    try {
      // Fetch user email from database if assigneeId is provided
      let userEmail = null;
      if (assigneeId) {
        const user = await User.findById(assigneeId).select('email');
        if (user) {
          userEmail = user.email;
          console.log(`📧 [Reminder Job] Found user email: ${userEmail}`);
        }
      }

      // Construct the full due date/time for the email
      let emailDueDate = dueDate;
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        const dueDateTime = new Date(dueDate);
        dueDateTime.setHours(hours, minutes, 0, 0);
        emailDueDate = dueDateTime.toISOString();
      }

      // Send email reminder if email is available
      if (userEmail) {
        console.log(`📤 [Reminder Job] Sending email to ${userEmail}...`);
        await sendReminderEmail(userEmail, taskDescription, emailDueDate, assigneeName);
        console.log(`✅ [Reminder Job] Reminder email sent successfully for task: "${taskDescription}" to ${userEmail}`);
      } else {
        console.warn(
          `⚠️ [Reminder Job] No email found for assignee "${assigneeName}". Task: "${taskDescription}"`
        );
      }
    } catch (error) {
      console.error(`❌ [Reminder Job] Error processing reminder for task "${taskDescription}":`, error.message);
      throw error; // Re-throw to trigger retry logic
    }
  });
}

// This function schedules a reminder job
const scheduleReminder = async (task) => {
  if (!task.dueDate) return;
  
  // If Redis is not available, skip reminder scheduling
  if (!reminderQueue) {
    console.warn(`⚠️ Redis not available. Skipping reminder for task: "${task.description}"`);
    return;
  }

  // Parse dueDate and dueTime to calculate reminder time
  let reminderTime;
  
  if (task.dueTime) {
    // Extract date components
    const dueDate = new Date(task.dueDate);
    const dateStr = dueDate.toISOString().split('T')[0]; // "2026-05-05"
    
    // Create a date assuming the time is in the user's local timezone
    // We need to convert from local time to UTC
    const timezoneId = process.env.TIMEZONE || 'UTC';
    const localDateTimeStr = `${dateStr}T${task.dueTime}:00`;
    
    // Calculate UTC offset for this date
    const utcDate = new Date(localDateTimeStr);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(utcDate);
    const tzYear = parts.find(p => p.type === 'year').value;
    const tzMonth = parts.find(p => p.type === 'month').value;
    const tzDay = parts.find(p => p.type === 'day').value;
    const tzHour = parts.find(p => p.type === 'hour').value;
    const tzMinute = parts.find(p => p.type === 'minute').value;
    
    // The offset is the difference between UTC and what the formatter thinks
    const tzDate = new Date(`${tzYear}-${tzMonth}-${tzDay}T${tzHour}:${tzMinute}:00Z`);
    const offsetMs = utcDate.getTime() - tzDate.getTime();
    
    // The actual UTC time is the local interpretation minus the offset
    const actualUtcTime = new Date(utcDate.getTime() - offsetMs);
    
    console.log(`DEBUG: Due date & time: ${actualUtcTime.toISOString()}`);
    console.log(`DEBUG: Current time: ${new Date().toISOString()}`);
    
    // Schedule reminder 24 hours before the due date & time
    reminderTime = actualUtcTime.getTime() - 24 * 60 * 60 * 1000;
  } else {
    // Original logic: 24 hours before due date at midnight
    const dueDate = new Date(task.dueDate);
    console.log(`DEBUG: Due date: ${dueDate.toISOString()}`);
    console.log(`DEBUG: Current time: ${new Date().toISOString()}`);
    
    reminderTime = new Date(task.dueDate).getTime() - 24 * 60 * 60 * 1000;
  }

  const delay = reminderTime - Date.now();

  // Only schedule if the reminder is in the future
  if (delay <= 0) {
    console.log(`Task "${task.description}" is already past reminder time`);
    return;
  }

  try {
    // Add job to queue with a delay
    await reminderQueue.add(
      {
        taskId: task._id,
        taskDescription: task.description,
        assigneeName: task.assigneeName,
        assigneeId: task.assignee, // Pass the assignee ID to fetch email later
        dueDate: task.dueDate,
        dueTime: task.dueTime,
      },
      {
        delay,           // fires after this many milliseconds
        attempts: 3,     // retry up to 3 times if it fails
        backoff: 5000,   // wait 5 seconds between retries
      }
    );

    console.log(`Reminder scheduled for task: "${task.description}"`);
  } catch (error) {
    console.error(`Failed to schedule reminder for task "${task.description}":`, error.message);
    // Don't re-throw - let extraction continue even if reminder fails
  }
};

// Log successful jobs
if (reminderQueue) {
  reminderQueue.on('completed', (job) => {
    console.log(`Reminder job ${job.id} completed`);
  });

  // Log failed jobs
  reminderQueue.on('failed', (job, err) => {
    console.error(`Reminder job ${job.id} failed:`, err.message);
  });
}

module.exports = { scheduleReminder, reminderQueue };