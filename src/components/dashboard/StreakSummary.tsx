import type { StreakStatistics } from '../../services/dashboardService';

interface StreakSummaryProps {
  streak: StreakStatistics;
}

function StreakSummary({ streak }: StreakSummaryProps) {
  return (
    <section className="card dashboard-card">
      <div className="section-header">
        <div>
          <p className="meta-label">Streaks</p>
          <h2 className="section-title">Current & best streak</h2>
          <p className="section-text">Track days where every scheduled todo was completed.</p>
        </div>
      </div>

      {!streak.hasStreak ? (
        <div className="empty-state-card">
          <p className="section-text" style={{ margin: 0 }}>{streak.summaryMessage}</p>
        </div>
      ) : (
        <div className="streak-grid">
          <div className="streak-card">
            <span className="summary-label">🔥 Current streak</span>
            <strong className="summary-value">{streak.currentStreakCount} days</strong>
          </div>
          <div className="streak-card">
            <span className="summary-label">🏆 Best streak</span>
            <strong className="summary-value">{streak.bestStreakCount} days</strong>
          </div>
          <div className="streak-card">
            <span className="summary-label">Last completed day</span>
            <strong className="summary-value">{streak.lastCompletedDay}</strong>
          </div>
          <div className="streak-card">
            <span className="summary-label">Streak started</span>
            <strong className="summary-value">{streak.currentStreakStartDate ?? '—'}</strong>
          </div>
          <div className="streak-card">
            <span className="summary-label">Total perfect days</span>
            <strong className="summary-value">{streak.totalPerfectDays}</strong>
          </div>
          <div className="streak-card">
            <span className="summary-label">Longest gap</span>
            <strong className="summary-value">{streak.longestGapDays} days</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default StreakSummary;
