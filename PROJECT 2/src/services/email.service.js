const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

const buildTransporter = () =>
  nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });

/**
 * Sends an email. In development/test, if SMTP credentials are not
 * configured, this simply logs the message instead of failing the request
 * — so the rest of the flow (e.g. forgot-password) still works locally.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!config.smtp.host || !config.smtp.user) {
    logger.warn(`SMTP not configured. Skipping email send. Would have sent to ${to}: ${subject}`);
    return { skipped: true };
  }

  const transporter = buildTransporter();
  return transporter.sendMail({ from: config.smtp.from, to, subject, html });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Hi ${user.name},</p>
           <p>You requested a password reset. Click the link below (valid for 15 minutes):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you did not request this, please ignore this email.</p>`,
  });
};

const sendVerificationEmail = async (user, verifyToken) => {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${verifyToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    html: `<p>Hi ${user.name},</p>
           <p>Please verify your email by clicking the link below (valid for 24 hours):</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendVerificationEmail };
