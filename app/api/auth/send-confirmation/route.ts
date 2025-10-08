import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/email/adminClient'
import { sendMail } from '@/lib/email/mailer'
import { renderConfirmEmailTemplate } from '@/lib/email/templates/confirmEmailTemplate'

const EMAIL_WINDOW_MS = 1000 * 60
const EMAIL_MAX = 5
const memoryRate: Record<string, { count: number; ts: number }> = {}

function rateLimit(key: string) {
  const now = Date.now()
  const bucket = memoryRate[key]
  if (!bucket || now - bucket.ts > EMAIL_WINDOW_MS) {
    memoryRate[key] = { count: 1, ts: now }
    return false
  }
  bucket.count++
  return bucket.count > EMAIL_MAX
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const norm = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
      return NextResponse.json({ ok: true })
    }

    if (rateLimit('confirm:' + norm)) {
      return NextResponse.json({ ok: true })
    }

    const admin = getAdminClient()
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
    const redirectTo = baseUrl.replace(/\/$/, '') + '/verify'

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: norm,
      options: { redirectTo }
    } as any)

    if (error) {
      console.error('generateLink signup error', error)
      return NextResponse.json({ ok: true })
    }

    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link
    if (!actionLink) {
      console.warn('No action_link returned for confirmation')
      return NextResponse.json({ ok: true })
    }

    const html = renderConfirmEmailTemplate({ actionLink, supportUrl: baseUrl + '/support' })
    try {
      await sendMail({ to: norm, subject: 'Confirm your Splittra email', html, text: actionLink })
    } catch (mailErr) {
      console.error('sendMail confirmation error', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('send-confirmation fatal', e)
    return NextResponse.json({ ok: true })
  }
}
