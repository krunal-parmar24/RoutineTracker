import { useState } from 'react';
import type { DayOfWeek, RoutineEntry } from '../../types/routine';
import { validateRoutineEntry } from '../../services/routineService';

interface RoutineEntryFormProps {
  dayOfWeek: DayOfWeek;
  initialEntry?: RoutineEntry;
  onSubmit: (entry: Omit<RoutineEntry, 'id' | 'createdAt' | 'dayOfWeek' | 'order'> & { dayOfWeek: DayOfWeek }) => void;
  onCancel: () => void;
}

function RoutineEntryForm({ dayOfWeek, initialEntry, onSubmit, onCancel }: RoutineEntryFormProps) {
  const [title, setTitle] = useState(initialEntry?.title ?? '');
  const [description, setDescription] = useState(initialEntry?.description ?? '');
  const [startTime, setStartTime] = useState(initialEntry?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialEntry?.endTime ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateRoutineEntry({ title, startTime, endTime });
    if (!result.isValid) {
      setError(result.message ?? 'Invalid routine entry.');
      return;
    }

    onSubmit({
      dayOfWeek,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime,
      endTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>{initialEntry ? 'Edit entry' : 'Add entry'} for {dayOfWeek}</div>
          <p className="small-text" style={{ margin: 0 }}>Use clear titles and consistent routine blocks.</p>
        </div>
      </div>
      <div className="form-row" style={{ marginTop: '18px' }}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required className="input" />
        <div style={{ display: 'grid', gap: '12px' }}>
          <input value={startTime} onChange={(event) => setStartTime(event.target.value)} type="time" required className="input" />
          <input value={endTime} onChange={(event) => setEndTime(event.target.value)} type="time" required className="input" />
        </div>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="textarea" />
      </div>
      {error ? <div className="alert" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{error}</div> : null}
      <div className="button-row" style={{ marginTop: '16px' }}>
        <button type="submit" className="button button-primary">Save</button>
        <button type="button" onClick={onCancel} className="button button-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default RoutineEntryForm;
