/**
 * Auto-translation utilities to help identify and suggest translations
 * for hardcoded strings in components
 */

import { SUPPORTED_LOCALES } from '@/i18n'

// Common patterns of hardcoded strings that should be translated
const TRANSLATION_PATTERNS = [
  // Button text
  /(?:>|\s+)(Save|Cancel|Delete|Edit|Add|Create|Update|Close|View|Search|Filter|Export|Confirm|Yes|No)(?:<|\s+)/gi,

  // Status text
  /(?:>|\s+)(Active|Inactive|Faulty|Loading|Success|Error|Warning|Info)(?:<|\s+)/gi,

  // Form labels
  /label="([^"]+)"/gi,
  /placeholder="([^"]+)"/gi,

  // Common UI text
  /(?:>|\s+)(Required|Optional|Total|Selected|Actions|Status|Note|Created|Updated)(?:<|\s+)/gi,
]

// Common translation key suggestions
const TRANSLATION_SUGGESTIONS: Record<string, string> = {
  'Save': 'common.save',
  'Cancel': 'common.cancel',
  'Delete': 'common.delete',
  'Edit': 'common.edit',
  'Add': 'common.add',
  'Create': 'common.create',
  'Update': 'common.update',
  'Close': 'common.close',
  'View': 'common.view',
  'Search': 'common.search',
  'Filter': 'common.filter',
  'Export': 'common.export',
  'Actions': 'common.actions',
  'Status': 'common.status',
  'Note': 'common.note',
  'Notes': 'common.notes',
  'Created': 'common.created',
  'Updated': 'common.updated',
  'Loading': 'common.loading',
  'Error': 'common.error',
  'Success': 'common.success',
  'Warning': 'common.warning',
  'Info': 'common.info',
  'Active': 'common.active',
  'Inactive': 'common.inactive',
  'Faulty': 'common.faulty',
  'Required': 'common.required',
  'Optional': 'common.optional',
  'Total': 'common.total',
  'Selected': 'common.selected',
  'Username': 'auth.username',
  'Password': 'auth.password',
  'Login': 'auth.loginButton',
  'Logout': 'navigation.logout',
}

/**
 * Scans component content for hardcoded strings that should be translated
 */
export function scanForUntranslatedStrings(content: string): Array<{
  text: string
  suggestion: string
  pattern: string
}> {
  const findings: Array<{ text: string; suggestion: string; pattern: string }> = []

  TRANSLATION_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      const text = match[1] || match[0].trim()
      const suggestion = TRANSLATION_SUGGESTIONS[text] || `custom.${text?.toLowerCase()}`

      if (!findings.some(f => f.text === text)) {
        findings.push({
          text,
          suggestion,
          pattern: pattern.toString()
        })
      }
    }
  })

  return findings
}

/**
 * Suggests replacement patterns for Vue template strings
 */
export function suggestTranslationReplacement(text: string, suggestion: string): string {
  // Handle different contexts
  if (text.includes('label=')) {
    return text.replace(/label="([^"]+)"/, `:label="$t('${suggestion}')"`)
  }

  if (text.includes('placeholder=')) {
    return text.replace(/placeholder="([^"]+)"/, `:placeholder="$t('${suggestion}')"`)
  }

  // Handle text content
  return `{{ $t('${suggestion}') }}`
}

/**
 * Helper to validate that all required translations exist
 */
export function validateTranslations(requiredKeys: string[]): {
  missing: Array<{ locale: string; key: string }>
  complete: boolean
} {
  const missing: Array<{ locale: string; key: string }> = []

  // This would need to be implemented with actual translation loading
  // For now, it's a placeholder for the concept

  return {
    missing,
    complete: missing.length === 0
  }
}

/**
 * Development helper to log untranslated strings
 */
export function logUntranslatedStrings(componentName: string, content: string): void {
  if (process.env.NODE_ENV === 'development') {
    const findings = scanForUntranslatedStrings(content)

    if (findings.length > 0) {
      console.group(`🌐 Untranslated strings found in ${componentName}:`)
      findings.forEach(finding => {
        console.log(`"${finding.text}" → $t('${finding.suggestion}')`)
        console.log(`  Suggested replacement: ${suggestTranslationReplacement(finding.text, finding.suggestion)}`)
      })
      console.groupEnd()
    }
  }
}

/**
 * Component helper to help detect untranslated strings
 * Usage: Call this function in your component's onMounted hook
 */
export function useTranslationChecker(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    // This would be called from within a component
    const checkTranslations = () => {
      const template = document.querySelector(`[data-component="${componentName}"]`)?.outerHTML || document.body.outerHTML
      logUntranslatedStrings(componentName, template)
    }

    return { checkTranslations }
  }

  return { checkTranslations: () => { } }
}

/**
 * ESLint rule configuration to detect hardcoded strings
 * This is a template for a custom ESLint rule
 */
export const eslintRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect hardcoded strings that should use i18n',
      category: 'Best Practices',
    },
    schema: []
  },
  create(context: any) {
    return {
      Literal(node: any) {
        if (typeof node.value === 'string' && TRANSLATION_SUGGESTIONS[node.value]) {
          context.report({
            node,
            message: `Hardcoded string "${node.value}" should use $t('${TRANSLATION_SUGGESTIONS[node.value]}')`
          })
        }
      }
    }
  }
}

/**
 * Runtime development helper
 */
if (process.env.NODE_ENV === 'development') {
  // Add a global helper for developers
  (window as any).checkTranslations = (element?: HTMLElement) => {
    const target = element || document.body
    const content = target.outerHTML
    const findings = scanForUntranslatedStrings(content)

    if (findings.length > 0) {
      console.table(findings)
    } else {
      console.log('✅ No untranslated strings detected')
    }

    return findings
  }
}
