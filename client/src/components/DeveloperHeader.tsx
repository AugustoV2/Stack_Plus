import React, { useState } from 'react';
import { Developer } from '../types/index.js';
import {
  Users,
  FolderGit2,
  Star,
  RefreshCw,
  GitCompare,
  MapPin,
  Building,
  Link as LinkIcon,
  Zap,
} from 'lucide-react';

interface Props {
  developer: Developer;
  fromCache?: boolean;
  onRefresh: () => Promise<void>;
  onAddToCompare: (username: string) => void;
}

export const DeveloperHeader: React.FC<Props> = ({
  developer,
  fromCache = false,
  onRefresh,
  onAddToCompare,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchedTime = new Date(developer.fetched_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="developer-profile-header glass-panel animate-slide-in">
      <div className="header-main-row">
        {/* Avatar */}
        <div className="dev-avatar-wrap">
          <img
            src={developer.avatar_url}
            alt={developer.github_username}
            className="dev-avatar"
          />
          <span className="live-status-dot" title="Profile loaded from GitHub" />
        </div>

        {/* Info */}
        <div className="dev-info-col">
          <div className="dev-name-row">
            <div>
              <h1 className="dev-full-name">{developer.name || developer.github_username}</h1>
              <a
                href={`https://github.com/${developer.github_username}`}
                target="_blank"
                rel="noreferrer"
                className="dev-gh-handle"
              >
                @{developer.github_username} ↗
              </a>
            </div>

            {/* Actions */}
            <div className="dev-header-actions">
              <button
                className="btn-secondary btn-sm"
                onClick={handleRefreshClick}
                disabled={refreshing}
                title="Force re-fetch latest data from GitHub API"
              >
                <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Sync GitHub'}</span>
              </button>

              <button
                className="btn-primary btn-sm"
                onClick={() => onAddToCompare(developer.github_username)}
                title="Compare this developer head-to-head"
              >
                <GitCompare size={14} />
                <span>Compare</span>
              </button>
            </div>
          </div>

          {/* Bio */}
          {developer.bio && <p className="dev-bio">{developer.bio}</p>}

          {/* Meta Links */}
          <div className="dev-meta-links">
            {developer.company && (
              <span className="meta-item">
                <Building size={14} /> {developer.company}
              </span>
            )}
            {developer.location && (
              <span className="meta-item">
                <MapPin size={14} /> {developer.location}
              </span>
            )}
            {developer.blog && (
              <a
                href={developer.blog.startsWith('http') ? developer.blog : `https://${developer.blog}`}
                target="_blank"
                rel="noreferrer"
                className="meta-item meta-link"
              >
                <LinkIcon size={14} /> {developer.blog.replace(/^https?:\/\//, '')}
              </a>
            )}
            {developer.twitter_username && (
              <a
                href={`https://twitter.com/${developer.twitter_username}`}
                target="_blank"
                rel="noreferrer"
                className="meta-item meta-link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> @{developer.twitter_username}
              </a>
            )}
            <span className="meta-item cache-indicator">
              <Zap size={14} style={{ color: fromCache ? 'var(--amber-400)' : 'var(--cyan-400)' }} />
              {fromCache ? `Cached (${fetchedTime})` : 'Live Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="header-metrics-strip">
        <div className="metric-box">
          <div className="m-icon-wrap stars-icon">
            <Star size={18} />
          </div>
          <div className="m-text">
            <span className="m-val">{developer.total_stars.toLocaleString()}</span>
            <span className="m-lbl">Total Stars</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="m-icon-wrap repos-icon">
            <FolderGit2 size={18} />
          </div>
          <div className="m-text">
            <span className="m-val">{developer.public_repos.toLocaleString()}</span>
            <span className="m-lbl">Public Repos</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="m-icon-wrap followers-icon">
            <Users size={18} />
          </div>
          <div className="m-text">
            <span className="m-val">{developer.followers.toLocaleString()}</span>
            <span className="m-lbl">Followers</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="m-icon-wrap following-icon">
            <Users size={18} />
          </div>
          <div className="m-text">
            <span className="m-val">{developer.following.toLocaleString()}</span>
            <span className="m-lbl">Following</span>
          </div>
        </div>
      </div>

      <style>{`
        .developer-profile-header {
          padding: 2.25rem;
          margin-bottom: 2rem;
        }
        .header-main-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 768px) {
          .header-main-row {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .dev-header-actions {
            justify-content: center;
          }
          .dev-meta-links {
            justify-content: center;
          }
        }
        .dev-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .dev-avatar {
          width: 108px;
          height: 108px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          object-fit: cover;
        }
        .live-status-dot {
          position: absolute;
          bottom: -3px;
          right: -3px;
          width: 14px;
          height: 14px;
          background: var(--proto-green);
          border: 2px solid #ffffff;
          border-radius: 50%;
        }
        .dev-info-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .dev-name-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dev-full-name {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--proto-black);
        }
        .dev-gh-handle {
          font-size: 0.95rem;
          color: rgba(30, 30, 27, 0.6);
          font-family: var(--font-mono);
          font-weight: 500;
        }
        .dev-gh-handle:hover {
          color: var(--proto-black);
          text-decoration: underline;
        }
        .dev-header-actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .dev-bio {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 750px;
        }
        .dev-meta-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.25rem;
          margin-top: 0.25rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          color: var(--text-muted);
        }
        .meta-link:hover {
          color: var(--proto-black);
          text-decoration: underline;
        }
        .cache-indicator {
          background: #efe9df;
          color: var(--text-muted);
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
        .header-metrics-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          padding-top: 1.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .metric-box {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 0.95rem 1.25rem;
          border-radius: 12px;
        }
        .m-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
        }
        .stars-icon {
          background: rgba(180, 83, 9, 0.1);
          color: var(--proto-amber);
        }
        .repos-icon {
          background: #e5e8f1;
          color: var(--proto-indigo);
        }
        .followers-icon {
          background: rgba(38, 81, 54, 0.1);
          color: var(--proto-green);
        }
        .following-icon {
          background: #efe9df;
          color: var(--proto-black);
        }
        .m-text {
          display: flex;
          flex-direction: column;
        }
        .m-val {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--proto-black);
          font-family: var(--font-mono);
        }
        .m-lbl {
          font-size: 0.72rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
