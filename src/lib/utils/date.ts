/**
 * Date formatting utilities using date-fns.
 */

import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'

/**
 * Human-readable relative date for transaction lists.
 * relativeDate('2024-12-12T10:00:00Z') → 'Today', 'Yesterday', '2 hours ago', 'Dec 12'
 */
export function relativeDate(isoString: string): string {
  const date = new Date(isoString)
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'MMM d')
}

/**
 * Group date header for transaction sections.
 * groupDateLabel('2024-12-12T10:00:00Z') → 'Today' | 'Yesterday' | 'Dec 12, 2024'
 */
export function groupDateLabel(isoString: string): string {
  const date = new Date(isoString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

/**
 * Format full date for transaction detail.
 * fullDate('2024-12-12T10:00:00Z') → 'December 12, 2024 at 10:00 AM'
 */
export function fullDate(isoString: string): string {
  return format(new Date(isoString), "MMMM d, yyyy 'at' h:mm a")
}
