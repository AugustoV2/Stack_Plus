import React, { useState, useMemo } from 'react';
import { Repo } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Star,
  GitFork,
  Bookmark,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  FileText,
} from 'lucide-react';

interface Props {
  repos: Repo[];
  onPinClick: (repo: Repo) => void;
}

export const ReposList: React.FC<Props> = ({ repos, onPinClick }) => {
  const { user, openAuthModal } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'pushed' | 'forks' | 'name'>('stars');

  // Extract unique languages
  const languages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.primary_language) langs.add(r.primary_language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Filter and sort repos
  const filteredRepos = useMemo(() => {
    return repos
      .filter((r) => {
        const matchesQuery =
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesLang =
          selectedLanguage === 'all' || r.primary_language === selectedLanguage;

        return matchesQuery && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
        if (sortBy === 'forks') return (b.forks || 0) - (a.forks || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'pushed') {
          const timeA = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
          const timeB = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [repos, searchQuery, selectedLanguage, sortBy]);

  const handlePinAction = (repo: Repo) => {
    if (!user) {
      openAuthModal();
      return;
    }
    onPinClick(repo);
  };

  return (
    <div className="repos-section">
      {/* Controls Bar */}
      <div className="repos-controls-bar glass-panel">
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search repositories by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filters-group">
          {/* Language filter */}
          <div className="select-wrap">
            <Filter size={14} className="select-icon" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="select-wrap">
            <ArrowUpDown size={14} className="select-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="stars">Most Stars</option>
              <option value="pushed">Recently Pushed</option>
              <option value="forks">Most Forks</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="repos-count-summary">
        Showing <strong>{filteredRepos.length}</strong> of {repos.length} repositories
      </div>

      {/* Grid of Repos */}
      {filteredRepos.length === 0 ? (
        <div className="no-repos-state glass-panel">
          <p>No repositories match your current search or filter criteria.</p>
        </div>
      ) : (
        <div className="repos-grid">
          {filteredRepos.map((repo) => {
            const isPinned = !!repo.is_pinned;
            const updatedDate = repo.pushed_at
              ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div
                key={repo.id}
                className={`repo-card glass-panel ${isPinned ? 'is-pinned-card' : ''}`}
              >
                <div className="repo-card-top">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="repo-title"
                  >
                    <span>{repo.name}</span>
                    <ExternalLink size={13} className="ext-icon" />
                  </a>

                  {/* Pin toggle button */}
                  <button
                    className={`btn-pin-toggle ${isPinned ? 'pinned' : ''}`}
                    onClick={() => handlePinAction(repo)}
                    title={isPinned ? 'Edit note and tags' : 'Pin to favorites'}
                  >
                    <Bookmark size={15} />
                    <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>

                <p className="repo-desc">
                  {repo.description || 'No description provided by the developer.'}
                </p>

                {/* Pin note preview if pinned */}
                {isPinned && repo.pin_details && (
                  <div className="pinned-annotation-preview">
                    {repo.pin_details.note && (
                      <div className="pin-note-text">
                        <FileText size={12} />
                        <span>{repo.pin_details.note}</span>
                      </div>
                    )}
                    {repo.pin_details.tags && repo.pin_details.tags.length > 0 && (
                      <div className="pin-tags-preview">
                        <Tag size={12} className="tag-icon" />
                        {repo.pin_details.tags.map((t) => (
                          <span key={t} className="tag-pill">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer stats */}
                <div className="repo-card-footer">
                  <div className="stats-left">
                    {repo.primary_language && (
                      <span className="lang-indicator">
                        <span className="lang-mini-dot" />
                        {repo.primary_language}
                      </span>
                    )}

                    <span className="stat-pill stars">
                      <Star size={13} /> {(repo.stars || 0).toLocaleString()}
                    </span>

                    {repo.forks > 0 && (
                      <span className="stat-pill forks">
                        <GitFork size={13} /> {repo.forks.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {updatedDate && (
                    <span className="pushed-time">Pushed {updatedDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .repos-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .repos-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          flex-wrap: wrap;
        }
        .search-input-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.55rem 0.85rem;
          border-radius: var(--radius-md);
          flex: 1;
          min-width: 250px;
        }
        .search-icon {
          color: var(--text-dim);
        }
        .search-input-box input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.875rem;
        }
        .clear-search-btn {
          color: var(--text-dim);
          font-size: 0.8rem;
        }
        .filters-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .select-wrap {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-md);
        }
        .select-icon {
          color: var(--text-dim);
        }
        .select-wrap select {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.825rem;
          cursor: pointer;
        }
        .select-wrap select option {
          background: #0f172a;
          color: #ffffff;
        }
        .repos-count-summary {
          font-size: 0.825rem;
          color: var(--text-dim);
        }
        .repos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .repos-grid {
            grid-template-columns: 1fr;
          }
        }
        .repo-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.25rem;
          border-radius: var(--radius-md);
          transition: transform var(--transition-normal), border-color var(--transition-normal);
        }
        .repo-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .repo-card.is-pinned-card {
          border-color: rgba(251, 191, 36, 0.4);
          background: rgba(251, 191, 36, 0.03);
        }
        .repo-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.65rem;
        }
        .repo-title {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .repo-title:hover {
          color: var(--cyan-400);
        }
        .ext-icon {
          color: var(--text-dim);
          flex-shrink: 0;
        }
        .btn-pin-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .btn-pin-toggle:hover {
          background: rgba(251, 191, 36, 0.15);
          color: var(--amber-400);
          border-color: rgba(251, 191, 36, 0.3);
        }
        .btn-pin-toggle.pinned {
          background: rgba(251, 191, 36, 0.15);
          color: var(--amber-400);
          border-color: rgba(251, 191, 36, 0.4);
        }
        .repo-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pinned-annotation-preview {
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-sm);
          padding: 0.55rem 0.75rem;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .pin-note-text {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: #fef3c7;
          font-style: italic;
        }
        .pin-tags-preview {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .tag-icon {
          color: var(--amber-400);
        }
        .repo-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.75rem;
        }
        .stats-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .lang-indicator {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .lang-mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--cyan-400);
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .stat-pill.stars {
          color: var(--amber-400);
        }
        .pushed-time {
          color: var(--text-dim);
        }
        .no-repos-state {
          padding: 2.5rem;
          text-align: center;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};
