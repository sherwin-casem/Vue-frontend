import { useI18n } from 'vue-i18n'

/**
 * Translation Validation Utilities
 * Helps detect untranslated text and provides development tools
 */

interface UntranslatedText {
  text: string
  location: string
  element: HTMLElement
  context?: string
}

interface TranslationReport {
  untranslatedTexts: UntranslatedText[]
  missingKeys: string[]
  recommendations: string[]
}

/**
 * Common patterns of hardcoded English text that should be translated
 */
const COMMON_ENGLISH_PATTERNS = [
  // Form labels and inputs
  /^(Name|Address|Email|Phone|Password|Username|Search|Filter)$/i,
  /^(First Name|Last Name|Full Name|Company|Organization)$/i,
  /^(Street|City|State|Country|Postal Code|ZIP Code)$/i,

  // Actions and buttons
  /^(Save|Cancel|Delete|Edit|Create|Update|Submit|Close|Open)$/i,
  /^(Add|Remove|Clear|Reset|Refresh|Export|Import|Download)$/i,
  /^(Login|Logout|Sign In|Sign Out|Register|Sign Up)$/i,
  /^(View|Show|Hide|Toggle|Select|Choose|Pick)$/i,

  // Status and states
  /^(Active|Inactive|Enabled|Disabled|Available|Unavailable)$/i,
  /^(Online|Offline|Connected|Disconnected|Pending|Processing)$/i,
  /^(Complete|Completed|In Progress|Failed|Success|Error)$/i,
  /^(Loading|Saving|Deleting|Creating|Updating)\.\.\.$/i,

  // Navigation and pages
  /^(Home|Dashboard|Settings|Profile|Help|About|Contact)$/i,
  /^(Previous|Next|First|Last|Page|of|Total|Items)$/i,

  // Common words and phrases
  /^(Yes|No|OK|Cancel|Continue|Back|Forward|Skip)$/i,
  /^(Required|Optional|Please|Thank you|Welcome|Hello)$/i,
  /^(All|None|Any|Other|More|Less|New|Old)$/i,

  // Table headers
  /^(ID|Name|Description|Date|Time|Status|Actions|Type)$/i,
  /^(Created|Updated|Modified|Last Modified|By|User|Owner)$/i,

  // Messages
  /^(No data|No results|Not found|Empty|Loading)$/i,
  /^(Are you sure|Confirm|Warning|Information|Note)$/i,
  /^(Successfully|Failed to|Unable to|Error occurred).*$/i,

  // OCPP specific terms
  /^(Charge Point|Charging Station|Connector|Site|Location)$/i,
  /^(Energy|Power|Current|Voltage|Session|Transaction)$/i,
  /^(Start|Stop|Authorize|Reserve|Available|Occupied)$/i,
  /^(Manufacturer|Model|Serial|Firmware|Version)$/i
]

/**
 * CSS selectors for elements that commonly contain user-facing text
 */
const TEXT_SELECTORS = [
  'h1, h2, h3, h4, h5, h6',
  'p, span, div:not(.v-icon)',
  'button:not(.v-icon-btn)',
  'label',
  'th, td',
  '.v-card-title, .v-card-subtitle',
  '.v-list-item-title, .v-list-item-subtitle',
  '.v-btn:not(.v-icon-btn)',
  '.v-tab',
  '.v-chip',
  '.v-alert',
  '.v-tooltip > *',
  'input[placeholder], textarea[placeholder]'
]

/**
 * Scan DOM for potentially untranslated text
 */
