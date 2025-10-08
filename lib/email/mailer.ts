import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT || 587)
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const from = process.env.SMTP_FROM || 'Splittra <no-reply@splittra.se>'

if (!host || !user || !pass) {
  // We avoid throwing at import time to not break builds; consumers should handle errors
  console.warn('[mailer] SMTP env vars are missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM')
}

export function getTransporter() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: user!, pass: pass! },
  })
  return transporter
}

export async function sendMail(opts: { to: string; subject: string; html?: string; text?: string; fromOverride?: string }) {
  if (!host || !user || !pass) throw new Error('SMTP not configured')
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: opts.fromOverride || from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
  return info
}
