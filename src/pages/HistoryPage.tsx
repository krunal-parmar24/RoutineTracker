import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { groupTodosByDate } from '../services/historyService';
import { getTodoStatus } from '../services/todoService';
import { appServices } from '../services/appServices';
import type { Todo } from '../types/todo';

const todoRepository = appServices.todoRepository;

function HistoryPage() {
  const { user } = useAuthContext();
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadHistory = async () => {
      const allTodos = await todoRepository.getAll(user.id);
      setTodos(allTodos);
    };

    loadHistory();
  }, [user?.id]);

  const historyGroups = useMemo(() => groupTodosByDate(todos), [todos]);

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Your progress</p>
            <h2 className="section-title">History</h2>
            <p className="section-text">Browse completed todos and review how you have built consistency over time.</p>
          </div>
        </div>
      </section>

      {historyGroups.length === 0 ? (
        <section className="card">
          <p className="section-text" style={{ margin: 0 }}>No historical todos yet. Add a task today and check back later.</p>
        </section>
      ) : (
        historyGroups.map((group) => (
          <section key={group.date} className="history-card">
            <h3 style={{ marginTop: 0 }}>{new Date(`${group.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
            <div className="card-list">
              {group.todos.map((todo) => {
                const status = getTodoStatus(todo.completionPercentage);
                return (
                  <div key={todo.id} className="todo-card card-compact">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{todo.routineTimeLabel}</p>
                        <p style={{ margin: 0 }}>{todo.title}</p>
                        {todo.description ? <p className="small-text" style={{ margin: '8px 0 0' }}>{todo.description}</p> : null}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="status-chip">{status.status}</span>
                        <p className="small-text" style={{ margin: '8px 0 0' }}>{todo.completionPercentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default HistoryPage;
