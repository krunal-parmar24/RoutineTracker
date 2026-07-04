import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { appServices } from '../services/appServices';
import type { Todo } from '../types/todo';

const todoRepository = appServices.todoRepository;

function TodoDetailPage() {
  const { user } = useAuthContext();
  const { todoId } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState<Todo | null>(null);
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
        }
      } catch {
        setError('Unable to load todo details.');
      } finally {
        setLoading(false);
      }
    };

    loadTodo();
  }, [user?.id, todoId]);

  const handleCompletionChange = async (value: number) => {
    if (!todo) {
      return;
    }

    const updated: Todo = {
      ...todo,
      completionPercentage: value,
      updatedAt: new Date().toISOString(),
    };
    const saved = await todoRepository.updateTodo(updated);
    setTodo(saved);
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
          <button type="button" className="button button-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

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
            <strong className="summary-value">{todo.completionPercentage}%</strong>
            <input
              type="range"
              min="0"
              max="100"
              value={todo.completionPercentage}
              onChange={(event) => handleCompletionChange(Number(event.target.value))}
              style={{ width: '100%', marginTop: '16px' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default TodoDetailPage;
