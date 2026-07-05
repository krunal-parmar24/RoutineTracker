export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface RoutineEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
  /** Soft-delete marker. Entries are never hard-deleted so todos referencing them stay trackable. */
  deletedAt?: string;
}

export interface WeeklyRoutine {
  id: string;
  userId: string;
  entries: RoutineEntry[];
  updatedAt: string;
}

export interface RoutineValidationResult {
  isValid: boolean;
  message?: string;
}
