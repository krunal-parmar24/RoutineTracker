import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { appServices } from '../services/appServices';
import { generateInsightsReport } from '../services/insightsService';
import type { Todo } from '../types/todo';

const todoRepository = appServices.todoRepository;

function InsightsPage() {
  const { user } = useAuthContext();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const loadTodos = async () => {
      try {
        const [data, userRoutine] = await Promise.all([
          todoRepository.getAll(user.id),
          appServices.routineRepository.getRoutine(user.id)
        ]);
        setTodos(data);
        setRoutine(userRoutine);
      } catch (err) {
        console.error('Failed to load insights data', err);
      } finally {
        setLoading(false);
      }
    };
    loadTodos();
  }, [user?.id]);

  const report = useMemo(() => generateInsightsReport(todos, routine?.entries || []), [todos, routine]);

  if (loading) {
    return (
      <div className="page-grid">
        <section className="card">
          <p className="section-text" style={{ margin: 0 }}>Loading insights...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Analytics & Reports</p>
            <h2 className="section-title">Insights</h2>
            <p className="section-text">Understand your habits, consistency, and procrastination patterns.</p>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="card dashboard-card">
          <div className="section-header">
            <div>
              <p className="meta-label">Performance by Day</p>
              <h3 className="section-title" style={{ fontSize: '18px' }}>Day of Week Trends</h3>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.dayOfWeekTrends.map((trend) => (
              <div key={trend.day}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="small-text" style={{ fontWeight: 600 }}>{trend.day}</span>
                  <span className="small-text">{trend.completionRate}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${trend.completionRate}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card dashboard-card">
          <div className="section-header">
            <div>
              <p className="meta-label">Task Types</p>
              <h3 className="section-title" style={{ fontSize: '18px' }}>Category Distribution</h3>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {report.categoryDistributions.length === 0 ? (
              <p className="section-text">No data available.</p>
            ) : (
              report.categoryDistributions.map((cat) => (
                <div key={cat.category} className="summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{cat.category}</span>
                    <span className="status-chip">{cat.completedTasks} / {cat.totalTasks}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="card dashboard-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Procrastination Metrics</p>
            <h3 className="section-title" style={{ fontSize: '18px' }}>Rescheduling & Postponements</h3>
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: '16px' }}>
          <div className="summary-card">
            <span className="summary-label">Total Rescheduled Tasks</span>
            <strong className="summary-value" style={{ color: '#d97706' }}>{report.reschedulingMetrics.rescheduledTasks}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Postponements</span>
            <strong className="summary-value" style={{ color: '#dc2626' }}>{report.reschedulingMetrics.totalPostponements}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Avg. Postponements per Task</span>
            <strong className="summary-value">{report.reschedulingMetrics.averagePostponements}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default InsightsPage;
