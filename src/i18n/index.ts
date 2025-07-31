import { createI18n } from 'vue-i18n'

// Import translation files
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import fr from './locales/fr.json'

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'ru', 'fr'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en'

// Locale names for display
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  ru: 'Русский',
  fr: 'Français'
}

// Get user's preferred locale from browser/system
function detectUserLocale(): SupportedLocale {
  // Get from localStorage if previously set
  const savedLocale = localStorage.getItem('user-locale')
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)) {
    return savedLocale as SupportedLocale
  }

  // Get from browser language
  const browserLang = navigator.language || (navigator as any).userLanguage
  
  // Check exact match first
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }
  
  // Check language without region (e.g., 'en-US' -> 'en')
  const baseLang = browserLang.split('-')[0]
  if (SUPPORTED_LOCALES.includes(baseLang as SupportedLocale)) {
    return baseLang as SupportedLocale
  }
  
  // Get from navigator.languages array
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      const baseLang = lang.split('-')[0]
      if (SUPPORTED_LOCALES.includes(baseLang as SupportedLocale)) {
        return baseLang as SupportedLocale
      }
    }
  }
  
  return DEFAULT_LOCALE
}

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: detectUserLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  globalInjection: true,
  messages: {
    en,
    de,
    es,
    ru,
    fr
  }
})

// Save locale to localStorage when changed
export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('user-locale', locale)
  document.documentElement.lang = locale
}

// Get current locale
export function getCurrentLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}

export default i18n
