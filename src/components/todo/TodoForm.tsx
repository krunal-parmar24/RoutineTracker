import { useState } from 'react';
import type { RoutineEntry } from '../../types/routine';

interface TodoFormProps {
  routineEntries: RoutineEntry[];
  onSubmit: (payload: { title: string; description: string; routineEntryId: string }) => void;
  onCancel: () => void;
}

function TodoForm({ routineEntries, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routineEntryId, setRoutineEntryId] = useState(routineEntries[0]?.id ?? '');
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

    onSubmit({ title: title.trim(), description: description.trim(), routineEntryId });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-row">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" required className="input" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="textarea" />
        <select value={routineEntryId} onChange={(event) => setRoutineEntryId(event.target.value)} className="select" disabled={routineEntries.length === 0}>
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
      {error ? <div className="alert" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{error}</div> : null}
      <div className="button-row" style={{ marginTop: '8px' }}>
        <button type="submit" className="button button-primary">Save todo</button>
        <button type="button" onClick={onCancel} className="button button-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default TodoForm;
