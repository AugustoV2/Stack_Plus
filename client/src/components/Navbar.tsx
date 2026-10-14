import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { RateLimitStatus } from '../types/index.js';
import { Search, GitCompare, Bookmark, Save, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  }, []);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
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
              className="rate-limit-pill"
              title={`GitHub API Quota: ${rateLimit.remaining} of ${rateLimit.limit} remaining per hour.`}
            >
              <ShieldAlert size={14} style={{ color: limitColor }} />
              <span className="rate-num" style={{ color: limitColor }}>
                {rateLimit.remaining}/{rateLimit.limit}
              </span>
              <span className="rate-lbl">API left</span>
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

      <style>{`
        .logo-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: var(--radius-sm);
        }
        .logo-bolt {
          font-size: 1.1rem;
        }
        .rate-limit-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-family: var(--font-mono);
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
          gap: 0.5rem;
        }
        .user-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #c7d2fe;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
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
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        .btn-logout:hover {
          color: var(--rose-500);
          background: rgba(244, 63, 94, 0.1);
        }
        .btn-sm {
          padding: 0.45rem 1rem;
          font-size: 0.8rem;
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
