import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TimelineRow } from '../../services/dashboardService';

interface TimelinePanelProps {
  timelineItems: TimelineRow[];
}

const statusIcons: Record<string, string> = {
  Completed: '🟢',
  'In Progress': '🟡',
  'Not Started': '⚪',
  Missed: '🔴',
  Rescheduled: '⏭️',
  'No Task Assigned': '⚫',
};

function TimelinePanel({ timelineItems }: TimelinePanelProps) {
  const navigate = useNavigate();
  const title = timelineItems.length > 0 ? "Today's timeline" : 'No routine slots scheduled today';

  const hasTodoItem = useMemo(() => timelineItems.some((item) => item.todo), [timelineItems]);

  return (
    <section className="card dashboard-card">
      <div className="section-header">
        <div>
          <p className="meta-label">Timeline</p>
          <h2 className="section-title">{title}</h2>
        </div>
      </div>

      {timelineItems.length === 0 ? (
        <div className="empty-state-card">
          <p className="section-text" style={{ margin: 0 }}>Create routine slots to see your day organized here.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {timelineItems.map((item) => {
            const rowClass = item.isActive ? 'timeline-item active' : item.isPast ? 'timeline-item past' : 'timeline-item future';
            const isClickable = Boolean(item.todo);

            return (
              <button
                type="button"
                key={item.routineEntryId}
                className={rowClass}
                onClick={() => item.todo && navigate(`/todo/${item.todo.id}`)}
                disabled={!isClickable}
              >
                <div className="timeline-meta">
                  <span className="timeline-time">{item.startTime} – {item.endTime}</span>
                  <span className="status-chip">{statusIcons[item.status]} {item.status}</span>
                </div>
                <div className="timeline-content">
                  <div>
                    <p className="timeline-title">{item.routineTitle}</p>
                    {item.todo ? (
                      <>
                        <p className="timeline-subtitle">{item.todo.title}</p>
                        {item.todo.description ? <p className="small-text">{item.todo.description}</p> : null}
                      </>
                    ) : (
                      <p className="timeline-empty">No task assigned.</p>
                    )}
                  </div>
                  <div className="timeline-right">
                    <strong>{item.completionPercentage}%</strong>
                    {isClickable ? <span className="timeline-link">View</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!hasTodoItem ? (
        <p className="section-text" style={{ marginTop: '18px' }}>Assign at least one todo to a routine slot to open details from the timeline.</p>
      ) : null}
    </section>
  );
}

export default TimelinePanel;
