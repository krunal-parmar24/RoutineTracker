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
