import React, { useState } from 'react';
import { CommitDayStat } from '../../types/index.js';

interface Props {
  activity: CommitDayStat[];
  title?: string;
  color?: string;
}

export const CommitVelocityChart: React.FC<Props> = ({
  activity,
  title = 'Recent Commit Activity',
  color = '#265136',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!activity || activity.length === 0) {
    return <div className="empty-chart">No recent commit history recorded.</div>;
  }

  const counts = activity.map((a) => a.count);
  const maxCount = Math.max(...counts, 5);
  const totalCommits = counts.reduce((a, b) => a + b, 0);

  // SVG chart parameters
  const chartHeight = 120;
  const chartWidth = 320;
  const barWidth = 24;
  const gap = (chartWidth - barWidth * activity.length) / (activity.length + 1);

  return (
    <div className="commit-velocity-card">
      <div className="chart-header">
        <div>
          <h4>{title}</h4>
          <span className="subtitle">Last 7 days commit & push velocity</span>
        </div>
        <div className="velocity-metric">
          <span className="val">{totalCommits}</span>
          <span className="lbl">pushes</span>
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="velocity-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`bar-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight - 20}
            x2={chartWidth}
            y2={chartHeight - 20}
            stroke="rgba(0,0,0,0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={(chartHeight - 20) / 2}
            x2={chartWidth}
            y2={(chartHeight - 20) / 2}
            stroke="rgba(0,0,0,0.05)"
            strokeDasharray="4 4"
          />

          {activity.map((item, idx) => {
            const barHeight = Math.max((item.count / maxCount) * (chartHeight - 35), 4);
            const x = gap + idx * (barWidth + gap);
            const y = chartHeight - 20 - barHeight;
            const isHovered = hoveredIdx === idx;

            // Short date label (e.g., "Oct 14")
            const dateObj = new Date(item.date);
            const shortDate = isNaN(dateObj.getTime())
              ? item.date.slice(5)
              : dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={`url(#bar-gradient-${color})`}
                  className="velocity-bar"
                  style={{
                    transition: 'all 0.2s ease',
                    opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                  }}
                />
                {/* Date label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fill={isHovered ? '#1E1E1B' : '#888880'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {shortDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredIdx !== null && (
          <div
            className="tooltip-box"
            style={{
              left: `${gap + hoveredIdx * (barWidth + gap) + barWidth / 2}px`,
            }}
          >
            <div className="tooltip-date">{activity[hoveredIdx].date}</div>
            <div className="tooltip-val">{activity[hoveredIdx].count} commits / pushes</div>
          </div>
        )}
      </div>

      <style>{`
        .commit-velocity-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chart-header h4 {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text-main);
        }
        .subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .velocity-metric {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-md);
        }
        .velocity-metric .val {
          font-size: 1rem;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--text-main);
        }
        .velocity-metric .lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .svg-container {
          position: relative;
          width: 100%;
          height: 120px;
        }
        .velocity-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .velocity-bar:hover {
          filter: brightness(1.15);
        }
        .tooltip-box {
          position: absolute;
          top: -15px;
          transform: translateX(-50%);
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          pointer-events: none;
          white-space: nowrap;
          z-index: 10;
        }
        .tooltip-date {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .tooltip-val {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .empty-chart {
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
