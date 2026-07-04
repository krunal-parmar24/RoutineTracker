import { describe, expect, it } from 'vitest';
import { validateRoutineEntries, validateRoutineEntry } from './routineService';

describe('routineService', () => {
  it('accepts a valid routine entry', () => {
    const result = validateRoutineEntry({ title: 'Exercise', startTime: '09:00', endTime: '10:00' });
    expect(result.isValid).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = validateRoutineEntry({ title: '   ', startTime: '09:00', endTime: '10:00' });
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('Title');
  });

  it('rejects overlapping entries', () => {
    const result = validateRoutineEntries([
      { title: 'Study', startTime: '09:00', endTime: '10:00' },
      { title: 'Exercise', startTime: '09:30', endTime: '10:30' },
    ]);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('overlap');
  });
});
