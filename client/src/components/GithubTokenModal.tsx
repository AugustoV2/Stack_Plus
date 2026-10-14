import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { X, Key, ShieldCheck, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated: () => void;
}

export const GithubTokenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTokenUpdated,
}) => {
  const { showToast } = useToast();

  const [tokenInput, setTokenInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [maskedToken, setMaskedToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getTokenStatus()
        .then((res) => {
          setConfigured(res.configured);
          setMaskedToken(res.maskedToken || null);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    try {
      const res = await api.saveGithubToken(tokenInput.trim());
      showToast(res.message || 'Token verified and saved in database!', 'success');
      setConfigured(true);
      setTokenInput('');
      onTokenUpdated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to verify token with GitHub.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove saved GitHub token from database? Quota will revert to unauthenticated (60/hr).')) return;
    setLoading(true);
    try {
      await api.deleteGithubToken();
      showToast('GitHub token removed.', 'info');
      setConfigured(false);
      setMaskedToken(null);
      onTokenUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove token.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-panel animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Key size={20} style={{ color: 'var(--amber-400)' }} />
            <div>
              <h3>GitHub API Authentication</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="token-modal-body">
          <p className="token-intro">
            GitHub limits unauthenticated searches to <strong>60 requests/hour</strong>.
            Adding a free Personal Access Token to your <strong>account profile</strong> unlocks <strong>5,000 requests/hour</strong> and is
            <strong> saved securely on your user account in PostgreSQL</strong>.
          </p>

          {/* Configured status banner */}
          {configured && (
            <div className="token-configured-banner">
              <div className="conf-left">
                <ShieldCheck size={18} style={{ color: 'var(--emerald-400)' }} />
                <div>
                  <strong>Active Token on Your Account</strong>
                  <span className="masked-val">{maskedToken}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={handleRemove}
                disabled={loading}
                title="Remove token from account"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="token-form">
            <div className="form-group">
              <label>
                <span>{configured ? 'Replace Token' : 'Enter GitHub Personal Access Token'}</span>
              </label>
              <div className="token-input-wrapper">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoFocus={!configured}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowSecret(!showSecret)}
                  title={showSecret ? 'Hide token' : 'Show token'}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="token-help-box">
              <span className="help-step">1. Go to GitHub: </span>
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noreferrer"
                className="gh-link"
              >
                github.com/settings/tokens/new <ExternalLink size={12} />
              </a>
              <span className="help-note">
                (No checkboxes or permissions required — public read-only access is default)
              </span>
            </div>

            <div className="modal-actions-bar">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !tokenInput.trim()}
              >
                {loading ? 'Verifying...' : 'Save & Unlock 5,000/hr'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .token-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .token-intro {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .token-configured-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
        }
        .conf-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .conf-left strong {
          display: block;
          font-size: 0.825rem;
          color: #ffffff;
        }
        .masked-val {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--emerald-400);
        }
        .token-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .btn-toggle-eye {
          position: absolute;
          right: 0.85rem;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          padding: 0.2rem;
        }
        .btn-toggle-eye:hover {
          color: #ffffff;
        }
        .token-help-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 0.75rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .gh-link {
          color: var(--cyan-400);
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }
        .gh-link:hover {
          text-decoration: underline;
        }
        .help-note {
          color: var(--text-dim);
          font-size: 0.72rem;
        }
      `}</style>
    </div>
  );
};
