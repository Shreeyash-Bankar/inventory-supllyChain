import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};
