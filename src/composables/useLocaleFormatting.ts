import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Composable for locale-aware formatting of dates, numbers, and currencies
 * Supports proper German decimal formatting (comma) and other locale conventions
 */
export function useLocaleFormatting() {
  const { locale } = useI18n()

  // Get current locale for formatting
  const currentLocale = computed(() => {
    const loc = locale.value as string

    // Map our supported locales to proper BCP 47 language tags
    const localeMap: Record<string, string> = {
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      ru: 'ru-RU'
    }

    return localeMap[loc] || 'en-US'
  })

  /**
   * Format number according to current locale
   * German: 1.234,56 (comma as decimal separator)
   * English: 1,234.56 (period as decimal separator)
   */
  const formatNumber = (value: number | string, decimals?: number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) return '0'

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? (num % 1 === 0 ? 0 : 2)
    }

    return new Intl.NumberFormat(currentLocale.value, options).format(num)
  }

  /**
   * Format currency according to current locale
   */
  const formatCurrency = (value: number | string, currency = 'EUR'): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) return '0 €'

    return new Intl.NumberFormat(currentLocale.value, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  /**
   * Format percentage according to current locale
   */
  const formatPercentage = (value: number | string, decimals = 1): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) return '0%'

    return new Intl.NumberFormat(currentLocale.value, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num / 100)
  }

  /**
   * Format date according to current locale
   * German: 24.12.2023
   * English: 12/24/2023
   */
  const formatDate = (date: Date | string | number): string => {
    const d = new Date(date)

    if (isNaN(d.getTime())) return '-'

    return new Intl.DateTimeFormat(currentLocale.value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)
  }

  /**
   * Format date and time according to current locale
   * German: 24.12.2023, 14:30
   * English: 12/24/2023, 2:30 PM
   */
  const formatDateTime = (date: Date | string | number): string => {
    const d = new Date(date)

    if (isNaN(d.getTime())) return '-'

    return new Intl.DateTimeFormat(currentLocale.value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  }

  /**
   * Format time according to current locale
   * German: 14:30 (24-hour)
   * English: 2:30 PM (12-hour)
   */
  const formatTime = (date: Date | string | number): string => {
    const d = new Date(date)

    if (isNaN(d.getTime())) return '-'

    return new Intl.DateTimeFormat(currentLocale.value, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  }

  /**
   * Format relative time (e.g., "2 hours ago", "vor 2 Stunden")
   */
  const formatRelativeTime = (date: Date | string | number): string => {
    const d = new Date(date)

    if (isNaN(d.getTime())) return '-'

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    const rtf = new Intl.RelativeTimeFormat(currentLocale.value, {
      numeric: 'auto',
      style: 'long'
    })

    if (diffDays > 0) {
      return rtf.format(-diffDays, 'day')
    } else if (diffHours > 0) {
      return rtf.format(-diffHours, 'hour')
    } else if (diffMinutes > 0) {
      return rtf.format(-diffMinutes, 'minute')
    } else {
      return rtf.format(-diffSeconds, 'second')
    }
  }

  /**
   * Format file size according to current locale
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    const value = bytes / Math.pow(k, i)
    const formattedValue = formatNumber(value, i > 0 ? 1 : 0)

    return `${formattedValue} ${sizes[i]}`
  }

  /**
   * Format duration (seconds) to human readable format
   * German: "2 Std. 30 Min."
   * English: "2h 30m"
   */
  const formatDuration = (seconds: number): string => {
    if (seconds < 0) return '0s'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts: string[] = []

    if (hours > 0) {
      if (currentLocale.value.startsWith('de')) {
        parts.push(`${hours} Std.`)
      } else {
        parts.push(`${hours}h`)
      }
    }

    if (minutes > 0) {
      if (currentLocale.value.startsWith('de')) {
        parts.push(`${minutes} Min.`)
      } else {
        parts.push(`${minutes}m`)
      }
    }

    if (secs > 0 && hours === 0) {
      if (currentLocale.value.startsWith('de')) {
        parts.push(`${secs} Sek.`)
      } else {
        parts.push(`${secs}s`)
      }
    }

    return parts.join(' ') || '0s'
  }

  /**
   * Format power values with proper units (kW, MW)
   */
  const formatPower = (watts: number | string, unit: 'W' | 'kW' | 'MW' = 'kW'): string => {
    const w = typeof watts === 'string' ? parseFloat(watts) : watts

    if (isNaN(w)) return '0 kW'

    let value = w
    let displayUnit = unit

    // Auto-convert units for better readability
    if (unit === 'W') {
      if (w >= 1000000) {
        value = w / 1000000
        displayUnit = 'MW'
      } else if (w >= 1000) {
        value = w / 1000
        displayUnit = 'kW'
      }
    } else if (unit === 'kW' && w >= 1000) {
      value = w / 1000
      displayUnit = 'MW'
    }

    const formattedValue = formatNumber(value, value < 10 ? 1 : 0)
    return `${formattedValue} ${displayUnit}`
  }

  /**
   * Format energy values with proper units (kWh, MWh)
   */
  const formatEnergy = (wattHours: number | string, unit: 'Wh' | 'kWh' | 'MWh' = 'kWh'): string => {
    const wh = typeof wattHours === 'string' ? parseFloat(wattHours) : wattHours

    if (isNaN(wh)) return '0 kWh'

    let value = wh
    let displayUnit = unit

    // Auto-convert units for better readability
    if (unit === 'Wh') {
      if (wh >= 1000000) {
        value = wh / 1000000
        displayUnit = 'MWh'
      } else if (wh >= 1000) {
        value = wh / 1000
        displayUnit = 'kWh'
      }
    } else if (unit === 'kWh' && wh >= 1000) {
      value = wh / 1000
      displayUnit = 'MWh'
    }

    const formattedValue = formatNumber(value, value < 10 ? 2 : 1)
    return `${formattedValue} ${displayUnit}`
  }

  /**
   * Parse user input number considering locale decimal separator
   */
  const parseLocalNumber = (input: string): number => {
    if (!input) return 0

    // German uses comma as decimal separator
    if (currentLocale.value.startsWith('de')) {
      // Replace comma with period for parsing
      const normalized = input.replace(',', '.')
      return parseFloat(normalized) || 0
    }

    return parseFloat(input) || 0
  }

  /**
   * Get decimal separator for current locale
   */
  const getDecimalSeparator = (): string => {
    return currentLocale.value.startsWith('de') ? ',' : '.'
  }

  /**
   * Get thousands separator for current locale
   */
  const getThousandsSeparator = (): string => {
    return currentLocale.value.startsWith('de') ? '.' : ','
  }

  return {
    currentLocale,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    formatFileSize,
    formatDuration,
    formatPower,
    formatEnergy,
    parseLocalNumber,
    getDecimalSeparator,
    getThousandsSeparator
  }
}
