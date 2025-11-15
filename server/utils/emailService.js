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
 * @param {String} email - Email của user
 * @param {String} resetToken - Reset token
 */
export const sendResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Devenir - Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #333; color: white; text-decoration: none;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};