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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatCurrency = (value = 0) => currencyFormatter.format(value);

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

export const sendOrderConfirmationEmail = async ({ email, order }) => {
  if (!email || !order) {
    throw new Error('Missing email or order data for confirmation email');
  }

  const orderCode = order.paymentIntent?.gatewayOrderCode || order._id;
  const itemsRows = (order.orderItems || []).map((item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} (${item.color}/${item.size})</td>
        <td style="padding: 8px 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
      <h2 style="color: #111;">Thank you for your order!</h2>
      <p>Your payment was successful and we're getting your items ready.</p>
      <p style="margin-bottom: 24px;">Order Code: <strong>#${orderCode}</strong></p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 2px solid #111; padding: 8px 0;">Item</th>
            <th style="text-align: center; border-bottom: 2px solid #111; padding: 8px 0;">Qty</th>
            <th style="text-align: right; border-bottom: 2px solid #111; padding: 8px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="2" style="padding: 12px 0; text-align: left;">Shipping</td>
            <td style="padding: 12px 0; text-align: right;">${formatCurrency(order.shippingPrice || 0)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px 0; text-align: left;"><strong>Total</strong></td>
            <td style="padding: 12px 0; text-align: right;"><strong>${formatCurrency(order.totalPrice || 0)}</strong></td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 24px;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">Shipping to:</p>
        <p style="margin: 0 0 4px 0;">${order.shippingAddress?.street || ''}</p>
        <p style="margin: 0 0 4px 0;">${order.shippingAddress?.city || ''}</p>
        <p style="margin: 0;">${order.shippingAddress?.postalCode || ''}</p>
      </div>
      <p style="margin-top: 24px;">We'll notify you as soon as your parcel is on its way.</p>
      <p style="margin-top: 16px;">— The Devenir Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Your Devenir order #${orderCode} is confirmed`,
      html,
    });
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Order confirmation email error:', error);
    throw error;
  }
};