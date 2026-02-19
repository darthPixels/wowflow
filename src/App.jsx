import { useEffect } from 'react';
import Login from './components/Login';
import WorkflowEditor from './components/WorkflowEditor';
import useWorkflowStore from './store/workflowStore';
import { applyTheme } from './theme';
import './App.css';

export default function App() {
  const { token, theme, setToken, setUser } = useWorkflowStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => setUser(data.user))
        .catch(() => {
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const handleLogin = (newToken, user) => {
    setToken(newToken);
    setUser(user);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return <WorkflowEditor />;
}
