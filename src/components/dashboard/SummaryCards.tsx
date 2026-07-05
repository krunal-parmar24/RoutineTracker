import type { DashboardSummary } from '../../services/dashboardService';
import { formatDisplayDate } from '../../utils/date';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const metrics = [
    { label: 'Routine slots', value: summary.totalRoutineSlots },
    { label: 'Todos', value: summary.totalTodos },
    { label: 'Completed', value: summary.completedTodos },
    { label: 'In progress', value: summary.inProgressTodos },
    { label: 'Not started', value: summary.notStartedTodos },
    { label: 'Missed', value: summary.missedTodos },
  ];

  return (
    <section className="card dashboard-card">
      <div className="section-header">
        <div>
          <p className="meta-label">Today&apos;s summary</p>
          <h2 className="section-title">{formatDisplayDate(summary.selectedDate)}</h2>
          <p className="section-text">{summary.weekday}</p>
        </div>
      </div>

      {summary.hasTasks ? (
        <>
          <div className="dashboard-summary-grid" style={{ marginTop: '22px' }}>
            {metrics.map((metric) => (
              <div key={metric.label} className="summary-card">
                <span className="summary-label">{metric.label}</span>
                <strong className="summary-value">{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="summary-overall-card">
            <div>
              <p className="summary-label">Overall completion</p>
              <strong className="summary-value">{summary.overallCompletionPercentage}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${summary.overallCompletionPercentage}%` }} />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state-card">
          <p className="section-text" style={{ margin: 0 }}>
            No tasks scheduled today. Add a todo to a routine slot and your dashboard will update automatically.
          </p>
        </div>
      )}
    </section>
  );
}

export default SummaryCards;
