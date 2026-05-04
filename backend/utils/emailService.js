const nodemailer = require('nodemailer');

// Configure your email service credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send a reminder email to a user
 * @param {string} to - Recipient email address
 * @param {string} taskDescription - Description of the task
 * @param {string} dueDate - Due date of the task
 * @param {string} assigneeName - Name of the assignee
 * @returns {Promise}
 */
const sendReminderEmail = async (to, taskDescription, dueDate, assigneeName) => {
  try {
    console.log(`📧 [Email Service] Preparing reminder email for ${to}...`);
    
    const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: `Task Reminder: ${taskDescription}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
                📋 Task Reminder
              </h2>
              
              <p style="margin-top: 20px;">Hi <strong>${assigneeName}</strong>,</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Task:</strong> ${taskDescription}</p>
                <p style="margin: 10px 0;"><strong>Due Date:</strong> ${dueDateFormatted}</p>
              </div>
              
              <p>This is a reminder that your task is due soon. Please ensure you complete it on time.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
                <p>This is an automated reminder from AI Meeting Tracker</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    console.log(`📤 [Email Service] Sending email via Gmail...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Email sent successfully to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send email to ${to}:`, error.message);
    console.error(`Error details:`, error);
    throw error;
  }
};

/**
 * Send a meeting notification email
 * @param {string} to - Recipient email address
 * @param {string} meetingTitle - Title of the meeting
 * @param {string} meetingDate - Date of the meeting
 * @param {string} userName - Name of the user
 * @returns {Promise}
 */
const sendMeetingNotificationEmail = async (to, meetingTitle, meetingDate, userName) => {
  try {
    const meetingDateFormatted = new Date(meetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: `Meeting Notification: ${meetingTitle}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px;">
                📅 Meeting Notification
              </h2>
              
              <p style="margin-top: 20px;">Hi <strong>${userName}</strong>,</p>
              
              <p>You have been invited to the following meeting:</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Meeting:</strong> ${meetingTitle}</p>
                <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${meetingDateFormatted}</p>
              </div>
              
              <p>Please make sure to attend on time.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
                <p>This is an automated notification from AI Meeting Tracker</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Meeting notification sent successfully to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`Failed to send meeting notification to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  sendReminderEmail,
  sendMeetingNotificationEmail,
};
