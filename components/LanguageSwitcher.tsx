"use client"
import { useI18n, type Locale } from '@/lib/i18n/LocaleProvider'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'

const labels: Record<Locale, string> = { en: 'English', sv: 'Svenska' }

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const select = (l: Locale) => {
    setLocale(l)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="hidden sm:inline text-gray-700">{labels[locale]}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
          <ul role="listbox" aria-label={t('language')} className="py-1 text-sm">
            {(['en','sv'] as Locale[]).map(l => (
              <li key={l} role="option" aria-selected={locale === l}>
                <button
                  onClick={() => select(l)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${locale === l ? 'bg-gray-100 font-medium' : ''}`}
                >
                  {labels[l]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
