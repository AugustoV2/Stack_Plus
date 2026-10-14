import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { X, Lock, Mail, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password or PIN.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        showToast('Welcome back! Logged in successfully.', 'success');
      } else {
        await register(email.trim(), password);
        showToast('Account created! You are now logged in.', 'success');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Try to login demo account, if doesn't exist register it
      try {
        await login('demo@stackpulse.dev', 'stackpulse123');
      } catch (e) {
        await register('demo@stackpulse.dev', 'stackpulse123');
      }
      showToast('Logged in with Demo Account!', 'success');
    } catch (err: any) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div className="modal-container glass-panel animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <span className="modal-icon">🔐</span>
            <h3>{mode === 'login' ? 'Sign In to StackPulse' : 'Create Free Account'}</h3>
          </div>
          <button className="modal-close-btn" onClick={closeAuthModal}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="tab-switch">
          <button
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrap">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password or PIN</label>
            <div className="input-wrap">
              <Lock size={16} className="field-icon" />
              <input
                type="password"
                placeholder="Enter password or numeric PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="btn-secondary demo-login-btn"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          <Sparkles size={16} style={{ color: 'var(--amber-400)' }} />
          <span>Quick 1-Click Demo Account (Evaluator)</span>
        </button>

        <div className="privacy-badge">
          🛡️ Your data, pins, and saved comparisons are strictly private to your session.
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(30, 30, 27, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-container {
          width: 100%;
          max-width: 440px;
          padding: 2.25rem;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.12);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .header-title h3 {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text-main);
        }
        .modal-close-btn {
          color: var(--text-muted);
          padding: 0.35rem;
          border-radius: var(--radius-sm);
        }
        .modal-close-btn:hover {
          color: var(--text-main);
          background: #f7f3ec;
        }
        .tab-switch {
          display: flex;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }
        .tab-btn {
          flex: 1;
          padding: 0.55rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        .tab-btn.active {
          color: #ffffff;
          background: #1e1e1b;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }
        .auth-error-banner {
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: #be123c;
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.825rem;
          margin-bottom: 1rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .input-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: #f7f3ec;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .input-wrap:focus-within {
          border-color: #1e1e1b;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(30, 30, 27, 0.08);
        }
        .field-icon {
          color: var(--text-muted);
        }
        .input-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.875rem;
        }
        .input-hint {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .auth-submit-btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.75rem;
        }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.25rem 0 1rem;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .divider span {
          padding: 0 0.75rem;
        }
        .demo-login-btn {
          width: 100%;
          padding: 0.7rem;
        }
        .privacy-badge {
          margin-top: 1.25rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};
