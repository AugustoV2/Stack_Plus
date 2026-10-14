import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { CompareResponse } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { HeadToHeadBarChart } from '../components/Charts/HeadToHeadBarChart.js';
import {
  GitCompare,
  Plus,
  X,
  Save,
  Star,
  Users,
  FolderGit2,
  Activity,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface Props {
  initialUsernames?: string[];
  onInspectDeveloper: (username: string) => void;
}

const PRESET_COMPARISONS = [
  {
    name: 'Frontend Framework Titans',
    devs: ['gaearon', 'yyx990803'],
    desc: 'React creator Dan Abramov vs Vue creator Evan You',
  },
  {
    name: 'Open Source Pioneers',
    devs: ['torvalds', 'antfu'],
    desc: 'Git creator Linus Torvalds vs Vite/Vue core Anthony Fu',
  },
  {
    name: 'Node.js Heavyweights',
    devs: ['tj', 'sindresorhus'],
    desc: 'TJ Holowaychuk vs Sindre Sorhus',
  },
];

export const ComparePage: React.FC<Props> = ({
  initialUsernames = ['gaearon', 'yyx990803'],
  onInspectDeveloper,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [usernames, setUsernames] = useState<string[]>(initialUsernames);
  const [newDevInput, setNewDevInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [saving, setSaving] = useState(false);

  // Load comparison whenever usernames change
  const runComparison = async (namesToCompare: string[]) => {
    if (namesToCompare.length < 2) {
      setError('Please select at least 2 developers to compare head-to-head.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareDevelopers(namesToCompare);
      setCompareData(res);
      if (res.failed_usernames && res.failed_usernames.length > 0) {
        showToast(
          `Could not fetch data for: ${res.failed_usernames.join(', ')}`,
          'info'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate comparison.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usernames.length >= 2) {
      runComparison(usernames);
    }
  }, []);

  const handleAddDeveloper = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newDevInput.trim().toLowerCase();
    if (!clean) return;
    if (usernames.includes(clean)) {
      showToast(`@${clean} is already in the comparison.`, 'info');
      setNewDevInput('');
      return;
    }
    const updated = [...usernames, clean];
    setUsernames(updated);
    setNewDevInput('');
    runComparison(updated);
  };

  const handleRemoveDeveloper = (usernameToRemove: string) => {
    if (usernames.length <= 2) {
      showToast('A comparison requires at least 2 developers.', 'info');
      return;
    }
    const updated = usernames.filter((u) => u !== usernameToRemove);
    setUsernames(updated);
    runComparison(updated);
  };

  const handleSelectPreset = (devs: string[]) => {
    setUsernames(devs);
    runComparison(devs);
  };

  const handleOpenSaveModal = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setComparisonName(
      usernames.map((u) => `@${u}`).join(' vs ')
    );
    setIsSaveModalOpen(true);
  };

  const handleSaveComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparisonName.trim()) return;

    setSaving(true);
    try {
      await api.saveComparison(comparisonName.trim(), usernames);
      showToast(`Comparison "${comparisonName.trim()}" saved to your account!`, 'success');
      setIsSaveModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save comparison.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="compare-page-container">
      {/* Header Bar */}
      <div className="compare-hero glass-panel">
        <div className="hero-top-row">
          <div>
            <div className="badge badge-indigo">
              <GitCompare size={14} /> Signature Feature
            </div>
            <h1 className="compare-title">Head-to-Head Comparison</h1>
            <p className="compare-desc">
              Benchmark stars, programming language velocity, commit frequency, and repository scale side-by-side.
            </p>
          </div>

          <button
            className="btn-primary btn-save-comp"
            onClick={handleOpenSaveModal}
            disabled={!compareData || compareData.developers.length < 2}
          >
            <Save size={16} />
            <span>Save Comparison</span>
          </button>
        </div>

        {/* Developer Selector Chips */}
        <div className="dev-chips-selector">
          <div className="selected-devs-list">
            {usernames.map((u) => (
              <span key={u} className="dev-select-pill">
                <strong>@{u}</strong>
                <button
                  type="button"
                  className="pill-remove-btn"
                  onClick={() => handleRemoveDeveloper(u)}
                  title="Remove from comparison"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Developer Form */}
          <form onSubmit={handleAddDeveloper} className="add-dev-form">
            <input
              type="text"
              placeholder="Add another GitHub user (e.g. tj)..."
              value={newDevInput}
              onChange={(e) => setNewDevInput(e.target.value)}
              className="add-dev-input"
            />
            <button
              type="submit"
              className="btn-secondary btn-add"
              disabled={!newDevInput.trim() || loading}
            >
              <Plus size={15} /> Add
            </button>
          </form>
        </div>

        {/* Presets */}
        <div className="presets-row">
          <span className="preset-lbl">
            <Sparkles size={13} style={{ color: 'var(--amber-400)' }} /> Popular Battles:
          </span>
          <div className="preset-buttons">
            {PRESET_COMPARISONS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="preset-btn"
                onClick={() => handleSelectPreset(p.devs)}
              >
                {p.name} ({p.devs.join(' vs ')})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="compare-error glass-panel">
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loading-state glass-panel animate-slide-in">
          <div className="loading-spinner" />
          <div className="loading-text-wrap">
            <h3 className="loading-main-title">Crunching Head-to-Head Developer Metrics</h3>
            <p className="loading-sub-title">
              Aggregating repositories, language byte distributions, and commit velocity...
            </p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {!loading && compareData && compareData.developers.length >= 2 && (
        <div className="compare-results-layout animate-slide-in">
          {/* Developer Head-to-Head Cards */}
          <div className="dev-h2h-cards-grid">
            {compareData.developers.map((dev) => (
              <div key={dev.id} className="h2h-card glass-panel">
                <div className="h2h-card-header">
                  <img
                    src={dev.avatar_url}
                    alt={dev.github_username}
                    className="h2h-avatar"
                  />
                  <div className="h2h-title-col">
                    <h3 className="h2h-name">{dev.name || dev.github_username}</h3>
                    <div className="h2h-links">
                      <span className="h2h-username">@{dev.github_username}</span>
                      <button
                        className="btn-inspect-link"
                        onClick={() => onInspectDeveloper(dev.github_username)}
                        title="View Full Profile & Repos"
                      >
                        Inspect Profile <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key stats summary */}
                <div className="h2h-stats-grid">
                  <div className="h2h-stat-cell">
                    <span className="stat-label">
                      <Star size={13} style={{ color: 'var(--amber-400)' }} /> Total Stars
                    </span>
                    <span className="stat-value">{dev.total_stars.toLocaleString()}</span>
                  </div>

                  <div className="h2h-stat-cell">
                    <span className="stat-label">
                      <Users size={13} style={{ color: 'var(--cyan-400)' }} /> Followers
                    </span>
                    <span className="stat-value">{dev.followers.toLocaleString()}</span>
                  </div>

                  <div className="h2h-stat-cell">
                    <span className="stat-label">
                      <FolderGit2 size={13} style={{ color: '#a5b4fc' }} /> Repositories
                    </span>
                    <span className="stat-value">{dev.public_repos.toLocaleString()}</span>
                  </div>

                  <div className="h2h-stat-cell">
                    <span className="stat-label">
                      <Activity size={13} style={{ color: 'var(--emerald-400)' }} /> Commits (7d)
                    </span>
                    <span className="stat-value">{dev.total_recent_commits}</span>
                  </div>
                </div>

                {/* Primary Language */}
                <div className="h2h-lang-box">
                  <span className="hl-label">Top Language:</span>
                  <span className="badge badge-cyan">{dev.primary_language}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Benchmark Bar Charts */}
          <div className="chart-section glass-panel">
            <div className="chart-sec-header">
              <Award size={18} style={{ color: 'var(--amber-400)' }} />
              <div>
                <h3>Head-to-Head Metric Leaders</h3>
                <span className="chart-sec-sub">
                  Proportional metrics across stars, repositories, followers, and push velocity
                </span>
              </div>
            </div>

            <HeadToHeadBarChart developers={compareData.developers} />
          </div>

          {/* Language Matrix Breakdown */}
          {compareData.language_matrix.length > 0 && (
            <div className="matrix-section glass-panel">
              <div className="matrix-header">
                <h3>Programming Language Overlap</h3>
                <span className="matrix-sub">
                  Relative percentage of total codebase across all compared developers
                </span>
              </div>

              <div className="matrix-table-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Language</th>
                      {compareData.developers.map((d) => (
                        <th key={d.id}>@{d.github_username}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.language_matrix.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td className="lang-cell">
                          <span className="cell-lang-name">{row.language}</span>
                        </td>
                        {compareData.developers.map((d) => {
                          const pct = row[d.github_username] || 0;
                          return (
                            <td key={d.id} className="pct-cell">
                              {pct > 0 ? (
                                <div className="pct-bar-wrap">
                                  <div
                                    className="mini-pct-bar"
                                    style={{ width: `${Math.min(pct * 1.5, 100)}%` }}
                                  />
                                  <span>{pct}%</span>
                                </div>
                              ) : (
                                <span className="empty-pct">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Comparison Modal */}
      {isSaveModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSaveModalOpen(false)}>
          <div
            className="modal-container glass-panel animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="header-title">
                <Save size={18} style={{ color: 'var(--cyan-400)' }} />
                <h3>Save Named Comparison</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsSaveModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveComparison} className="save-form">
              <div className="form-group">
                <label>Comparison Name</label>
                <input
                  type="text"
                  placeholder="e.g. React vs Vue Titans, Rust Systems Pros..."
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="saving-devs-preview">
                <span className="lbl">Developers included:</span>
                <div className="prev-chips">
                  {usernames.map((u) => (
                    <span key={u} className="badge badge-cyan">
                      @{u}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsSaveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !comparisonName.trim()}
                >
                  {saving ? 'Saving...' : 'Save to My Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .compare-page-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .compare-hero {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .hero-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .compare-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-top: 0.4rem;
        }
        .compare-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-top: 0.25rem;
          max-width: 650px;
        }
        .dev-chips-selector {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }
        .selected-devs-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .dev-select-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(56, 189, 248, 0.15);
          color: var(--cyan-400);
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
        }
        .pill-remove-btn {
          color: var(--text-dim);
          display: flex;
          align-items: center;
        }
        .pill-remove-btn:hover {
          color: var(--rose-500);
        }
        .add-dev-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .add-dev-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-main);
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          outline: none;
        }
        .add-dev-input:focus {
          border-color: var(--cyan-400);
        }
        .presets-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          font-size: 0.78rem;
        }
        .preset-lbl {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
        }
        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .preset-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: var(--text-muted);
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          transition: all var(--transition-fast);
        }
        .preset-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #c7d2fe;
          border-color: rgba(99, 102, 241, 0.3);
        }
        .compare-results-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .dev-h2h-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .h2h-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .h2h-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .h2h-avatar {
          width: 58px;
          height: 58px;
          border-radius: var(--radius-md);
          border: 2px solid rgba(56, 189, 248, 0.3);
          object-fit: cover;
        }
        .h2h-title-col {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .h2h-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }
        .h2h-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .h2h-username {
          font-size: 0.85rem;
          color: var(--cyan-400);
          font-family: var(--font-mono);
        }
        .btn-inspect-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }
        .btn-inspect-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .h2h-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .h2h-stat-cell {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .stat-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
        .stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          font-family: var(--font-mono);
        }
        .h2h-lang-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.85rem;
        }
        .hl-label {
          color: var(--text-muted);
        }
        .chart-section {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .chart-sec-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .chart-sec-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }
        .chart-sec-sub {
          font-size: 0.8rem;
          color: var(--text-dim);
        }
        .matrix-section {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .matrix-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }
        .matrix-sub {
          font-size: 0.8rem;
          color: var(--text-dim);
        }
        .matrix-table-wrap {
          overflow-x: auto;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .matrix-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        .matrix-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .lang-cell {
          font-weight: 600;
          color: #ffffff;
        }
        .pct-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-family: var(--font-mono);
          color: var(--cyan-400);
        }
        .mini-pct-bar {
          height: 6px;
          background: linear-gradient(90deg, var(--indigo-500), var(--cyan-400));
          border-radius: var(--radius-full);
        }
        .empty-pct {
          color: var(--text-dim);
        }
        .save-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }
        .save-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }
        .save-form .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .save-form input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all var(--transition-fast);
        }
        .save-form input:focus {
          border-color: var(--cyan-400);
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
          background: rgba(255, 255, 255, 0.07);
        }
        .saving-devs-preview {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .saving-devs-preview .lbl {
          font-size: 0.75rem;
          color: var(--text-dim);
        }
        .prev-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
      `}</style>
    </div>
  );
};
