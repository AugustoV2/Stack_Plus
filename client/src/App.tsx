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



      <style>{`
        .app-footer {
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: #efe9df;
          padding: 2.5rem 1.5rem;
          margin-top: 4rem;
        }
        .footer-inner {
          max-width: 1260px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .footer-logo {
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--proto-black);
          font-size: 0.95rem;
        }
        .footer-copy {
          font-size: 0.8rem;
          color: rgba(30, 30, 27, 0.55);
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
