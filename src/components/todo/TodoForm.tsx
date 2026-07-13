import { useState } from 'react';
import type { RoutineEntry } from '../../types/routine';
import { TODO_CATEGORIES, type TodoCategory } from '../../types/todo';

interface TodoFormProps {
  routineEntries: RoutineEntry[];
  onSubmit: (payload: { title: string; description: string; routineEntryId: string; category: TodoCategory }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

function TodoForm({ routineEntries, onSubmit, onCancel, isSaving }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routineEntryId, setRoutineEntryId] = useState(routineEntries[0]?.id ?? '');
  const [category, setCategory] = useState<TodoCategory>(TODO_CATEGORIES[0]);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (routineEntries.length === 0) {
      setError('Add a routine entry first before creating a todo.');
      return;
    }

    if (!routineEntryId) {
      setError('Select a routine slot.');
      return;
    }

    onSubmit({ title: title.trim(), description: description.trim(), routineEntryId, category });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-row">
        <label className="summary-label" style={{ display: 'block', marginBottom: '4px' }}>Title</label>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" required className="input" disabled={Boolean(isSaving)} />
        
        <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Category</label>
        <select value={category} onChange={(event) => setCategory(event.target.value as TodoCategory)} className="select" disabled={Boolean(isSaving)}>
          {TODO_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Description</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="textarea" disabled={Boolean(isSaving)} />
        
        <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Routine Slot</label>
        <select value={routineEntryId} onChange={(event) => setRoutineEntryId(event.target.value)} className="select" disabled={routineEntries.length === 0 || Boolean(isSaving)}>
          {routineEntries.length === 0 ? (
            <option value="">No routine entries available</option>
          ) : (
            <>
              <option value="">Select a routine slot</option>
              {routineEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.startTime}–{entry.endTime} · {entry.title}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
      {error ? <div className="alert" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b', marginTop: '12px' }}>{error}</div> : null}
      <div className="button-row" style={{ marginTop: '16px' }}>
        <button type="submit" className="button button-primary" disabled={Boolean(isSaving)}>{isSaving ? 'Saving...' : 'Save todo'}</button>
        <button type="button" onClick={onCancel} className="button button-secondary" disabled={Boolean(isSaving)}>Cancel</button>
      </div>
    </form>
  );
}

export default TodoForm;
