require('dotenv').config();
const { sendReminderEmail } = require('./utils/emailService');

const testSendEmail = async () => {
  try {
    console.log('📧 Testing email service...');
    console.log('Email user:', process.env.EMAIL_USER);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ EMAIL_USER or EMAIL_PASSWORD not configured in .env');
      return;
    }

    await sendReminderEmail(
      process.env.EMAIL_USER, // Send to yourself
      'Test Task: Complete project report',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      'Test User'
    );

    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Full error:', error);
  }
};

testSendEmail();
