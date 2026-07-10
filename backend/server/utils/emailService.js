const nodemailer = require('nodemailer');

const isEmailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );

const createTransport = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getClientUrl = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
};

const sendPasswordResetEmail = async ({ to, resetToken }) => {
  const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const subject = 'Reset your TravelTogether password';
  const text = `You requested a password reset. Open this link within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
  const html = `
    <p>You requested a password reset for TravelTogether.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
  `;

  const transport = createTransport();

  if (!transport) {
    console.info('[email] SMTP not configured. Password reset link for development:');
    console.info(resetUrl);
    return { delivered: false, resetUrl };
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true };
};

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};
