import { NextRequest } from 'next/server'
import { sendMail } from '@/lib/email/mailer'

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  if (!to) return new Response('Missing ?to=email', { status: 400 })
  try {
    const info = await sendMail({
      to,
      subject: 'Splittra SMTP Test',
      html: '<p>This is a test email from Splittra via SMTP.</p>',
      text: 'This is a test email from Splittra via SMTP.',
    })
    return Response.json({ ok: true, messageId: (info as any).messageId })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'send error' }, { status: 500 })
  }
}
