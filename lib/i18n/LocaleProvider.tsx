"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from './locales/en.json'
import sv from './locales/sv.json'
type Locale = 'en' | 'sv'
type Messages = Record<string, string>

const maps: Record<Locale, Messages> = { en, sv }
const dirMap: Record<Locale, 'ltr' | 'rtl'> = { en: 'ltr', sv: 'ltr' }

type I18nContext = {
  locale: Locale
  t: (key: string) => string
  setLocale: (l: Locale) => void
  dir: 'ltr' | 'rtl'
}

const Ctx = createContext<I18nContext | null>(null)

export function LocaleProvider({ children, initialLocale = 'en' as Locale }: { children: React.ReactNode, initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const fromCookie = typeof document !== 'undefined'
      ? (document.cookie.match(/(?:^|; )locale=([^;]+)/)?.[1] as Locale | undefined)
      : undefined
    if (fromCookie && ['en','sv'].includes(fromCookie)) setLocaleState(fromCookie as Locale)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie = `locale=${locale}; path=/; max-age=${60*60*24*365}`
      const html = document.documentElement
      html.setAttribute('lang', locale)
      html.setAttribute('dir', dirMap[locale])
    }
  }, [locale])

  const t = useMemo(() => (key: string) => maps[locale][key] ?? key, [locale])
  const setLocale = (l: Locale) => setLocaleState(l)

  const value = useMemo(() => ({ locale, t, setLocale, dir: dirMap[locale] }), [locale])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}

export function getDirForLocale(l: Locale): 'ltr' | 'rtl' { return dirMap[l] }
export type { Locale }
