/**
 * Formats a "YYYY-MM-DD" date key as a human-friendly display string, e.g. "7th Jul 2026".
 * Falls back to the raw value if the date is malformed.
 */
export function formatDisplayDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day}${ordinalSuffix(day)} ${month} ${year}`;
}

/**
 * Convert an "HH:MM" time string to a 12-hour formatted time, e.g. "9:00 AM".
 * Falls back to the original value if parsing fails.
 */
export function formatTime12(timeStr: string): string {
  if (!timeStr) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format a time range label like "09:00–10:00" into "9:00 AM–10:00 AM".
 * If the label doesn't look like a HH:MM range, return as-is.
 */
export function formatTimeRange(label: string): string {
  if (!label) return label;
  const sep = label.includes('–') ? '–' : label.includes('-') ? '-' : null;
  if (!sep) return label;
  const parts = label.split(sep).map((p) => p.trim());
  if (parts.length !== 2) return label;
  return `${formatTime12(parts[0])}${sep}${formatTime12(parts[1])}`;
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }

  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
