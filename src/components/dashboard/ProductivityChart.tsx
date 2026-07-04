import type { ProductivityAnalysis } from '../../services/dashboardService';

interface ProductivityChartProps {
  analysis: ProductivityAnalysis;
}

function ProductivityChart({ analysis }: ProductivityChartProps) {
  return (
    <section className="card dashboard-card">
      <div className="section-header">
        <div>
          <p className="meta-label">Productivity</p>
          <h2 className="section-title">Most productive time slots</h2>
          <p className="section-text">Review completion performance for time slots across your history.</p>
        </div>
      </div>

      {analysis.slots.length === 0 ? (
        <div className="empty-state-card">
          <p className="section-text" style={{ margin: 0 }}>No completed todo history available yet. Complete a task to build slot analytics.</p>
        </div>
      ) : (
        <>
          <div className="productivity-summary-grid">
            <div className="productivity-stat">
              <span className="summary-label">Most productive</span>
              <strong className="summary-value">{analysis.mostProductiveSlot}</strong>
            </div>
            <div className="productivity-stat">
              <span className="summary-label">Least productive</span>
              <strong className="summary-value">{analysis.leastProductiveSlot}</strong>
            </div>
            <div className="productivity-stat">
              <span className="summary-label">Average completion</span>
              <strong className="summary-value">{analysis.averageCompletionRate}%</strong>
            </div>
          </div>
          <div className="bar-chart">
            {analysis.slots.map((slot) => (
              <div key={slot.slotLabel} className="bar-chart-row">
                <div className="bar-chart-title">
                  <span>{slot.slotLabel}</span>
                  <strong>{slot.completionRate}%</strong>
                </div>
                <div className="bar-chart-track">
                  <div className="bar-fill" style={{ width: `${slot.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default ProductivityChart;
