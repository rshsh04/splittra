import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/email/adminClient'
import { sendMail } from '@/lib/email/mailer'
import { renderResetPasswordEmail } from '@/lib/email/templates/resetPasswordTemplate'

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

    if (rateLimit('reset:' + norm)) {
      return NextResponse.json({ ok: true }) // silent
    }

    const admin = getAdminClient()
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
    const redirectTo = baseUrl.replace(/\/$/, '') + '/recovery'

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: norm,
      options: { redirectTo }
    } as any) // adjust typing for supabase-js version

    if (error) {
      console.error('generateLink recovery error', error)
      return NextResponse.json({ ok: true })
    }

    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link
    if (!actionLink) {
      console.warn('No action_link returned for reset')
      return NextResponse.json({ ok: true })
    }

    const html = renderResetPasswordEmail({ actionLink, supportUrl: baseUrl + '/support' })
    try {
      await sendMail({ to: norm, subject: 'Reset your Splittra password', html, text: actionLink })
    } catch (mailErr) {
      console.error('sendMail reset error', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('send-reset fatal', e)
    return NextResponse.json({ ok: true })
  }
}
