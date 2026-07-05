import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/ui/ToastProvider';
import { useAuthContext } from '../context/AuthContext';
import { appServices } from '../services/appServices';
import { isPastTodo } from '../services/todoService';
import type { Todo } from '../types/todo';

const todoRepository = appServices.todoRepository;

function TodoDetailPage() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { todoId } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [draftPercentage, setDraftPercentage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !todoId) {
      return;
    }

    const loadTodo = async () => {
      setLoading(true);
      try {
        const loaded = await todoRepository.getById(user.id, todoId);
        if (!loaded) {
          setError('Todo not found.');
          setTodo(null);
        } else {
          setTodo(loaded);
          setDraftPercentage(loaded.completionPercentage);
        }
      } catch {
        setError('Unable to load todo details.');
      } finally {
        setLoading(false);
      }
    };

    loadTodo();
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
            <h2 className="section-title">{todo.title}</h2>
            <p className="section-text">Review and update progress for this scheduled task.</p>
          </div>
          <div className="button-row">
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
            <button type="button" className="button button-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>

        {isPastTodo(todo) ? (
          <p className="alert" style={{ marginTop: '16px' }}>This todo is from a past date and is read-only.</p>
        ) : null}

        <div style={{ marginTop: '18px' }}>
          <div className="summary-card">
            <span className="summary-label">Routine slot</span>
            <strong className="summary-value">{todo.routineTimeLabel}</strong>
          </div>
          <div className="summary-card" style={{ marginTop: '16px' }}>
            <span className="summary-label">Status</span>
            <strong className="summary-value">{todo.completionPercentage >= 100 ? 'Completed' : todo.completionPercentage > 0 ? 'In Progress' : 'Not Started'}</strong>
          </div>
          <div className="summary-card" style={{ marginTop: '16px' }}>
            <span className="summary-label">Description</span>
            <p className="section-text" style={{ margin: '10px 0 0' }}>{todo.description ?? 'No description provided.'}</p>
          </div>
          <div className="summary-card" style={{ marginTop: '16px' }}>
            <span className="summary-label">Completion percentage</span>
            <strong className="summary-value">{draftPercentage}%</strong>
            <input
              type="range"
              min="0"
              max="100"
              value={draftPercentage}
              disabled={isPastTodo(todo) || isSaving}
              onChange={(event) => setDraftPercentage(Number(event.target.value))}
              style={{ width: '100%', marginTop: '16px' }}
            />
            <div className="button-row" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="button button-primary"
                disabled={isPastTodo(todo) || isSaving || draftPercentage === todo.completionPercentage}
                onClick={handleSaveCompletion}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TodoDetailPage;
