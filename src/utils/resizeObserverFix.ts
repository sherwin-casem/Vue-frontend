// Fix for ResizeObserver loop errors that cause performance issues
// This handles the common ResizeObserver loop completed with undelivered notifications error

let resizeObserverErrorThrottle: NodeJS.Timeout | null = null

// Override the ResizeObserver error handling to prevent flooding
const originalError = window.console.error
window.console.error = (...args: any[]) => {
  // Check if this is a ResizeObserver error
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    // Throttle the error logging to prevent performance issues
    if (!resizeObserverErrorThrottle) {
      resizeObserverErrorThrottle = setTimeout(() => {
        originalError.call(console, 'ResizeObserver loop error (throttled)')
        resizeObserverErrorThrottle = null
      }, 1000)
    }
    return
  }
  // Allow other errors to pass through normally
  originalError.apply(console, args)
}

// Debounced resize observer helper
export function createDebouncedResizeObserver(
  callback: ResizeObserverCallback,
  delay: number = 100
): ResizeObserver {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      try {
        callback(entries, observer)
      } catch (error) {
        // Silently handle ResizeObserver errors to prevent performance issues
        if (!(error instanceof Error && error.message.includes('ResizeObserver'))) {
          console.error('Resize observer error:', error)
        }
      }
    }, delay)
  }

  return new ResizeObserver(debouncedCallback)
}

// Performance optimized ResizeObserver
export function createOptimizedResizeObserver(
  callback: ResizeObserverCallback,
  options: {
    throttle?: number
    debounce?: number
    immediate?: boolean
  } = {}
): ResizeObserver {
  const { throttle = 16, debounce = 100, immediate = false } = options

  let lastCallTime = 0
  let timeoutId: NodeJS.Timeout | null = null
  let lastEntries: ResizeObserverEntry[] = []

  const optimizedCallback: ResizeObserverCallback = (entries, observer) => {
    const now = Date.now()
    lastEntries = entries

    // Immediate execution on first call if requested
    if (immediate && lastCallTime === 0) {
      try {
        callback(entries, observer)
        lastCallTime = now
      } catch (error) {
        // Suppress ResizeObserver errors
        if (!(error instanceof Error && error.message.includes('ResizeObserver'))) {
          console.error('Resize observer error:', error)
        }
      }
      return
    }

    // Throttling
    if (now - lastCallTime < throttle) {
      return
    }

    // Debouncing
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      try {
        callback(lastEntries, observer)
        lastCallTime = Date.now()
      } catch (error) {
        // Suppress ResizeObserver errors
        if (!(error instanceof Error && error.message.includes('ResizeObserver'))) {
          console.error('Resize observer error:', error)
        }
      }
    }, debounce)
  }

  return new ResizeObserver(optimizedCallback)
}

export default {
  createDebouncedResizeObserver,
  createOptimizedResizeObserver
}
