const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Determine sender email based on environment
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@resend.dev';

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

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
              📋 Task Reminder
            </h2>
            
            <p style="margin-top: 20px;">Hi,</p>
            
            <p>This is a reminder about an action item from your meeting:</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Task:</strong> ${taskDescription}</p>
              <p style="margin: 10px 0;"><strong>Assigned to:</strong> ${assigneeName}</p>
              <p style="margin: 10px 0;"><strong>Due Date:</strong> ${dueDateFormatted}</p>
            </div>
            
            <p>Please ensure this action item is completed on time.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
              <p>This is an automated reminder from AI Meeting Tracker</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`📤 [Email Service] Sending email via Resend...`);
    const info = await resend.emails.send({
      from: SENDER_EMAIL,
      to: to,
      subject: `Task Reminder: ${taskDescription}`,
      html: htmlContent,
    });
    
    console.log(`✅ [Email Service] Email sent successfully to ${to}: ${info.id}`);
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

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
              📅 Meeting Notification
            </h2>
            
            <p style="margin-top: 20px;">Hi ${userName},</p>
            
            <p>You have a new meeting scheduled:</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Meeting:</strong> ${meetingTitle}</p>
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${meetingDateFormatted}</p>
            </div>
            
            <p>Please make sure you're available at the scheduled time.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
              <p>This is an automated notification from AI Meeting Tracker</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`📤 [Email Service] Sending meeting notification to ${to}...`);
    const info = await resend.emails.send({
      from: SENDER_EMAIL,
      to: to,
      subject: `Meeting Notification: ${meetingTitle}`,
      html: htmlContent,
    });

    console.log(`✅ [Email Service] Meeting notification sent to ${to}: ${info.id}`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send meeting notification to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send an OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password
 * @param {string} userName - Name of the user
 * @returns {Promise}
 */
const sendOTPEmail = async (to, otp, userName) => {
  try {
    console.log(`📧 [Email Service] Preparing OTP email for ${to}...`);

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
              🔐 Password Reset OTP
            </h2>
            
            <p style="margin-top: 20px;">Hi ${userName},</p>
            
            <p>You requested a password reset. Use the following one-time password to reset your password:</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50; margin: 10px 0;">${otp}</p>
              <p style="color: #7f8c8d; margin: 10px 0; font-size: 14px;">This OTP is valid for 10 minutes</p>
            </div>
            
            <p style="color: #e74c3c;"><strong>⚠️ Important:</strong> Never share this OTP with anyone. Our team will never ask for it.</p>
            
            <p>If you didn't request a password reset, please ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
              <p>This is an automated email from AI Meeting Tracker</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`📤 [Email Service] Sending OTP email via Resend...`);
    const info = await resend.emails.send({
      from: SENDER_EMAIL,
      to: to,
      subject: 'Password Reset OTP - AI Meeting Tracker',
      html: htmlContent,
    });

    console.log(`✅ [Email Service] OTP email sent successfully to ${to}: ${info.id}`);
    return info;
  } catch (error) {
    console.error(`Failed to send password reset OTP email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  sendReminderEmail,
  sendMeetingNotificationEmail,
  sendOTPEmail,
};