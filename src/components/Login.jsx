import { useState } from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const API_URL = '/api';

export default function Login({ onLogin, onSkip }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? 'register' : 'login';
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wf-login">
      <div className="wf-login__card">
        <div className="wf-login__header">
          <Logo size="large" />
          <p className="wf-login__subtitle">Workflow Visualization Tool</p>
        </div>

        <form className="wf-login__form" onSubmit={handleSubmit}>
          <div className="wf-properties__field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="wf-properties__field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <div className="wf-login__error">{error}</div>}

          <button
            type="submit"
            className="wf-btn wf-btn--primary wf-btn--full"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="wf-login__footer">
          <button
            className="wf-btn wf-btn--ghost"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Already have an account? Log in' : 'Need an account? Register'}
          </button>
          {onSkip && (
            <button
              className="wf-btn wf-btn--ghost"
              onClick={onSkip}
              style={{ marginTop: 4 }}
            >
              Continue without account
            </button>
          )}
        </div>

        <div className="wf-login__theme">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
