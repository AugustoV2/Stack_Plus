import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { SearchPage } from './pages/SearchPage.js';
import { ComparePage } from './pages/ComparePage.js';
import { PinnedPage } from './pages/PinnedPage.js';
import { SavedComparisonsPage } from './pages/SavedComparisonsPage.js';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('search');
  const [activeUsername, setActiveUsername] = useState<string>('');
  const [compareUsernames, setCompareUsernames] = useState<string[]>(['gaearon', 'yyx990803']);

  const handleNavigateToCompareWith = (username: string) => {
    if (!compareUsernames.includes(username)) {
      setCompareUsernames([username, ...compareUsernames.filter((u) => u !== username)]);
    }
    setCurrentTab('compare');
  };

  const handleInspectDeveloper = (username: string) => {
    setActiveUsername(username);
    setCurrentTab('search');
  };

  const handleLoadSavedComparison = (usernames: string[]) => {
    setCompareUsernames(usernames);
    setCurrentTab('compare');
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'search' && (
          <SearchPage
            initialUsername={activeUsername}
            onNavigateToCompareWith={handleNavigateToCompareWith}
          />
        )}

        {currentTab === 'compare' && (
          <ComparePage
            initialUsernames={compareUsernames}
            onInspectDeveloper={handleInspectDeveloper}
          />
        )}

        {currentTab === 'pinned' && (
          <PinnedPage
            onInspectDeveloper={handleInspectDeveloper}
            onNavigateToSearch={() => setCurrentTab('search')}
          />
        )}

        {currentTab === 'saved' && (
          <SavedComparisonsPage
            onLoadComparison={handleLoadSavedComparison}
            onNavigateToCompare={() => setCurrentTab('compare')}
          />
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-logo">⚡ StackPulse</span>
            <span className="footer-copy">
              Developer Intelligence & Head-to-Head Comparison Platform
            </span>
          </div>

          <div className="footer-badges">
            <span className="badge badge-cyan">React 19</span>
            <span className="badge badge-indigo">TypeScript</span>
            <span className="badge badge-emerald">PostgreSQL</span>
            <span className="badge badge-amber">GitHub REST API</span>
          </div>
        </div>
      </footer>

      <style>{`
        .app-footer {
          border-top: 1px solid var(--border-subtle);
          background: rgba(9, 13, 22, 0.9);
          padding: 1.5rem 1.5rem;
          margin-top: 3rem;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .footer-logo {
          font-weight: 800;
          color: #ffffff;
          font-size: 0.95rem;
        }
        .footer-copy {
          font-size: 0.8rem;
          color: var(--text-dim);
        }
        .footer-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
