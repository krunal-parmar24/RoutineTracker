import type { HeatmapCell, StreakStatistics } from '../../services/dashboardService';
import { formatDisplayDate } from '../../utils/date';

interface StreakSummaryProps {
  streak: StreakStatistics;
  heatmap: HeatmapCell[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellTitle(cell: HeatmapCell): string | undefined {
  if (!cell.date) {
    return undefined;
  }
  const detail = cell.total > 0 ? `${cell.completed}/${cell.total} completed` : 'No tasks scheduled';
  return `${formatDisplayDate(cell.date)} — ${detail}`;
}

function buildColumns(heatmap: HeatmapCell[]): HeatmapCell[][] {
  const columns: HeatmapCell[][] = [];
  for (let index = 0; index < heatmap.length; index += 7) {
    columns.push(heatmap.slice(index, index + 7));
  }
  return columns;
}

function getColumnMonth(column: HeatmapCell[]): number | null {
  const dated = column.find((cell) => cell.date);
  return dated?.date ? new Date(`${dated.date}T00:00:00`).getMonth() : null;
}

function StreakSummary({ streak, heatmap }: StreakSummaryProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayKey = now.toISOString().slice(0, 10);

  // Filter the provided heatmap down to cells that belong to the current month.
  const monthHeatmap = heatmap.filter((cell) => {
    if (!cell.date) return false;
    const d = new Date(`${cell.date}T00:00:00`);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalCompletions = monthHeatmap.reduce((sum, cell) => sum + cell.completed, 0);
  const totalActiveDays = monthHeatmap.filter((cell) => cell.total > 0).length;
  const columns = buildColumns(monthHeatmap);

  // Compute a simple max streak for the current month from the filtered data.
  const dateOrder = monthHeatmap
    .map((c) => c.date!)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const completedSet = new Set(monthHeatmap.filter((c) => c.completed > 0).map((c) => c.date));
  let best = 0;
  let curr = 0;
  for (const d of dateOrder) {
    if (completedSet.has(d)) {
      curr += 1;
      if (curr > best) best = curr;
    } else {
      curr = 0;
    }
  }

  return (
    <section className="heatmap-panel heatmap-month-only">
      <div className="heatmap-header">
        <p className="heatmap-count">
          <strong>{totalCompletions}</strong> completions in {MONTH_LABELS[currentMonth]} {currentYear}
        </p>
        <div className="heatmap-stats">
          <span>Active days: <strong>{totalActiveDays}</strong></span>
          <span>Max streak: <strong>{best}</strong></span>
        </div>
      </div>

      <div className="heatmap-grid">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className={`heatmap-column`}>{
            column.map((cell, rowIndex) => {
              const isToday = cell.date === todayKey;
              return (
                <div
                  key={cell.date ?? `pad-${colIndex}-${rowIndex}`}
                  className={`heatmap-cell level-${cell.level}${cell.date ? '' : ' empty'}${isToday ? ' today' : ''}`}
                  title={cellTitle(cell)}
                />
              );
            })
          }</div>
        ))}
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <span className="heatmap-cell level-0" />
        <span className="heatmap-cell level-1" />
        <span className="heatmap-cell level-2" />
        <span className="heatmap-cell level-3" />
        <span className="heatmap-cell level-4" />
        <span>More</span>
      </div>
    </section>
  );
}

export default StreakSummary;
