import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SavedComparison } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import {
  Save,
  GitCompare,
  Trash2,
  Calendar,
  ExternalLink,
  Users,
} from 'lucide-react';

interface Props {
  onLoadComparison: (usernames: string[]) => void;
  onNavigateToCompare: () => void;
}

export const SavedComparisonsPage: React.FC<Props> = ({
  onLoadComparison,
  onNavigateToCompare,
}) => {
  const { showToast } = useToast();

  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisons = async () => {
    setLoading(true);
    try {
      const data = await api.getSavedComparisons();
      setComparisons(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve saved comparisons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the saved comparison "${name}"?`)) return;
    try {
      await api.deleteComparison(id);
      setComparisons((prev) => prev.filter((c) => c.id !== id));
      showToast(`Comparison "${name}" deleted.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comparison.', 'error');
    }
  };

  const handleLaunch = (comp: SavedComparison) => {
    const usernames = comp.developers.map((d) => d.github_username);
    onLoadComparison(usernames);
  };

  return (
    <div className="saved-comps-container">
      {/* Hero Header */}
      <div className="saved-hero glass-panel">
        <div className="badge badge-indigo">
          <Save size={14} /> Saved Battleground
        </div>
        <h1 className="saved-title">Saved Developer Comparisons</h1>
        <p className="saved-desc">
          Revisit and reload your custom head-to-head developer benchmarks with one click.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-state glass-panel">
          <div className="loading-spinner" />
          <p>Retrieving your saved comparisons...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && comparisons.length === 0 && (
        <div className="empty-state glass-panel animate-slide-in">
          <GitCompare size={48} style={{ color: 'var(--cyan-400)', opacity: 0.8 }} />
          <h3>No Saved Comparisons Yet</h3>
          <p>
            Put two or more developers head-to-head in the Compare view, then click{' '}
            <strong>Save Comparison</strong> to store it here for future reference.
          </p>
          <button className="btn-primary" onClick={onNavigateToCompare}>
            Launch Compare View
          </button>
        </div>
      )}

      {/* Grid of Saved Comparisons */}
      {!loading && comparisons.length > 0 && (
        <div className="saved-grid animate-slide-in">
          {comparisons.map((comp) => {
            const devUsernames = comp.developers.map((d) => d.github_username);

            return (
              <div key={comp.id} className="comp-card glass-panel">
                <div className="comp-card-header">
                  <div>
                    <h3 className="comp-name">{comp.name}</h3>
                    <div className="comp-date">
                      <Calendar size={13} />
                      <span>{new Date(comp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    className="btn-delete-comp"
                    onClick={() => handleDelete(comp.id, comp.name)}
                    title="Delete saved comparison"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Developers Avatars & Tags */}
                <div className="comp-devs-row">
                  <div className="avatar-stack">
                    {comp.developers.map((d) => (
                      <img
                        key={d.id}
                        src={d.avatar_url}
                        alt={d.github_username}
                        title={`@${d.github_username}`}
                        className="stack-avatar"
                      />
                    ))}
                  </div>

                  <div className="dev-names-list">
                    {comp.developers.map((d) => (
                      <span key={d.id} className="badge badge-cyan">
                        @{d.github_username}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <div className="comp-card-footer">
                  <button
                    className="btn-primary btn-launch-comp"
                    onClick={() => handleLaunch(comp)}
                  >
                    <span>Launch Comparison</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .saved-comps-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .saved-hero {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .saved-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .saved-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          max-width: 650px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
          padding: 4rem 2rem;
          max-width: 580px;
          margin: 2rem auto;
        }
        .empty-state h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
        }
        .empty-state p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .saved-grid {
            grid-template-columns: 1fr;
          }
        }
        .comp-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.25rem;
          transition: transform var(--transition-normal), border-color var(--transition-normal);
        }
        .comp-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .comp-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .comp-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }
        .comp-date {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-top: 0.25rem;
        }
        .btn-delete-comp {
          color: var(--text-dim);
          padding: 0.35rem;
          border-radius: var(--radius-sm);
        }
        .btn-delete-comp:hover {
          color: var(--rose-500);
          background: rgba(244, 63, 94, 0.1);
        }
        .comp-devs-row {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 0.85rem;
          border-radius: var(--radius-md);
        }
        .avatar-stack {
          display: flex;
          align-items: center;
        }
        .stack-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #090d16;
          margin-left: -8px;
          object-fit: cover;
        }
        .stack-avatar:first-child {
          margin-left: 0;
        }
        .dev-names-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .comp-card-footer {
          padding-top: 0.5rem;
        }
        .btn-launch-comp {
          width: 100%;
          padding: 0.65rem 1rem;
        }
      `}</style>
    </div>
  );
};
