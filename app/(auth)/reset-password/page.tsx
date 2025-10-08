'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/LocaleProvider'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastEmail, setLastEmail] = useState<string | null>(null)
  const supabase = createClient()
  const { t } = useI18n()

  const send = async (target?: string) => {
    const e = (target || email).trim()
    if (!e) { toast.error(t('emailPlaceholder')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e })
      })
      if (!res.ok) throw new Error('Request failed')
      toast.success(t('passwordResetSentGeneric'))
      setLastEmail(e)
    } catch (err) {
      toast.error(t('resendFailed'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
        <div className="bg-base-200 rounded-2xl shadow-2xl py-10 px-8 flex flex-col items-center w-full max-w-md overflow-hidden border border-base-300">
          <h2 className="text-3xl font-bold mb-4 text-center text-primary">{t('resetPasswordTitle')}</h2>
          <p className="text-base text-gray-500 mb-6 text-center">{t('resetPasswordDescription')}</p>
          <label className="input input-bordered w-full mb-4 flex items-center gap-2">
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="grow"
            />
          </label>
          <button
            className="btn btn-primary w-full rounded-lg mb-4"
            onClick={() => send()}
            disabled={loading}
          >
            {loading ? t('sending') : t('sendPasswordResetLink')}
          </button>
          {lastEmail && (
            <button
              type="button"
              className="btn btn-outline btn-sm mb-4"
              disabled={loading}
              onClick={() => send(lastEmail)}
            >
              {loading ? t('sending') : t('resendPasswordReset')}
            </button>
          )}
          <p className="text-sm text-gray-600 text-center mb-2">
            {t('needHelpContact')} <a href="/support" className="link link-primary">{t('contactSupportInline')}</a>
          </p>
          <p className="text-sm text-gray-600 text-center">
            <a href="/login" className="link link-secondary">{t('backToLogin')}</a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
