/**
 * Translation Development Plugin
 * Provides runtime translation validation and auto-detection helpers
 */

import type { App, ComponentInternalInstance } from 'vue'
import { logTranslationReport, useTranslationChecker } from '@/utils/translationValidator'

// Extend Window interface for TypeScript
declare global {
  interface Window {
    checkTranslations: typeof logTranslationReport
  }
}

export interface TranslationDevOptions {
  enabled?: boolean
  autoCheck?: boolean
  checkInterval?: number
  showNotifications?: boolean
}

const defaultOptions: TranslationDevOptions = {
  enabled: process.env.NODE_ENV === 'development',
  autoCheck: true,
  checkInterval: 5000, // 5 seconds
  showNotifications: true
}

let checkTimer: number | null = null

/**
 * Translation Development Plugin
 */
export const translationDevPlugin = {
  install(app: App, options: TranslationDevOptions = {}) {
    const opts = { ...defaultOptions, ...options }

    if (!opts.enabled) return

    // Add global properties
    app.config.globalProperties.$checkTranslations = logTranslationReport
    app.config.globalProperties.$translationChecker = useTranslationChecker

    // Add to window for console access
    if (typeof window !== 'undefined') {
      window.checkTranslations = logTranslationReport

      // Auto-check feature
      if (opts.autoCheck) {
        // Initial check after app is mounted
        app.mixin({
          mounted() {
            if (this.$el === document.body.firstElementChild) {
              // This is likely the root component
              setTimeout(() => {
                console.log('🌐 Running initial translation check...')
                logTranslationReport()

                // Set up periodic checks
                if (opts.checkInterval && opts.checkInterval > 0) {
                  checkTimer = window.setInterval(() => {
                    logTranslationReport()
                  }, opts.checkInterval)
                }
              }, 2000)
            }
          },

          beforeUnmount() {
            if (checkTimer) {
              clearInterval(checkTimer)
              checkTimer = null
            }
          }
        })
      }

      // Add keyboard shortcut (Ctrl+Shift+T)
      document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
          event.preventDefault()
          console.log('🌐 Manual translation check triggered')
          logTranslationReport()
        }
      })

      // Add dev tools helper
      console.log('%c🌐 Translation Dev Tools Loaded', 'color: #42b883; font-weight: bold')
      console.log('Available commands:')
      console.log('• window.checkTranslations() - Check for untranslated text')
      console.log('• Ctrl+Shift+T - Quick translation check')
      if (opts.checkInterval) {
        console.log('• Auto-check every', opts.checkInterval / 1000, 'seconds')
      }
    }
  }
}

/**
 * Enhanced translation checking for specific components
 */
export function createTranslationMixin() {
  return {
    methods: {
      $validateTranslations(requiredKeys: string[] = []) {
        const { validateFeatureKeys } = useTranslationChecker()
        const componentName = (this as any).$options?.name || 'Unknown Component'

        if (requiredKeys.length > 0) {
          const missing = validateFeatureKeys(componentName?.toLowerCase(), requiredKeys)
          if (missing.length > 0) {
            console.warn(`${componentName} missing translation keys:`, missing)
          }
        }

        // Check for untranslated text in this component's element
        const el = (this as any).$el as HTMLElement
        if (el) {
          const walker = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            null
          )

          const untranslated: string[] = []
          let node
          while ((node = walker.nextNode())) {
            const text = node.textContent?.trim()
            if (text && /^[A-Z][a-z\s]+$/.test(text) && text.length > 2) {
              untranslated.push(text)
            }
          }

          if (untranslated.length > 0) {
            console.warn(`${componentName} potentially untranslated text:`, untranslated)
          }
        }
      }
    },

    mounted() {
      // Auto-validate on mount in development
      if (process.env.NODE_ENV === 'development') {
        (this as any).$nextTick(() => {
          (this as any).$validateTranslations()
        })
      }
    }
  }
}

/**
 * Directive for marking translatable content
 */
export const vTranslatable = {
  mounted(el: HTMLElement, binding: any) {
    if (process.env.NODE_ENV !== 'development') return

    const key = binding.value
    if (!key) {
      console.warn('v-translatable directive requires a translation key')
      return
    }

    // Add development indicator
    el.setAttribute('data-translation-key', key)
    el.style.position = 'relative'

    // Add hover indicator
    const indicator = document.createElement('div')
    indicator.textContent = '🌐'
    indicator.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      z-index: 9999;
    `

    el.appendChild(indicator)

    el.addEventListener('mouseenter', () => {
      indicator.style.opacity = '1'
    })

    el.addEventListener('mouseleave', () => {
      indicator.style.opacity = '0'
    })
  }
}

export default translationDevPlugin
