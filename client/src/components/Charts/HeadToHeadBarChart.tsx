import React from 'react';
import { ComparisonSummary } from '../../types/index.js';

interface Props {
  developers: ComparisonSummary[];
}

const DEV_COLORS = [
  { primary: '#1E1E1B', secondary: '#3a3a36' }, // Charcoal
  { primary: '#265136', secondary: '#3b7450' }, // Forest Green
  { primary: '#6E7FA8', secondary: '#8999c0' }, // Slate
  { primary: '#9A3412', secondary: '#c2410c' }, // Terracotta
  { primary: '#B45309', secondary: '#d97706' }, // Bronze
];

export const HeadToHeadBarChart: React.FC<Props> = ({ developers }) => {
  if (!developers || developers.length === 0) return null;

  const metrics = [
    {
      key: 'total_stars',
      label: 'Total Stars',
      unit: '★',
      maxVal: Math.max(...developers.map((d) => d.total_stars), 1),
    },
    {
      key: 'followers',
      label: 'Followers',
      unit: '',
      maxVal: Math.max(...developers.map((d) => d.followers), 1),
    },
    {
      key: 'public_repos',
      label: 'Public Repos',
      unit: '',
      maxVal: Math.max(...developers.map((d) => d.public_repos), 1),
    },
    {
      key: 'total_recent_commits',
      label: 'Recent Commits',
      unit: 'commits',
      maxVal: Math.max(...developers.map((d) => d.total_recent_commits), 1),
    },
    {
      key: 'avg_stars_per_repo',
      label: 'Avg Stars / Repo',
      unit: '★',
      maxVal: Math.max(...developers.map((d) => d.avg_stars_per_repo), 1),
    },
  ];

  return (
    <div className="h2h-chart-container">
      {/* Developer Legend */}
      <div className="h2h-legend">
        {developers.map((dev, idx) => {
          const color = DEV_COLORS[idx % DEV_COLORS.length];
          return (
            <div key={dev.id} className="legend-dev-item">
              <span
                className="legend-color-dot"
                style={{ backgroundColor: color.primary }}
              />
              <img src={dev.avatar_url} alt={dev.github_username} className="legend-avatar" />
              <span className="legend-username">@{dev.github_username}</span>
            </div>
          );
        })}
      </div>

      {/* Comparison Rows */}
      <div className="metrics-list">
        {metrics.map((metric) => {
          // Find winner for this metric
          let highestVal = -1;
          let winnerUsername = '';
          developers.forEach((dev) => {
            const val = (dev as any)[metric.key] || 0;
            if (val > highestVal) {
              highestVal = val;
              winnerUsername = dev.github_username;
            }
          });

          return (
            <div key={metric.key} className="metric-row">
              <div className="metric-header">
                <span className="metric-label">{metric.label}</span>
                {highestVal > 0 && (
                  <span className="metric-winner-tag">
                    👑 Leader: <strong>@{winnerUsername}</strong> ({highestVal.toLocaleString()} {metric.unit})
                  </span>
                )}
              </div>

              <div className="bars-stack">
                {developers.map((dev, idx) => {
                  const val = (dev as any)[metric.key] || 0;
                  const pct = Math.max(Math.round((val / metric.maxVal) * 100), val > 0 ? 3 : 0);
                  const color = DEV_COLORS[idx % DEV_COLORS.length];
                  const isLeader = dev.github_username === winnerUsername && highestVal > 0;

                  return (
                    <div key={dev.id} className="dev-bar-line">
                      <span className="dev-tag">@{dev.github_username}</span>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${isLeader ? 'is-leader' : ''}`}
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color.secondary}, ${color.primary})`,
                          }}
                        />
                      </div>
                      <span className="bar-number">
                        {val.toLocaleString()} {metric.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .h2h-chart-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }
        .h2h-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .legend-dev-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f7f3ec;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .legend-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .legend-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        .legend-username {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .metric-row {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 1.15rem 1.25rem;
          border-radius: var(--radius-md);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .metric-label {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.01em;
        }
        .metric-winner-tag {
          font-size: 0.75rem;
          color: var(--text-main);
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
        }
        .bars-stack {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .dev-bar-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dev-tag {
          width: 110px;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
        }
        @media (max-width: 640px) {
          .dev-tag {
            width: 80px;
            font-size: 0.75rem;
          }
        }
        .bar-track {
          flex: 1;
          height: 12px;
          background: #ebe5db;
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bar-fill.is-leader {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        .bar-number {
          width: 90px;
          font-size: 0.8rem;
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--text-main);
          text-align: left;
        }
      `}</style>
    </div>
  );
};
