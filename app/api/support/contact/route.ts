import { NextResponse } from 'next/server'
import { sendMail } from '@/lib/email/mailer'

// Simple in-memory rate limiter (per email) – consider Redis/Upstash for production
const WINDOW_MS = 1000 * 60; // 1 minute
const MAX_PER_WINDOW = 3;
const rate: Record<string, { ts: number; count: number }> = {};

function limited(key: string) {
  const now = Date.now();
  const bucket = rate[key];
  if (!bucket || now - bucket.ts > WINDOW_MS) {
    rate[key] = { ts: now, count: 1 };
    return false;
  }
  bucket.count++;
  return bucket.count > MAX_PER_WINDOW;
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, message, locale } = body || {};
    const url = new URL(req.url)
    const dry = url.searchParams.get('dry') === '1'

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string'
    ) {
      return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ ok: false, error: 'missing' }, { status: 400 });
    }
    if (trimmedName.length > 120 || trimmedMessage.length > 5000) {
      return NextResponse.json({ ok: false, error: 'too_long' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }

    if (limited('contact:' + trimmedEmail)) {
      // Silent success to avoid enumeration
      return NextResponse.json({ ok: true, rateLimited: true });
    }

    const supportTo = process.env.SUPPORT_INBOX || 'support@splittra.se';
    const subject = `[Splittra Support] Message from ${trimmedName}`;
    const safeMessage = trimmedMessage.replace(/</g, '&lt;');
    const html = `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;line-height:1.5;padding:16px;background:#f7f9fc;">\n<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">\n<h2 style="margin:0 0 16px;font-size:20px;">New Support Message</h2>\n<p style="margin:0 0 8px;"><strong>Name:</strong> ${trimmedName}</p>\n<p style="margin:0 0 8px;"><strong>Email:</strong> ${trimmedEmail}</p>\n<p style="margin:16px 0 4px;"><strong>Message:</strong></p>\n<div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:8px;background:#fafafa;font-size:14px;">${safeMessage}</div>\n<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>\n<p style="font-size:12px;color:#6b7280;">Locale: ${locale || 'n/a'}</p>\n</div>\n</body></html>`;
    const text = `New support message from ${trimmedName} <${trimmedEmail}>\n\n${trimmedMessage}\n\nLocale: ${locale || 'n/a'}`;

    if (dry) {
      console.log('[support contact dry-run]', { supportTo, subject, trimmedEmail, trimmedName, locale })
      return NextResponse.json({ ok: true, dry: true })
    }

    if (!smtpConfigured()) {
      console.warn('[support contact] SMTP not configured – skipping send and returning ok (set SMTP_HOST, SMTP_USER, SMTP_PASS)')
      return NextResponse.json({ ok: true, skipped: true })
    }

    try {
      await sendMail({ to: supportTo, subject, html, text });
      return NextResponse.json({ ok: true });
    } catch (mailErr) {
      console.error('support mail error', mailErr);
      // Return ok false but not 500 to avoid exposing infra details; client can decide messaging
      return NextResponse.json({ ok: false, error: 'send_fail' }, { status: 500 });
    }
  } catch (e) {
    console.error('support contact fatal', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
