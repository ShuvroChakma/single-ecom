import { format } from "date-fns"

/**
 * Parse a date string from the API as UTC.
 * The backend stores all datetimes in UTC. Strings without a timezone suffix
 * (e.g. "2024-01-15T10:30:00") must be treated as UTC, otherwise date-fns
 * format() interprets them as local time and displays the wrong value.
 */
export function parseUTC(dateStr: string): Date {
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr)
  }
  return new Date(dateStr + 'Z')
}

/** "Jan 15, 2024" */
export const fmtDate = (s: string) => format(parseUTC(s), "MMM d, yyyy")

/** "January 15, 2024" */
export const fmtDateLong = (s: string) => format(parseUTC(s), "PPP")

/** "Jan 15, 2024 4:30 PM" */
export const fmtDateTime = (s: string) => format(parseUTC(s), "MMM d, yyyy h:mm a")

/** "January 15, 2024 at 4:30 PM" */
export const fmtDateTimeLong = (s: string) => format(parseUTC(s), "PPP p")

/** "January 15, 2024 at 4:30:00 PM" */
export const fmtDateTimeFull = (s: string) => format(parseUTC(s), "PPpp")

/** "01/15/2024" */
export const fmtDateShort = (s: string) => format(parseUTC(s), "PP")
