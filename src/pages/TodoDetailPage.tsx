import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/ui/ToastProvider';
import { useAuthContext } from '../context/AuthContext';
import { appServices } from '../services/appServices';
import { isPastTodo, buildRoutineTimeLabel } from '../services/todoService';
import { calculateCascade } from '../services/rescheduleService';
import { TODO_CATEGORIES, type Todo, type TodoCategory } from '../types/todo';
import type { WeeklyRoutine } from '../types/routine';
import { formatDisplayDate } from '../utils/date';

const todoRepository = appServices.todoRepository;
const routineRepository = appServices.routineRepository;

function TodoDetailPage() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { todoId } = useParams();
  const navigate = useNavigate();
  
  const [todo, setTodo] = useState<Todo | null>(null);
  const [routine, setRoutine] = useState<WeeklyRoutine | null>(null);
  
  const [draftPercentage, setDraftPercentage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editRoutineEntryId, setEditRoutineEntryId] = useState('');
  const [editCategory, setEditCategory] = useState<TodoCategory>(TODO_CATEGORIES[0]);

  useEffect(() => {
    if (!user?.id || !todoId) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [loadedTodo, loadedRoutine] = await Promise.all([
          todoRepository.getById(user.id, todoId),
          routineRepository.getRoutine(user.id)
        ]);
        
        if (!loadedTodo) {
          setError('Todo not found.');
          setTodo(null);
        } else {
          setTodo(loadedTodo);
          setDraftPercentage(loadedTodo.completionPercentage);
        }
        setRoutine(loadedRoutine);
      } catch {
        setError('Unable to load todo details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, todoId]);

  const handleSaveCompletion = async () => {
    if (!todo || isPastTodo(todo) || draftPercentage === todo.completionPercentage) {
      return;
    }

    setIsSaving(true);
    try {
      const updated: Todo = {
        ...todo,
        completionPercentage: draftPercentage,
        updatedAt: new Date().toISOString(),
      };
      const saved = await todoRepository.updateTodo(updated);
      setTodo(saved);
      setDraftPercentage(saved.completionPercentage);
      showToast('Todo progress saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save progress.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (!todo) return;
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditDate(todo.date);
    setEditRoutineEntryId(todo.routineEntryId ?? '');
    setEditCategory((todo.category as typeof TODO_CATEGORIES[number]) || TODO_CATEGORIES[0]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!todo || !user?.id) return;

    if (!editTitle.trim()) {
      showToast('Title is required.');
      return;
    }
    
    const editWeekday = new Date(`${editDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    const selectedEntry = editRoutineEntryId
      ? routine?.entries.find(e => e.id === editRoutineEntryId)
      : undefined;

    // If a slot was selected but not found in the routine, bail out
    if (editRoutineEntryId && !selectedEntry) {
      showToast('Invalid routine slot selected.');
      return;
    }

    const isRescheduledForward = editDate > todo.date;
    const nextRescheduleCount = isRescheduledForward ? (todo.rescheduleCount || 0) + 1 : (todo.rescheduleCount || 0);

    setIsSaving(true);
    try {
      const updated: Todo = {
        ...todo,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory,
        date: editDate,
        weekday: editWeekday,
        routineEntryId: selectedEntry ? editRoutineEntryId : undefined,
        routineTimeLabel: selectedEntry ? buildRoutineTimeLabel(selectedEntry) : undefined,
        rescheduleCount: nextRescheduleCount,
        updatedAt: new Date().toISOString(),
      };

      // If the date did not change, this is a simple update: avoid the reschedule cascade.
      if (editDate === todo.date) {
        const saved = await todoRepository.updateTodo(updated);
        setIsEditing(false);
        setTodo(saved);
        showToast('Todo updated successfully.');
      } else {
        const allTodos = await todoRepository.getAll(user.id);
        const { updates, inserts } = calculateCascade(todo, updated, allTodos, routine!);
        const result = await todoRepository.batchProcessReschedules(updates, inserts);

        const newActiveTask = result.inserted.length > 0 ? result.inserted[0] : null;

        setIsEditing(false);

        if (inserts.length > 1) {
          showToast(`Rescheduled task and bumped ${inserts.length - 1} future task(s).`);
        } else {
          showToast('Todo updated successfully.');
        }

        if (newActiveTask && newActiveTask.id !== todo.id) {
          navigate(`/todo/${newActiveTask.id}`, { replace: true });
        } else {
          setTodo(newActiveTask || todo);
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update todo.');
    } finally {
      setIsSaving(false);
    }
  };

  const availableRoutineSlots = useMemo(() => {
    if (!routine || !editDate) return [];
    const weekday = new Date(`${editDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return routine.entries
      .filter((entry) => entry.dayOfWeek === weekday && !entry.deletedAt)
      .sort((a, b) => a.order - b.order);
  }, [routine, editDate]);

  if (loading) {
    return (
      <div className="page-grid">
        <section className="card">
          <p className="section-text" style={{ margin: 0 }}>Loading todo details...</p>
        </section>
      </div>
    );
  }

  if (error || !todo) {
    return (
      <div className="page-grid">
        <section className="card">
          <p className="section-text" style={{ margin: 0 }}>{error ?? 'Todo not found.'}</p>
          <button type="button" className="button button-secondary" onClick={() => navigate(-1)} style={{ marginTop: '18px' }}>
            Go back
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Todo details</p>
            <h2 className="section-title">{isEditing ? 'Edit Todo' : todo.title}</h2>
            <p className="section-text">{isEditing ? 'Update the details for this scheduled task.' : 'Review and update progress for this scheduled task.'}</p>
          </div>
          <div className="button-row">
            {!isEditing && !todo.rescheduledToDate && (
              <button 
                type="button" 
                className="button button-primary"
                onClick={handleStartEdit}
                disabled={isPastTodo(todo)}
              >
                Edit
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                className="button button-danger"
                disabled={isPastTodo(todo)}
                title={isPastTodo(todo) ? 'Historical todos cannot be deleted.' : undefined}
                onClick={async () => {
                  if (!todo || isPastTodo(todo)) return;
                  const confirmed = window.confirm('Delete this todo? This cannot be undone.');
                  if (!confirmed) return;
                  try {
                    await todoRepository.deleteTodo(user?.id ?? '', todo.id);
                    window.dispatchEvent(new CustomEvent('todo:deleted', { detail: { id: todo.id } }));
                    showToast('Todo deleted.');
                    navigate(-1);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Unable to delete todo.');
                  }
                }}
              >
                Delete
              </button>
            )}
            <button type="button" className="button button-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>

        {todo.rescheduledToDate ? (
          <div className="alert" style={{ marginTop: '16px', backgroundColor: 'var(--bg-secondary)' }}>
            <strong>Rescheduled</strong>: This task was moved to {formatDisplayDate(todo.rescheduledToDate)}.
          </div>
        ) : isPastTodo(todo) ? (
          <p className="alert" style={{ marginTop: '16px' }}>This todo is from a past date and is read-only.</p>
        ) : null}

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="form-card" style={{ marginTop: '18px' }}>
            <div className="form-row">
              <label className="summary-label" style={{ display: 'block', marginBottom: '4px' }}>Title</label>
              <input 
                value={editTitle} 
                onChange={(event) => setEditTitle(event.target.value)} 
                placeholder="Task title" 
                required 
                className="input" 
                disabled={isSaving} 
              />
              
              <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Category</label>
              <select value={editCategory} onChange={(event) => setEditCategory(event.target.value as any)} className="select" disabled={isSaving}>
                {TODO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Description</label>
              <textarea 
                value={editDescription} 
                onChange={(event) => setEditDescription(event.target.value)} 
                placeholder="Description" 
                className="textarea" 
                disabled={isSaving} 
              />
              
              <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(event) => {
                  setEditDate(event.target.value);
                  setEditRoutineEntryId(''); // Reset slot when date changes
                }}
                className="input"
                disabled={isSaving}
              />
              
              <label className="summary-label" style={{ display: 'block', marginBottom: '4px', marginTop: '12px' }}>
                Routine Slot <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
              </label>
              <select 
                value={editRoutineEntryId} 
                onChange={(event) => setEditRoutineEntryId(event.target.value)} 
                className="select" 
                disabled={isSaving}
              >
                <option value="">— No routine slot (free task) —</option>
                {availableRoutineSlots.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {buildRoutineTimeLabel(entry)} · {entry.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="button-row" style={{ marginTop: '16px' }}>
              <button type="submit" className="button button-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancelEdit} className="button button-secondary" disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: '18px' }}>
            <div className="summary-card">
              <span className="summary-label">Date</span>
              <strong className="summary-value">{formatDisplayDate(todo.date)}</strong>
            </div>
            {todo.routineTimeLabel && (
              <div className="summary-card" style={{ marginTop: '16px' }}>
                <span className="summary-label">Routine slot</span>
                <strong className="summary-value">{todo.routineTimeLabel}</strong>
              </div>
            )}
            <div className="summary-card" style={{ marginTop: '16px' }}>
              <span className="summary-label">Category</span>
              <strong className="summary-value">{todo.category || 'Uncategorized'}</strong>
            </div>
            {todo.rescheduleCount > 0 && (
              <div className="summary-card" style={{ marginTop: '16px' }}>
                <span className="summary-label">Postponements</span>
                <strong className="summary-value">{todo.rescheduleCount}</strong>
              </div>
            )}
            <div className="summary-card" style={{ marginTop: '16px' }}>
              <span className="summary-label">Status</span>
              <strong className="summary-value">{todo.completionPercentage >= 100 ? 'Completed' : todo.completionPercentage > 0 ? 'In Progress' : 'Not Started'}</strong>
            </div>
            <div className="summary-card" style={{ marginTop: '16px' }}>
              <span className="summary-label">Description</span>
              <p className="section-text" style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{todo.description ?? 'No description provided.'}</p>
            </div>
            <div className="summary-card" style={{ marginTop: '16px' }}>
              <span className="summary-label">Completion percentage</span>
              <strong className="summary-value">{draftPercentage}%</strong>
              <input
                type="range"
                min="0"
                max="100"
                value={draftPercentage}
                disabled={!!todo.rescheduledToDate || isPastTodo(todo) || isSaving}
                onChange={(event) => setDraftPercentage(Number(event.target.value))}
                style={{ width: '100%', marginTop: '16px' }}
              />
              <div className="button-row" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={!!todo.rescheduledToDate || isPastTodo(todo) || isSaving || draftPercentage === todo.completionPercentage}
                  onClick={handleSaveCompletion}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default TodoDetailPage;
