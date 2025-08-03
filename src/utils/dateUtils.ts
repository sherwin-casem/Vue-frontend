/**
 * Date utility functions for consistent date formatting and manipulation
 */

/**
 * Formats a date string to dd/mm/yyyy format
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-GB') // dd/mm/yyyy format
  } catch {
    return ''
  }
}

/**
 * Formats a date string to dd/mm/yyyy HH:mm format
 */
export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return (
      date.toLocaleDateString('en-GB') +
      ' ' +
      date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    )
  } catch {
    return ''
  }
}

/**
 * Formats duration in seconds to a human readable format
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds === 0) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts: string[] = []

  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`)

  return parts.join(' ')
}

/**
 * Converts date string to ISO date string for date inputs
 */
export const toDateInputValue = (dateString?: string | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * Converts date input value to ISO string
 */
export const fromDateInputValue = (dateValue: string): string => {
  if (!dateValue) return ''
  try {
    const date = new Date(dateValue + 'T00:00:00.000Z')
    return date.toISOString()
  } catch {
    return ''
  }
}

/**
 * Checks if a date string is valid
 */
export const isValidDate = (dateString?: string | null): boolean => {
  if (!dateString) return false
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}
