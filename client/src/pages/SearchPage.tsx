import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Developer, Repo } from '../types/index.js';
import { DeveloperHeader } from '../components/DeveloperHeader.js';
import { ReposList } from '../components/ReposList.js';
import { LanguageDistributionChart } from '../components/Charts/LanguageDistributionChart.js';
import { CommitVelocityChart } from '../components/Charts/CommitVelocityChart.js';
import { PinModal } from '../components/PinModal.js';
import { Search, Sparkles, AlertCircle, Clock, Star, Users, FolderGit2 } from 'lucide-react';

interface Props {
  initialUsername?: string;
  onNavigateToCompareWith: (username: string) => void;
}

const QUICK_PICKS = [
  { name: 'Linus Torvalds', username: 'torvalds', label: 'Linux & Git' },
  { name: 'Dan Abramov', username: 'gaearon', label: 'React & Redux' },
  { name: 'Anthony Fu', username: 'antfu', label: 'Vue & Vite' },
  { name: 'TJ Holowaychuk', username: 'tj', label: 'Express & Koa' },
  { name: 'Evan You', username: 'yyx990803', label: 'Vue.js' },
  { name: 'Sindre Sorhus', username: 'sindresorhus', label: 'Node Pioneer' },
];

export const SearchPage: React.FC<Props> = ({
  initialUsername = '',
  onNavigateToCompareWith,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialUsername);
  const [currentUsername, setCurrentUsername] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [recentDevs, setRecentDevs] = useState<Developer[]>([]);

  // Pin modal state
  const [activePinRepo, setActivePinRepo] = useState<Repo | null>(null);

  // Load recent developers
  useEffect(() => {
    async function loadRecent() {
      try {
        const list = await api.getRecentDevelopers();
        setRecentDevs(list);
      } catch (err) {
        // quiet
      }
    }
    loadRecent();
  }, []);

  // Fetch developer profile
  const fetchDev = async (usernameToFetch: string, refresh = false) => {
    if (!usernameToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDeveloper(usernameToFetch.trim(), refresh);
      setDeveloper(res.developer);
      setRepos(res.repos);
      setFromCache(res.from_cache);
      setCurrentUsername(res.developer.github_username);
      setSearchTerm(res.developer.github_username);

      // Refresh recent list in background
      api.getRecentDevelopers().then(setRecentDevs).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load GitHub developer profile.');
      setDeveloper(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsername) {
      fetchDev(initialUsername);
    }
  }, [initialUsername]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchDev(searchTerm);
    }
  };

  const handleQuickPick = (u: string) => {
    setSearchTerm(u);
    fetchDev(u);
  };

  const handlePinSuccess = (updatedRepo: Repo) => {
    setRepos((prev) =>
      prev.map((r) => (r.id === updatedRepo.id ? updatedRepo : r))
    );
  };

  return (
    <div className="search-page-container">
      {/* Hero Search Section */}
      <div className="search-hero glass-panel">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            <span>Developer Intelligence & Head-to-Head Comparison</span>
          </div>
          <h1 className="hero-title">
            Search Any <span className="gradient-text">GitHub Developer</span>
          </h1>
          <p className="hero-subtitle">
            Inspect real-time developer profiles, aggregate star velocity, programming language breakdown,
            and pin favorite repositories.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-bar-wrap">
              <Search size={20} className="search-bar-icon" />
              <input
                type="text"
                placeholder="Enter GitHub username (e.g. torvalds, gaearon, antfu)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus={!developer}
              />
              <button
                type="submit"
                className="btn-primary search-submit-btn"
                disabled={loading || !searchTerm.trim()}
              >
                {loading ? 'Fetching...' : 'Lookup Developer'}
              </button>
            </div>
          </form>

          {/* Quick Picks */}
          <div className="quick-picks-bar">
            <span className="qp-title">
              <Sparkles size={14} style={{ color: 'var(--amber-400)' }} /> Quick Picks:
            </span>
            <div className="qp-buttons">
              {QUICK_PICKS.map((qp) => (
                <button
                  key={qp.username}
                  className="qp-chip"
                  onClick={() => handleQuickPick(qp.username)}
                  type="button"
                >
                  <span className="qp-user">@{qp.username}</span>
                  <span className="qp-label">{qp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner glass-panel animate-slide-in">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-text">
            <strong>Developer lookup failed</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-state glass-panel animate-slide-in">
          <div className="loading-spinner" />
          <p>Querying GitHub API & Computing Developer Analytics...</p>
        </div>
      )}

      {/* Developer Profile View */}
      {!loading && developer && (
        <div className="dev-dashboard">
          {/* Header Profile Card */}
          <DeveloperHeader
            developer={developer}
            fromCache={fromCache}
            onRefresh={() => fetchDev(developer.github_username, true)}
            onAddToCompare={onNavigateToCompareWith}
          />

          {/* Analytics Visualizations Row */}
          <div className="analytics-grid">
            <div className="chart-box glass-panel">
              <LanguageDistributionChart languages={developer.top_languages} />
            </div>

            <div className="chart-box glass-panel">
              <CommitVelocityChart activity={developer.commit_activity} />
            </div>
          </div>

          {/* Repositories Explorer */}
          <div className="repos-section-wrap">
            <div className="section-title-row">
              <h2>Notable Repositories & Activity</h2>
              <span className="section-sub">
                Browse codebases, review stars & forks, and pin favorites with custom notes & tags
              </span>
            </div>

            <ReposList
              repos={repos}
              onPinClick={(repo) => setActivePinRepo(repo)}
            />
          </div>
        </div>
      )}

      {/* Recent Developers (shown when no dev loaded or at bottom) */}
      {!loading && !developer && recentDevs.length > 0 && (
        <div className="recent-devs-section glass-panel animate-slide-in">
          <div className="recent-header">
            <Clock size={16} />
            <h3>Recently Explored on StackPulse</h3>
          </div>

          <div className="recent-grid">
            {recentDevs.map((dev) => (
              <div
                key={dev.id}
                className="recent-dev-card"
                onClick={() => handleQuickPick(dev.github_username)}
              >
                <img
                  src={dev.avatar_url}
                  alt={dev.github_username}
                  className="recent-avatar"
                />
                <div className="recent-info">
                  <div className="recent-name">{dev.name || dev.github_username}</div>
                  <div className="recent-username">@{dev.github_username}</div>
                  <div className="recent-meta">
                    <span>
                      <Star size={11} /> {dev.total_stars.toLocaleString()}
                    </span>
                    <span>
                      <FolderGit2 size={11} /> {dev.public_repos} repos
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pin Modal */}
      <PinModal
        repo={activePinRepo}
        onClose={() => setActivePinRepo(null)}
        onSuccess={handlePinSuccess}
      />

      <style>{`
        .search-page-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .search-hero {
          padding: 2.75rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero-content {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: var(--cyan-400);
          padding: 0.3rem 0.85rem;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 600;
        }
        .hero-title {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--cyan-400), var(--indigo-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 650px;
        }
        .search-form {
          width: 100%;
          max-width: 660px;
          margin-top: 0.5rem;
        }
        .search-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(15, 23, 42, 0.9);
          border: 1.5px solid rgba(56, 189, 248, 0.3);
          border-radius: var(--radius-lg);
          padding: 0.45rem 0.6rem 0.45rem 1.1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), var(--shadow-glow-cyan);
          transition: border-color var(--transition-fast);
        }
        .search-bar-wrap:focus-within {
          border-color: var(--cyan-400);
          box-shadow: 0 10px 35px rgba(6, 182, 212, 0.3);
        }
        .search-bar-icon {
          color: var(--cyan-400);
          flex-shrink: 0;
        }
        .search-bar-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 1rem;
        }
        .search-submit-btn {
          padding: 0.75rem 1.35rem;
        }
        .quick-picks-bar {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.5rem;
        }
        .qp-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .qp-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
        .qp-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          color: var(--text-main);
          transition: all var(--transition-fast);
        }
        .qp-chip:hover {
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }
        .qp-user {
          font-weight: 600;
          color: var(--cyan-400);
        }
        .qp-label {
          color: var(--text-dim);
          font-size: 0.7rem;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-md);
        }
        .error-icon {
          color: var(--rose-500);
          flex-shrink: 0;
        }
        .error-text strong {
          color: #ffffff;
          display: block;
          font-size: 0.95rem;
        }
        .error-text p {
          color: #fca5a5;
          font-size: 0.85rem;
          margin-top: 0.2rem;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3.5rem;
          color: var(--cyan-400);
          font-weight: 600;
        }
        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(56, 189, 248, 0.2);
          border-top-color: var(--cyan-400);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .chart-box {
          padding: 1.5rem;
        }
        .section-title-row {
          margin-bottom: 1.25rem;
        }
        .section-title-row h2 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
        }
        .section-sub {
          font-size: 0.85rem;
          color: var(--text-dim);
        }
        .recent-devs-section {
          padding: 1.5rem;
        }
        .recent-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.25rem;
        }
        .recent-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .recent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        .recent-dev-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .recent-dev-card:hover {
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.3);
          transform: translateY(-2px);
        }
        .recent-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          object-fit: cover;
        }
        .recent-info {
          overflow: hidden;
        }
        .recent-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-username {
          font-size: 0.75rem;
          color: var(--cyan-400);
          font-family: var(--font-mono);
        }
        .recent-meta {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.7rem;
          color: var(--text-dim);
          margin-top: 0.2rem;
        }
      `}</style>
    </div>
  );
};
