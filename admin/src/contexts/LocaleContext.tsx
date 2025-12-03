import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getTranslation, type Locale } from "@/locales/translations"

interface LocaleContextValue {
  locale: Locale
  setLocale: (value: Locale) => void
  t: (key: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)
const STORAGE_KEY = "devenir-admin-locale"

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "vi"
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    return stored ?? "vi"
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value)
  }, [])

  const translate = useCallback(
    (key: string, fallback?: string) => {
      return getTranslation(locale, key) ?? fallback ?? key
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t: translate }), [locale, setLocale, translate])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return context
}
