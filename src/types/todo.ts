export interface Todo {
  id: string;
  userId: string;
  date: string;
  weekday: string;
  routineEntryId: string;
  routineTimeLabel: string;
  title: string;
  description?: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStatusResult {
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionPercentage: number;
}
