import { useState } from 'react';
import type { HeatmapCell } from '../../services/dashboardService';
import { formatDisplayDate } from '../../utils/date';

interface StreakSummaryProps {
  heatmap: HeatmapCell[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellLabel(cell: HeatmapCell): string | undefined {
  if (!cell.date) return undefined;
  const detail = cell.total > 0 ? `${cell.percentage}% completed` : 'No tasks scheduled';
  return `${formatDisplayDate(cell.date)} — ${detail}`;
}

function buildColumns(heatmap: HeatmapCell[]): HeatmapCell[][] {
  const columns: HeatmapCell[][] = [];
  for (let index = 0; index < heatmap.length; index += 7) {
    columns.push(heatmap.slice(index, index + 7));
  }
  return columns;
}

/** Local-time date key (avoids UTC shift for UTC+ timezones). */
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function StreakSummary({ heatmap }: StreakSummaryProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayKey = localDateKey(now);

  // State for the tapped cell (mobile tap-to-reveal tooltip)
  const [tappedCell, setTappedCell] = useState<HeatmapCell | null>(null);

  // Filter the provided heatmap down to cells that belong to the current month.
  const monthHeatmap = heatmap.filter((cell) => {
    if (!cell.date) return false;
    const d = new Date(`${cell.date}T00:00:00`);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Re-add leading padding so the grid aligns to the correct weekday column.
  const firstRealCell = monthHeatmap[0];
  const firstWeekday = firstRealCell
    ? new Date(`${firstRealCell.date}T00:00:00`).getDay()
    : 0;
  const paddingCells: HeatmapCell[] = Array.from({ length: firstWeekday }, () => ({
    date: null,
    total: 0,
    completed: 0,
    sumPercentage: 0,
    percentage: 0,
    level: 0 as const,
  }));
  const alignedMonthHeatmap = [...paddingCells, ...monthHeatmap];

  const sumOfPercentages = monthHeatmap.reduce((sum, cell) => sum + cell.sumPercentage, 0);
  const totalTodos = monthHeatmap.reduce((sum, cell) => sum + cell.total, 0);
  const overallPercentage = totalTodos > 0 ? Math.round(sumOfPercentages / totalTodos) : 0;
  const totalActiveDays = monthHeatmap.filter((cell) => cell.total > 0).length;
  const columns = buildColumns(alignedMonthHeatmap);

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

  const handleCellTap = (cell: HeatmapCell) => {
    if (!cell.date) return;
    // Toggle: tap same cell again to dismiss
    setTappedCell((prev) => (prev?.date === cell.date ? null : cell));
  };

  return (
    <section className="heatmap-panel heatmap-month-only">
      <div className="heatmap-header">
        <p className="heatmap-count">
          <strong>{overallPercentage}%</strong> completion in {MONTH_LABELS[currentMonth]} {currentYear}
        </p>
        <div className="heatmap-stats">
          <span>Active days: <strong>{totalActiveDays}</strong></span>
          <span>Max streak: <strong>{best}</strong></span>
        </div>
      </div>

      <div className="heatmap-grid">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="heatmap-column">{
            column.map((cell, rowIndex) => {
              const isToday = cell.date === todayKey;
              const isTapped = tappedCell?.date === cell.date;
              return (
                <div
                  key={cell.date ?? `pad-${colIndex}-${rowIndex}`}
                  className={`heatmap-cell level-${cell.level}${cell.date ? '' : ' empty'}${isToday ? ' today' : ''}${isTapped ? ' tapped' : ''}`}
                  title={cellLabel(cell)}
                  role={cell.date ? 'button' : undefined}
                  tabIndex={cell.date ? 0 : undefined}
                  aria-label={cellLabel(cell)}
                  onClick={() => handleCellTap(cell)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCellTap(cell)}
                />
              );
            })
          }</div>
        ))}
      </div>

      {/* Tap-to-reveal info bar — visible on mobile when a cell is tapped */}
      {tappedCell && tappedCell.date && (
        <div className="heatmap-tap-info" role="status" aria-live="polite">
          <span className="heatmap-tap-date">{formatDisplayDate(tappedCell.date)}</span>
          <span className="heatmap-tap-detail">
            {tappedCell.total > 0 ? `${tappedCell.percentage}% completed` : 'No tasks scheduled'}
          </span>
          <button
            type="button"
            className="heatmap-tap-dismiss"
            onClick={() => setTappedCell(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

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
