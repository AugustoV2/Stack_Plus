import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import { PinItem, Repo } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { PinModal } from '../components/PinModal.js';
import {
  Bookmark,
  ExternalLink,
  Star,
  GitFork,
  FileText,
  Tag,
  Trash2,
  Edit3,
  Search,
} from 'lucide-react';

interface Props {
  onInspectDeveloper: (username: string) => void;
  onNavigateToSearch: () => void;
}

export const PinnedPage: React.FC<Props> = ({
  onInspectDeveloper,
  onNavigateToSearch,
}) => {
  const { showToast } = useToast();

  const [pins, setPins] = useState<PinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Edit modal
  const [editingRepo, setEditingRepo] = useState<Repo | null>(null);

  const fetchPins = async () => {
    setLoading(true);
    try {
      const data = await api.getPins();
      setPins(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load pinned repositories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, []);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    pins.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort();
  }, [pins]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      const matchesSearch =
        p.repo.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.repo.description && p.repo.description.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (p.note && p.note.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (p.developer && p.developer.github_username.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchesTag =
        selectedTag === 'all' || (p.tags && p.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [pins, searchFilter, selectedTag]);

  const handleUnpin = async (pinId: number, repoName: string) => {
    if (!confirm(`Are you sure you want to unpin ${repoName}?`)) return;
    try {
      await api.unpin(pinId);
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      showToast(`Unpinned ${repoName}.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to unpin repository.', 'error');
    }
  };

  const handleEditPin = (pin: PinItem) => {
    const repoWithPin: Repo = {
      ...pin.repo,
      is_pinned: true,
      pin_details: {
        id: pin.id,
        note: pin.note,
        tags: pin.tags,
        created_at: pin.created_at,
      },
    };
    setEditingRepo(repoWithPin);
  };

  const handlePinModalSuccess = () => {
    fetchPins();
  };

  return (
    <div className="pinned-page-container">
      {/* Hero Header */}
      <div className="pinned-hero glass-panel">
        <div className="badge badge-amber">
          <Bookmark size={14} /> Curated Repositories
        </div>
        <h1 className="pinned-title">Your Pinned Repositories</h1>
        <p className="pinned-desc">
          Manage your saved GitHub projects, personal architectural annotations, and custom tags.
        </p>

        {/* Controls */}
        <div className="pinned-controls-bar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by repo name, notes, developer, or keyword..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {allTags.length > 0 && (
            <div className="tag-filter-row">
              <span className="tf-lbl">Tag:</span>
              <button
                className={`tag-filter-btn ${selectedTag === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTag('all')}
              >
                All ({pins.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-state glass-panel">
          <div className="loading-spinner" />
          <p>Loading your pinned repositories...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && pins.length === 0 && (
        <div className="empty-pins-state glass-panel animate-slide-in">
          <Bookmark size={48} style={{ color: 'var(--amber-400)', opacity: 0.8 }} />
          <h3>No Pinned Repositories Yet</h3>
          <p>
            When inspecting developer profiles, click the <strong>Pin</strong> button on any repository
            to annotate it with custom notes, key learnings, and tags.
          </p>
          <button className="btn-primary" onClick={onNavigateToSearch}>
            Explore Developers & Repositories
          </button>
        </div>
      )}

      {/* Pinned Repos Grid */}
      {!loading && pins.length > 0 && (
        <div className="pinned-grid animate-slide-in">
          {filteredPins.map((item) => {
            const dev = item.developer;
            const repo = item.repo;

            return (
              <div key={item.id} className="pinned-card glass-panel">
                <div className="card-top">
                  {/* Developer mini row */}
                  {dev && (
                    <div
                      className="dev-mini-info"
                      onClick={() => onInspectDeveloper(dev.github_username)}
                    >
                      <img
                        src={dev.avatar_url}
                        alt={dev.github_username}
                        className="dev-mini-avatar"
                      />
                      <span className="dev-mini-name">@{dev.github_username}</span>
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEditPin(item)}
                      title="Edit note & tags"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleUnpin(item.id, repo.name)}
                      title="Unpin repository"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="repo-main">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="repo-title"
                  >
                    <span>{repo.name}</span>
                    <ExternalLink size={13} />
                  </a>
                  <p className="repo-desc">
                    {repo.description || 'No description provided.'}
                  </p>
                </div>

                {/* Personal Annotation Section */}
                <div className="annotation-container">
                  {item.note ? (
                    <div className="note-text-box">
                      <FileText size={14} className="note-icon" />
                      <p>{item.note}</p>
                    </div>
                  ) : (
                    <div className="no-note-prompt" onClick={() => handleEditPin(item)}>
                      + Click to add your personal notes or architecture highlights
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="tags-row">
                      <Tag size={12} className="tag-icon" />
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="tag-pill tag-pill-clickable"
                          onClick={() => setSelectedTag(t)}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer metrics */}
                <div className="pinned-footer">
                  <div className="footer-stats">
                    {repo.primary_language && (
                      <span className="footer-lang">
                        <span className="lang-mini-dot" />
                        {repo.primary_language}
                      </span>
                    )}
                    <span className="stat-stars">
                      <Star size={13} style={{ color: 'var(--amber-400)' }} />{' '}
                      {(repo.stars || 0).toLocaleString()}
                    </span>
                    {repo.forks > 0 && (
                      <span className="stat-forks">
                        <GitFork size={13} /> {repo.forks.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <span className="pin-saved-date">
                    Pinned {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Pin Modal */}
      <PinModal
        repo={editingRepo}
        onClose={() => setEditingRepo(null)}
        onSuccess={handlePinModalSuccess}
      />

      <style>{`
        .pinned-page-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .pinned-hero {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .pinned-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .pinned-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          max-width: 650px;
        }
        .pinned-controls-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-md);
          flex: 1;
          min-width: 250px;
        }
        .search-icon {
          color: var(--text-dim);
        }
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.85rem;
        }
        .tag-filter-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .tf-lbl {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
        }
        .tag-filter-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          font-size: 0.75rem;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }
        .tag-filter-btn:hover, .tag-filter-btn.active {
          background: rgba(251, 191, 36, 0.15);
          color: var(--amber-400);
          border-color: rgba(251, 191, 36, 0.3);
        }
        .empty-pins-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
          padding: 4rem 2rem;
          max-width: 580px;
          margin: 2rem auto;
        }
        .empty-pins-state h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
        }
        .empty-pins-state p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .pinned-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .pinned-grid {
            grid-template-columns: 1fr;
          }
        }
        .pinned-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-color: rgba(251, 191, 36, 0.25);
          background: rgba(251, 191, 36, 0.02);
          transition: all var(--transition-normal);
        }
        .pinned-card:hover {
          border-color: rgba(251, 191, 36, 0.45);
          transform: translateY(-2px);
        }
        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }
        .dev-mini-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .dev-mini-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
        }
        .dev-mini-name {
          font-size: 0.8rem;
          color: var(--cyan-400);
          font-family: var(--font-mono);
          font-weight: 500;
        }
        .dev-mini-name:hover {
          text-decoration: underline;
        }
        .card-actions {
          display: flex;
          gap: 0.35rem;
        }
        .btn-icon {
          padding: 0.35rem;
          color: var(--text-dim);
          border-radius: var(--radius-sm);
        }
        .btn-icon:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }
        .btn-icon-danger:hover {
          color: var(--rose-500);
          background: rgba(244, 63, 94, 0.1);
        }
        .repo-main {
          margin-bottom: 1rem;
        }
        .repo-title {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }
        .repo-title:hover {
          color: var(--cyan-400);
        }
        .repo-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-top: 0.35rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .annotation-container {
          background: rgba(0, 0, 0, 0.3);
          border: 1px dashed rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .note-text-box {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .note-icon {
          color: var(--amber-400);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .note-text-box p {
          font-size: 0.85rem;
          color: #fef3c7;
          line-height: 1.45;
        }
        .no-note-prompt {
          font-size: 0.78rem;
          color: var(--text-dim);
          font-style: italic;
          cursor: pointer;
        }
        .no-note-prompt:hover {
          color: var(--amber-400);
        }
        .tags-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .tag-icon {
          color: var(--amber-400);
        }
        .tag-pill-clickable {
          cursor: pointer;
        }
        .tag-pill-clickable:hover {
          border-color: var(--amber-400);
          color: var(--amber-400);
        }
        .pinned-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.75rem;
        }
        .footer-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .footer-lang {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .stat-stars {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--amber-400);
          font-family: var(--font-mono);
        }
        .stat-forks {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .pin-saved-date {
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};
