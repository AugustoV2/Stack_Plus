import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { RateLimitStatus } from '../types/index.js';
import { Search, GitCompare, Bookmark, Save, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { GithubTokenModal } from './GithubTokenModal.js';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  useEffect(() => {
    async function fetchRateLimit() {
      try {
        const data = await api.getRateLimit();
        setRateLimit(data);
      } catch (err) {
        // quiet error
      }
    }
    fetchRateLimit();
    const interval = setInterval(fetchRateLimit, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const handleRateLimitClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setIsTokenModalOpen(true);
  };

  // Compute rate limit color badge
  const remaining = rateLimit?.remaining ?? 60;
  const limitColor =
    remaining > 25
      ? 'var(--emerald-400)'
      : remaining > 10
        ? 'var(--amber-400)'
        : 'var(--rose-500)';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <div
          className="nav-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNav('search')}
        >
          <div className="logo-icon-wrap">
            <span className="pulse-dot" />
            <span className="logo-bolt">⚡</span>
          </div>
          <span>StackPulse</span>
        </div>

        {/* Mobile toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Nav Links */}
        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button
            className={`nav-link ${currentTab === 'search' || currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNav('search')}
          >
            <Search size={16} />
            <span>Search & Profile</span>
          </button>

          <button
            className={`nav-link ${currentTab === 'compare' ? 'active' : ''}`}
            onClick={() => handleNav('compare')}
          >
            <GitCompare size={16} />
            <span>Compare</span>
          </button>

          <button
            className={`nav-link ${currentTab === 'pinned' ? 'active' : ''}`}
            onClick={() => {
              if (!user) {
                openAuthModal();
              } else {
                handleNav('pinned');
              }
            }}
          >
            <Bookmark size={16} />
            <span>Pinned Repos</span>
          </button>

          <button
            className={`nav-link ${currentTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              if (!user) {
                openAuthModal();
              } else {
                handleNav('saved');
              }
            }}
          >
            <Save size={16} />
            <span>Saved Comparisons</span>
          </button>
        </nav>

        {/* Right side actions */}
        <div className="nav-actions">
          {/* Rate limit status pill */}
          {rateLimit && (
            <div
              className={`rate-limit-pill ${rateLimit.remaining === 0 ? 'rate-limit-expired' : ''}`}
              onClick={handleRateLimitClick}
              title={
                user
                  ? 'Click to manage your account GitHub Personal Access Token'
                  : 'Unauthenticated limit (60/hr). Sign in to add your GitHub token for 5,000/hr.'
              }
            >
              <ShieldAlert size={14} style={{ color: limitColor }} />
              <span className="rate-num" style={{ color: limitColor }}>
                {rateLimit.remaining}/{rateLimit.limit}
              </span>
              <span className="rate-lbl">API left</span>
              <span className="token-key-badge" title="Manage GitHub Token">🔑</span>
            </div>
          )}

          {/* User auth state */}
          {user ? (
            <div className="user-profile-menu">
              <div className="user-badge" title={user.email}>
                <User size={14} />
                <span className="user-email-text">{user.email.split('@')[0]}</span>
              </div>
              <button
                className="btn-logout"
                onClick={logout}
                title="Sign out of your session"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-primary btn-sm" onClick={openAuthModal}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* GitHub Personal Access Token Modal */}
      <GithubTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdated={async () => {
          const data = await api.getRateLimit().catch(() => null);
          if (data) setRateLimit(data);
        }}
      />

      <style>{`
        .logo-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #1e1e1b;
          border-radius: 6px;
          color: #ffffff;
        }
        .logo-bolt {
          font-size: 0.95rem;
        }
        .rate-limit-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .rate-limit-pill:hover {
          background: #efe9df;
          border-color: rgba(0, 0, 0, 0.2);
          transform: translateY(-1px);
        }
        .rate-limit-expired {
          border-color: rgba(190, 18, 60, 0.5);
          background: rgba(190, 18, 60, 0.08);
        }
        .token-key-badge {
          font-size: 0.75rem;
          margin-left: 0.15rem;
        }
        .rate-num {
          font-weight: 700;
        }
        .rate-lbl {
          color: var(--text-dim);
          font-family: var(--font-sans);
          font-size: 0.7rem;
        }
        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .user-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: var(--text-main);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          max-width: 140px;
        }
        .user-email-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          color: var(--text-muted);
          border-radius: 6px;
          transition: all var(--transition-fast);
        }
        .btn-logout:hover {
          color: var(--proto-rose);
          background: rgba(190, 18, 60, 0.08);
        }
        .btn-sm {
          padding: 0.45rem 1.15rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-radius: 6px;
        }
        @media (max-width: 640px) {
          .rate-lbl {
            display: none;
          }
          .user-badge {
            max-width: 100px;
          }
        }
      `}</style>
    </header>
  );
};
