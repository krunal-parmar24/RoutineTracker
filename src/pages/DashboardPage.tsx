import { useEffect, useMemo, useState } from 'react';
import TodoForm from '../components/todo/TodoForm';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import { useAuthContext } from '../context/AuthContext';
import { buildRoutineTimeLabel, canAssignTodo } from '../services/todoService';
import { appServices } from '../services/appServices';
import {
  getDashboardSummary,
  getProductivityAnalysis,
  getStreakStatistics,
  getTimelineRows,
} from '../services/dashboardService';
import SummaryCards from '../components/dashboard/SummaryCards';
import TimelinePanel from '../components/dashboard/TimelinePanel';
import StreakSummary from '../components/dashboard/StreakSummary';
import type { WeeklyRoutine } from '../types/routine';
import type { Todo } from '../types/todo';

const routineRepository = appServices.routineRepository;
const todoRepository = appServices.todoRepository;

function DashboardPage() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [routine, setRoutine] = useState<WeeklyRoutine | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadDashboard = async () => {
      try {
        const [loadedRoutine, loadedTodos, loadedAllTodos] = await Promise.all([
          routineRepository.getRoutine(user.id),
          todoRepository.getByDate(user.id, selectedDate),
          todoRepository.getAll(user.id),
        ]);

        setRoutine(loadedRoutine);
        setTodos(loadedTodos);
        setAllTodos(loadedAllTodos);
      } catch (err) {
        console.error('Failed loading dashboard', err);
        showToast(err instanceof Error ? err.message : 'Failed to load dashboard.');
      }
    };

    loadDashboard();
  }, [selectedDate, user?.id, showToast]);

  const weekday = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  const routineEntries = useMemo(() => {
    return (routine?.entries ?? [])
      .filter((entry) => entry.dayOfWeek === weekday.toLowerCase())
      .sort((a, b) => a.order - b.order);
  }, [routine, weekday]);

  const summary = useMemo(
    () => getDashboardSummary(routineEntries, todos, selectedDate, weekday),
    [routineEntries, todos, selectedDate, weekday],
  );

  const timelineRows = useMemo(
    () => getTimelineRows(routineEntries, todos, selectedDate),
    [routineEntries, todos, selectedDate],
  );

  const productivityAnalysis = useMemo(() => getProductivityAnalysis(allTodos), [allTodos]);
  const streakStatistics = useMemo(() => getStreakStatistics(allTodos), [allTodos]);

  const handleCreateTodo = async (payload: { title: string; description: string; routineEntryId: string }) => {
    if (!user?.id) {
      return;
    }

    const entry = routineEntries.find((item) => item.id === payload.routineEntryId);
    if (!entry) {
      return;
    }

    if (!canAssignTodo(todos, payload.routineEntryId)) {
      showToast('This routine slot already has a todo for this date.');
      return;
    }

    const todo: Todo = {
      id: crypto.randomUUID(),
      userId: user.id,
      date: selectedDate,
      weekday,
      routineEntryId: payload.routineEntryId,
      routineTimeLabel: buildRoutineTimeLabel(entry),
      title: payload.title,
      description: payload.description || undefined,
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedTodo = await todoRepository.saveTodo(todo);
    setTodos((current) => [...current, savedTodo]);
    setAllTodos((current) => [...current, savedTodo]);
    setShowForm(false);
  };

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Daily overview</p>
            <h2 className="section-title">Focus on today</h2>
            <p className="section-text">Pick a date, assign tasks to your routine, and track progress with a clean view.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="input"
              style={{ minWidth: '200px' }}
            />
            <button onClick={() => setShowForm(true)} className="button button-primary">
              Add todo
            </button>
          </div>
        </div>

        <div className="alert" style={{ marginTop: '20px' }}>
          <p className="alert-text" style={{ margin: 0 }}>
            <strong>
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </strong>{' '}
            · {weekday}
          </p>
        </div>

        <Modal title="Add todo" isOpen={showForm} onClose={() => setShowForm(false)}>
          <TodoForm routineEntries={routineEntries} onSubmit={handleCreateTodo} onCancel={() => setShowForm(false)} />
        </Modal>
      </section>

      <div className="grid-2">
        <SummaryCards summary={summary} />
        <TimelinePanel timelineItems={timelineRows} />
      </div>

      <div className="grid-1">
        <StreakSummary streak={streakStatistics} />
      </div>

      <section className="todo-card">
        <h3 style={{ marginTop: 0 }}>Quick progress</h3>
        <p className="section-text">Update completion status directly from a todo detail page or use the timeline for a focused schedule view.</p>
      </section>
    </div>
  );
}

export default DashboardPage;
