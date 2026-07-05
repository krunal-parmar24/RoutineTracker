import type { RoutineEntry, RoutineValidationResult } from '../types/routine';

export function validateRoutineEntry(entry: Pick<RoutineEntry, 'startTime' | 'endTime' | 'title'>): RoutineValidationResult {
  if (!entry.title.trim()) {
    return { isValid: false, message: 'Title is required.' };
  }

  if (!entry.startTime || !entry.endTime) {
    return { isValid: false, message: 'Start and end time are required.' };
  }

  const startMinutes = toMinutes(entry.startTime);
  const endMinutes = toMinutes(entry.endTime);

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    return { isValid: false, message: 'Time values must be valid.' };
  }

  if (startMinutes >= endMinutes) {
    return { isValid: false, message: 'End time must be after start time.' };
  }

  return { isValid: true };
}

export function validateRoutineEntries(entries: Array<Pick<RoutineEntry, 'startTime' | 'endTime' | 'title'>>): RoutineValidationResult {
  if (entries.length === 0) {
    return { isValid: true };
  }

  for (const entry of entries) {
    const result = validateRoutineEntry(entry);
    if (!result.isValid) {
      return result;
    }
  }

  const sorted = [...entries].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (toMinutes(previous.endTime) > toMinutes(current.startTime)) {
      return { isValid: false, message: 'Routine entries cannot overlap.' };
    }
  }

  return { isValid: true };
}

/**
 * Builds the list of entries to validate for a given day, replacing (rather than
 * duplicating) the entry currently being edited so it isn't compared against itself.
 */
export function buildComparableEntries(
  existingEntries: Array<Pick<RoutineEntry, 'id' | 'title' | 'startTime' | 'endTime'>>,
  candidate: Pick<RoutineEntry, 'title' | 'startTime' | 'endTime'>,
  excludeEntryId?: string,
): Array<Pick<RoutineEntry, 'title' | 'startTime' | 'endTime'>> {
  return [
    ...existingEntries
      .filter((entry) => entry.id !== excludeEntryId)
      .map((entry) => ({ title: entry.title, startTime: entry.startTime, endTime: entry.endTime })),
    candidate,
  ];
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
