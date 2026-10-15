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
  const [compToDelete, setCompToDelete] = useState<SavedComparison | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!compToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteComparison(compToDelete.id);
      setComparisons((prev) => prev.filter((c) => c.id !== compToDelete.id));
      showToast(`Comparison "${compToDelete.name}" deleted.`, 'info');
      setCompToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comparison.', 'error');
    } finally {
      setIsDeleting(false);
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
                    type="button"
                    className="btn-delete-comp"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompToDelete(comp);
                    }}
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
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.04);
        }
        .saved-title {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-main);
        }
        .saved-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          max-width: 650px;
          line-height: 1.5;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.25rem;
          padding: 4rem 2rem;
          max-width: 580px;
          margin: 2rem auto;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.04);
        }
        .empty-state h3 {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .empty-state p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
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
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
          transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
        }
        .comp-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 0, 0, 0.16);
          box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.06);
        }
        .comp-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .comp-name {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text-main);
        }
        .comp-date {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          font-family: var(--font-mono);
        }
        .btn-delete-comp {
          color: var(--text-dim);
          padding: 0.4rem;
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
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 1rem;
          border-radius: var(--radius-md);
        }
        .avatar-stack {
          display: flex;
          align-items: center;
        }
        .stack-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          margin-left: -8px;
          object-fit: cover;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
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
          padding: 0.75rem 1rem;
        }
        .delete-confirm-modal {
          max-width: 440px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2.25rem 2rem;
          background: #ffffff;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.2);
        }
        .delete-modal-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(244, 63, 94, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--rose-500);
        }
        .delete-modal-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }
        .delete-modal-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.55;
          margin: 0;
        }
        .delete-modal-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          width: 100%;
          margin-top: 0.5rem;
        }
        .delete-modal-actions button {
          flex: 1;
          padding: 0.65rem 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
        }
        .btn-danger-confirm {
          background: #e11d48;
          color: #ffffff;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        .btn-danger-confirm:hover:not(:disabled) {
          background: #be123c;
          box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);
        }
        .btn-danger-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {compToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setCompToDelete(null)}>
          <div
            className="modal-container delete-confirm-modal glass-panel animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon-wrap">
              <Trash2 size={24} className="delete-modal-icon" />
            </div>
            <h3 className="delete-modal-title">Delete Comparison?</h3>
            <p className="delete-modal-desc">
              Are you sure you want to delete <strong>"{compToDelete.name}"</strong>? This saved developer battleground will be permanently removed.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCompToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Comparison'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
