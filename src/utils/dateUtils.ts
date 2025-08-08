/**
 * Date utility functions for consistent date formatting and manipulation
 */

/**
 * Formats a date string to dd/mm/yyyy format
 */
export function formatDateTime(
  value: string | Date | null,
  locale = 'de-DE'
): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
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
