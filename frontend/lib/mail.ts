import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_PORT
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      })
    : null;

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  if (!transporter) {
    console.log("[Mail] Password reset (no SMTP configured):", { to, resetLink });
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "noreply@example.com",
    to,
    subject: "Reset Password",
    text: `You requested a password reset. Open this link to set a new password (expires in 60 minutes):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset Password</a></p><p>This link expires in 60 minutes.</p><p>If you did not request this, ignore this email.</p>`,
  });
}

export async function sendInviteEmail(to: string, workspaceName: string, inviteLink: string): Promise<void> {
  if (!transporter) {
    console.log("[Mail] Invite (no SMTP configured):", { to, workspaceName, inviteLink });
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "noreply@example.com",
    to,
    subject: `Invitation to join ${workspaceName}`,
    text: `You have been invited to join the workspace "${workspaceName}". Open this link to accept:\n${inviteLink}`,
    html: `<p>You have been invited to join the workspace <strong>${workspaceName}</strong>.</p><p><a href="${inviteLink}">Accept invitation</a></p>`,
  });
}
