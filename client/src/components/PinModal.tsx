import React, { useState, useEffect } from 'react';
import { Repo } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { X, Bookmark, Tag, FileText, Trash2, Plus } from 'lucide-react';

interface Props {
  repo: Repo | null;
  onClose: () => void;
  onSuccess: (updatedRepo: Repo) => void;
}

const SUGGESTED_TAGS = ['architecture', 'fullstack', 'inspiration', 'performance', 'star', 'tools', 'to-read'];

export const PinModal: React.FC<Props> = ({ repo, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmUnpin, setConfirmUnpin] = useState(false);

  useEffect(() => {
    setConfirmUnpin(false);
    if (repo?.pin_details) {
      setNote(repo.pin_details.note || '');
      setTags(repo.pin_details.tags || []);
    } else {
      setNote('');
      setTags([]);
    }
  }, [repo]);

  if (!repo) return null;

  const isAlreadyPinned = !!repo.is_pinned;

  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().replace(/^#/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let savedPinData: any;
      if (isAlreadyPinned && repo.pin_details?.id) {
        const res = await api.updatePin(repo.pin_details.id, repo.id, note.trim(), tags);
        savedPinData = res.pin;
        showToast('Pin and annotations updated!', 'success');
      } else {
        const res = await api.pinRepo(repo.id, note.trim(), tags);
        savedPinData = res.pin;
        showToast('Repository pinned with custom notes & tags!', 'success');
      }

      onSuccess({
        ...repo,
        is_pinned: true,
        pin_details: {
          id: savedPinData?.id || repo.pin_details?.id || 1,
          note: note.trim() || null,
          tags,
          created_at: savedPinData?.created_at || new Date().toISOString(),
        },
      });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to pin repository.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async () => {
    setLoading(true);
    try {
      if (repo.pin_details?.id) {
        await api.unpin(repo.pin_details.id);
      } else {
        await api.unpinByRepo(repo.id);
      }
      showToast('Repository unpinned.', 'info');
      onSuccess({
        ...repo,
        is_pinned: false,
        pin_details: null,
      });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to unpin repository.', 'error');
    } finally {
      setLoading(false);
      setConfirmUnpin(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-panel animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Bookmark size={20} style={{ color: 'var(--amber-400)' }} />
            <div>
              <h3>{isAlreadyPinned ? 'Edit Pinned Repository' : 'Pin Repository'}</h3>
              <p className="repo-subname">{repo.full_name}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pin-form">
          {/* Notes Section */}
          <div className="form-group">
            <label>
              <FileText size={14} />
              <span>Personal Notes or Highlights</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Clean hexagonal architecture, fantastic async queue implementation, revisit for our microservice setup..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="pin-textarea"
            />
          </div>

          {/* Tags Section */}
          <div className="form-group">
            <label>
              <Tag size={14} />
              <span>Custom Tags</span>
            </label>
            <div className="tag-input-row">
              <input
                type="text"
                placeholder="Type tag and press Enter (e.g. backend)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pin-tag-input"
              />
              <button
                type="button"
                className="btn-secondary btn-add-tag"
                onClick={() => handleAddTag(tagInput)}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Active Tags */}
            {tags.length > 0 && (
              <div className="active-tags-wrap">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill tag-pill-interactive">
                    #{tag}
                    <button
                      type="button"
                      className="tag-remove-x"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="suggested-tags-box">
              <span className="sugg-lbl">Quick suggestions:</span>
              <div className="sugg-list">
                {SUGGESTED_TAGS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`sugg-tag-btn ${tags.includes(st) ? 'added' : ''}`}
                    onClick={() => handleAddTag(st)}
                    disabled={tags.includes(st)}
                  >
                    #{st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-bar">
            {confirmUnpin ? (
              <div className="unpin-confirm-banner">
                <div className="unpin-confirm-left">
                  <div className="unpin-warning-icon">
                    <Trash2 size={15} />
                  </div>
                  <div className="unpin-confirm-texts">
                    <span className="unpin-confirm-title">Remove from Pinned?</span>
                    <span className="unpin-confirm-subtitle">Your notes and custom tags will be permanently removed.</span>
                  </div>
                </div>
                <div className="unpin-confirm-actions">
                  <button
                    type="button"
                    className="btn-unpin-cancel"
                    onClick={() => setConfirmUnpin(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-danger-solid"
                    onClick={handleUnpin}
                    disabled={loading}
                  >
                    <Trash2 size={13} />
                    <span>{loading ? 'Removing...' : 'Yes, Unpin'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isAlreadyPinned ? (
                  <button
                    type="button"
                    className="btn-unpin"
                    onClick={() => setConfirmUnpin(true)}
                    disabled={loading}
                  >
                    <Trash2 size={14} />
                    <span>Unpin</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="action-right-group">
                  <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : isAlreadyPinned ? 'Update Pin' : 'Save Pin'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .repo-subname {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .pin-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pin-textarea {
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          color: var(--text-main);
          padding: 0.85rem;
          font-size: 0.875rem;
          resize: vertical;
          outline: none;
          transition: all var(--transition-fast);
        }
        .pin-textarea:focus {
          border-color: #1e1e1b;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(30, 30, 27, 0.08);
        }
        .tag-input-row {
          display: flex;
          gap: 0.5rem;
        }
        .pin-tag-input {
          flex: 1;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          color: var(--text-main);
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          transition: all var(--transition-fast);
        }
        .pin-tag-input:focus {
          border-color: #1e1e1b;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(30, 30, 27, 0.08);
        }
        .btn-add-tag {
          padding: 0.65rem 1rem;
          font-size: 0.825rem;
        }
        .active-tags-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.5rem;
        }
        .tag-pill-interactive {
          background: #f7f3ec;
          color: var(--text-main);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          display: inline-flex;
          align-items: center;
        }
        .tag-remove-x {
          font-size: 1rem;
          line-height: 1;
          color: var(--rose-500);
          margin-left: 0.35rem;
          cursor: pointer;
        }
        .suggested-tags-box {
          margin-top: 0.5rem;
          font-size: 0.75rem;
        }
        .sugg-lbl {
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.35rem;
          font-weight: 600;
        }
        .sugg-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .sugg-tag-btn {
          background: #ffffff;
          color: var(--text-muted);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          transition: all var(--transition-fast);
        }
        .sugg-tag-btn:hover:not(:disabled) {
          background: #1e1e1b;
          color: #ffffff;
          border-color: #1e1e1b;
        }
        .sugg-tag-btn.added {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .modal-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          margin-top: 0.5rem;
          width: 100%;
        }
        .btn-unpin {
          background: transparent;
          border: 1px solid rgba(225, 29, 72, 0.2);
          color: #be123c;
          padding: 0.6rem 0.95rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-unpin:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.08);
          border-color: #e11d48;
          color: #e11d48;
        }
        .action-right-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .unpin-confirm-banner {
          width: 100%;
          background: #fff5f5;
          border: 1px solid rgba(225, 29, 72, 0.25);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          animation: fadeIn 0.15s ease-out;
        }
        .unpin-confirm-left {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
        }
        .unpin-warning-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.1);
          color: #e11d48;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .unpin-confirm-texts {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .unpin-confirm-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #9f1239;
        }
        .unpin-confirm-subtitle {
          font-size: 0.75rem;
          color: #be123c;
          line-height: 1.35;
        }
        .unpin-confirm-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(225, 29, 72, 0.12);
        }
        .btn-unpin-cancel {
          padding: 0.45rem 0.85rem !important;
          font-size: 0.8rem !important;
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
          color: var(--text-main) !important;
          border-radius: var(--radius-sm) !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all var(--transition-fast) !important;
        }
        .btn-unpin-cancel:hover {
          background: #f7f3ec !important;
        }
        .btn-danger-solid {
          background: #e11d48 !important;
          color: #ffffff !important;
          border: none !important;
          padding: 0.45rem 0.95rem !important;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          border-radius: var(--radius-sm) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.35rem !important;
          cursor: pointer !important;
          transition: all var(--transition-fast) !important;
        }
        .btn-danger-solid:hover:not(:disabled) {
          background: #be123c !important;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.25) !important;
        }
        .btn-danger-solid:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
