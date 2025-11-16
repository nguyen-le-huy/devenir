import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); 

// Debug: Log credentials
console.log('Email config:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 10) + '...' : 'UNDEFINED'
});

// Tạo transporter (cấu hình SMTP cho Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Gửi email reset password
 * @param {Object} options - Email options with email, subject, message
 */
export const sendResetEmail = async (options) => {
  const { email, subject, message } = options;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: subject || 'Devenir - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>${message.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};