export const TODO_CATEGORIES = ['DSA', 'System Design - LLD', 'System Design HLD', '.NET', 'Communication Skill', 'React', 'AI/ML', 'Docker & Kubernetes', 'SQL', 'Other', 'Uncategorized'] as const;
export type TodoCategory = typeof TODO_CATEGORIES[number];

export interface Todo {
  id: string;
  userId: string;
  date: string;
  weekday: string;
  routineEntryId?: string;
  routineTimeLabel?: string;
  title: string;
  description?: string;
  category?: TodoCategory;
  rescheduleCount: number;
  rescheduledToDate?: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStatusResult {
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionPercentage: number;
}
