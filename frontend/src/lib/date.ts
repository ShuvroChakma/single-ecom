/**
 * Parse a date string from the API as UTC.
 * The backend stores all datetimes in UTC. Strings without a timezone suffix
 * (e.g. "2024-01-15T10:30:00") must be treated as UTC, otherwise browsers
 * interpret them as local time and display the wrong value.
 */
export function parseUTC(dateStr: string): Date {
  // Already has timezone info (+00:00, Z, etc.) — parse as-is
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr)
  }
  // Naive string — force UTC by appending Z
  return new Date(dateStr + 'Z')
}

/** Format a UTC API date string as a local date (e.g. "Jan 15, 2024") */
export function formatDate(dateStr: string): string {
  return parseUTC(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** Format a UTC API date string as a local date + time (e.g. "Jan 15, 2024, 4:30 PM") */
export function formatDateTime(dateStr: string): string {
  return parseUTC(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** Format a UTC API date string as long date (e.g. "January 15, 2024") */
export function formatDateLong(dateStr: string): string {
  return parseUTC(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
