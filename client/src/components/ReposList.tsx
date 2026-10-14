import React, { useState, useMemo } from 'react';
import { Repo } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
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
  const { showToast } = useToast();

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
      showToast('Please sign in or use the 1-Click Demo Login to pin repositories.', 'info');
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
          padding: 1rem 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          flex-wrap: wrap;
        }
        .search-input-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.55rem 0.85rem;
          border-radius: 8px;
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
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
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
          font-weight: 500;
          cursor: pointer;
        }
        .select-wrap select option {
          background: #ffffff;
          color: var(--proto-black);
        }
        .repos-count-summary {
          font-size: 0.825rem;
          color: var(--text-muted);
          font-weight: 500;
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
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .repo-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 0, 0, 0.16);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .repo-card.is-pinned-card {
          border-color: rgba(180, 83, 9, 0.3);
          background: #fdfbf7;
        }
        .repo-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .repo-title {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--proto-black);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .repo-title:hover {
          color: var(--proto-indigo);
          text-decoration: underline;
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
          border-radius: 6px;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-muted);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .btn-pin-toggle:hover {
          background: #efe9df;
          color: var(--proto-black);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .btn-pin-toggle.pinned {
          background: rgba(180, 83, 9, 0.1);
          color: var(--proto-amber);
          border-color: rgba(180, 83, 9, 0.3);
        }
        .repo-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.55;
          margin-bottom: 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pinned-annotation-preview {
          background: #faf8f5;
          border: 1px dashed rgba(180, 83, 9, 0.3);
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .pin-note-text {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--proto-amber);
          font-style: italic;
        }
        .pin-tags-preview {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .tag-icon {
          color: var(--proto-amber);
        }
        .repo-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
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
          background: var(--proto-indigo);
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-weight: 600;
        }
        .stat-pill.stars {
          color: var(--proto-amber);
        }
        .pushed-time {
          color: var(--text-dim);
        }
        .no-repos-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
