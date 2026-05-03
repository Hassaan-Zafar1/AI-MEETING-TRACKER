const Bull = require('bull');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');

// Create a queue named 'reminders' connected to Redis
// Bull uses Redis to persist jobs — if server restarts, jobs survive
const reminderQueue = new Bull('reminders', {
  redis: process.env.REDIS_URL,
});

// Define what happens when a job is processed
// This function runs when a scheduled reminder fires
reminderQueue.process(async (job) => {
  const { taskId, taskDescription, assigneeName, assigneeId, dueDate } = job.data;

  console.log(`Processing reminder for task: "${taskDescription}"`);

  try {
    // Fetch user email from database if assigneeId is provided
    let userEmail = null;
    if (assigneeId) {
      const user = await User.findById(assigneeId).select('email');
      if (user) {
        userEmail = user.email;
      }
    }

    // Send email reminder if email is available
    if (userEmail) {
      await sendReminderEmail(userEmail, taskDescription, dueDate, assigneeName);
      console.log(`Reminder email sent for task: "${taskDescription}" to ${userEmail}`);
    } else {
      console.warn(
        `No email found for assignee "${assigneeName}". Task: "${taskDescription}"`
      );
    }
  } catch (error) {
    console.error(`Error processing reminder job for task "${taskDescription}":`, error.message);
    throw error; // Re-throw to trigger retry logic
  }
});

// This function schedules a reminder job
const scheduleReminder = async (task) => {
  if (!task.dueDate) return;

  // Calculate how many milliseconds until 24 hours before the due date
  const reminderTime = new Date(task.dueDate).getTime() - 24 * 60 * 60 * 1000;
  const delay = reminderTime - Date.now();

  // Only schedule if the reminder is in the future
  if (delay <= 0) {
    console.log(`Task "${task.description}" is already past reminder time`);
    return;
  }

  // Add job to queue with a delay
  await reminderQueue.add(
    {
      taskId: task._id,
      taskDescription: task.description,
      assigneeName: task.assigneeName,
      assigneeId: task.assignee, // Pass the assignee ID to fetch email later
      dueDate: task.dueDate,
    },
    {
      delay,           // fires after this many milliseconds
      attempts: 3,     // retry up to 3 times if it fails
      backoff: 5000,   // wait 5 seconds between retries
    }
  );

  console.log(`Reminder scheduled for task: "${task.description}"`);
};

// Log successful jobs
reminderQueue.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

// Log failed jobs
reminderQueue.on('failed', (job, err) => {
  console.error(`Reminder job ${job.id} failed:`, err.message);
});

module.exports = { scheduleReminder, reminderQueue };