export function scanForUntranslatedText(): TranslationReport {
  const untranslatedTexts: UntranslatedText[] = []
  const missingKeys: string[] = []
  const recommendations: string[] = []

  // Get all text-containing elements
  const textElements = document.querySelectorAll(TEXT_SELECTORS.join(', '))

  textElements.forEach((element) => {
    const text = element.textContent?.trim()
    if (!text || text.length === 0) return

    // Skip elements with only numbers, symbols, or very short text
    if (/^[\d\s\-_.,!@#$%^&*()+=<>?/\\|[\]{}~`]*$/.test(text) || text.length < 2) return

    // Check if text matches common English patterns
    const isLikelyEnglish = COMMON_ENGLISH_PATTERNS.some(pattern => pattern.test(text))

    if (isLikelyEnglish) {
      untranslatedTexts.push({
        text,
        location: getElementPath(element as HTMLElement),
        element: element as HTMLElement,
        context: getElementContext(element as HTMLElement)
      })
    }
  })

  // Generate recommendations
  if (untranslatedTexts.length > 0) {
    recommendations.push(`Found ${untranslatedTexts.length} potentially untranslated text elements`)
    recommendations.push('Consider wrapping these texts with $t() function')
    recommendations.push('Add corresponding keys to translation files')
  }

  return {
    untranslatedTexts,
    missingKeys,
    recommendations
  }
}

/**
 * Get CSS path to element for debugging
 */
function getElementPath(element: HTMLElement): string {
  const path = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    let selector = current.tagName?.toLowerCase()

    if (current.id) {
      selector += `#${current.id}`
    } else if (current.className) {
      const classes = Array.from(current.classList)
        .filter(cls => !cls.startsWith('v-') || cls === 'v-btn' || cls === 'v-card-title')
        .slice(0, 2)
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`
      }
    }

    path.unshift(selector)
    current = current.parentElement
  }

  return path.join(' > ')
}

/**
 * Get context information about element
 */
function getElementContext(element: HTMLElement): string {
  const context = []

  // Check if it's in a specific Vue component
  const card = element.closest('.v-card')
  if (card) {
    const title = card.querySelector('.v-card-title')?.textContent
    if (title) context.push(`Card: ${title}`)
  }

  const dialog = element.closest('.v-dialog')
  if (dialog) context.push('Dialog')

  const form = element.closest('form, .v-form')
  if (form) context.push('Form')

  const table = element.closest('.v-data-table')
  if (table) context.push('Data Table')

  return context.join(', ') || 'General'
}

/**
 * Auto-generate translation keys from English text
 */
export function generateTranslationKey(text: string, context?: string): string {
  // Clean and normalize text
  let key = text?.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length

  // Add context prefix
  if (context) {
    const contextKey = context?.toLowerCase().replace(/\s+/g, '_')
    key = `${contextKey}.${key}`
  }

  return key
}

/**
 * Console helper for development
 */
export function logTranslationReport(): void {
  if (process.env.NODE_ENV !== 'development') return

  try {
    const report = scanForUntranslatedText()

    console.group('🌐 Translation Report')

    if (report.untranslatedTexts.length > 0) {
      console.group(`⚠️ Potentially Untranslated Text (${report.untranslatedTexts.length})`)
      report.untranslatedTexts.forEach(item => {
        console.log(`"${item.text}" in ${item.location}`)
        console.log(`  Context: ${item.context}`)
        console.log(`  Suggested key: ${generateTranslationKey(item.text, item.context)}`)
        console.log('---')
      })
      console.groupEnd()
    }

    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations')
      report.recommendations.forEach(rec => console.log(rec))
      console.groupEnd()
    }

    if (report.untranslatedTexts.length === 0) {
      console.log('✅ All text appears to be properly translated!')
    }

    console.groupEnd()
  } catch (error) {
    console.warn('Translation report temporarily disabled due to Vue setup restrictions')
  }
}

/**
 * Vue composable for translation checking
 */
export function useTranslationChecker() {
  const { t, te } = useI18n()

  /**
   * Check if a translation key exists
   */
  const keyExists = (key: string): boolean => {
    return te(key)
  }

  /**
   * Get translation or fallback to key name
   */
  const safeTranslate = (key: string, fallback?: string): string => {
    if (te(key)) {
      return t(key)
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${key}`)
    }

    return fallback || key
  }

  /**
   * Validate that all required keys exist for a feature
   */
  const validateFeatureKeys = (feature: string, requiredKeys: string[]): string[] => {
    const missing: string[] = []

    requiredKeys.forEach(key => {
      const fullKey = `${feature}.${key}`
      if (!te(fullKey)) {
        missing.push(fullKey)
      }
    })

    return missing
  }

  return {
    keyExists,
    safeTranslate,
    validateFeatureKeys,
    scanForUntranslatedText,
    logTranslationReport
  }
}

/**
 * Development helper to automatically run translation checks
 */
if (process.env.NODE_ENV === 'development') {
  // Run check after DOM is loaded
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(logTranslationReport, 2000) // Wait for Vue to render
    })

      // Add global helper
      ; (window as any).checkTranslations = logTranslationReport
  }
}
