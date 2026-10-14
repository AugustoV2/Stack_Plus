import React from 'react';
import { LanguageStat } from '../../types/index.js';

interface Props {
  languages: LanguageStat[];
  title?: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Shell: '#89e051',
  Solidity: '#aa6746',
};

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || '#6366f1';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const LanguageDistributionChart: React.FC<Props> = ({ languages, title = 'Language Distribution' }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="empty-chart-state">
        <p>No primary language data available.</p>
      </div>
    );
  }

  return (
    <div className="language-chart-wrapper">
      <div className="chart-header">
        <h4>{title}</h4>
        <span className="lang-count">{languages.length} detected</span>
      </div>

      {/* Multi-segmented bar */}
      <div className="lang-progress-bar">
        {languages.map((lang, idx) => (
          <div
            key={idx}
            className="lang-segment"
            style={{
              width: `${Math.max(lang.percentage, 2)}%`,
              backgroundColor: getLangColor(lang.language),
            }}
            title={`${lang.language}: ${lang.percentage}% (${formatBytes(lang.bytes)})`}
          />
        ))}
      </div>

      {/* Language Breakdown Grid */}
      <div className="lang-legend-grid">
        {languages.map((lang, idx) => (
          <div key={idx} className="lang-legend-item">
            <span
              className="lang-dot"
              style={{ backgroundColor: getLangColor(lang.language) }}
            />
            <span className="lang-name">{lang.language}</span>
            <span className="lang-pct">{lang.percentage}%</span>
            <span className="lang-bytes">{formatBytes(lang.bytes)}</span>
          </div>
        ))}
      </div>

      <style>{`
        .language-chart-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chart-header h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .lang-count {
          font-size: 0.75rem;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
        }
        .lang-progress-bar {
          display: flex;
          height: 10px;
          border-radius: var(--radius-full);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .lang-segment {
          transition: width 0.4s ease;
        }
        .lang-segment:hover {
          filter: brightness(1.25);
          cursor: pointer;
        }
        .lang-legend-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 0.65rem;
        }
        .lang-legend-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.35rem 0.55rem;
          border-radius: var(--radius-sm);
        }
        .lang-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lang-name {
          font-weight: 600;
          color: var(--text-main);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .lang-pct {
          font-weight: 700;
          color: var(--cyan-400);
        }
        .lang-bytes {
          font-size: 0.7rem;
          color: var(--text-dim);
          display: none;
        }
        .empty-chart-state {
          color: var(--text-dim);
          font-size: 0.85rem;
          padding: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
