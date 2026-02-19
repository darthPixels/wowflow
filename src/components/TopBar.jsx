import { useState } from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import ColorThemeManager from './ColorThemeManager';
import AppSettings from './AppSettings';
import useWorkflowStore from '../store/workflowStore';

export default function TopBar({ onExport }) {
  const { workflowName, setWorkflowName, isDirty, user, logout } = useWorkflowStore();
  const [themesOpen, setThemesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="wf-topbar">
      <div className="wf-topbar__left">
        <Logo />
      </div>

      <div className="wf-topbar__center">
        <input
          className="wf-topbar__name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name..."
        />
        {isDirty && <span className="wf-topbar__dirty">Unsaved</span>}
      </div>

      <div className="wf-topbar__right">
        <button className="wf-btn wf-btn--ghost" onClick={() => setSettingsOpen(true)} title="App Settings">
          Settings
        </button>
        <button className="wf-btn wf-btn--ghost" onClick={() => setThemesOpen(true)} title="Color Themes">
          Themes
        </button>
        <button className="wf-btn wf-btn--ghost" onClick={onExport} title="Export as JSON">
          Export
        </button>
        <ThemeToggle />
        {user && (
          <div className="wf-topbar__user">
            <span className="wf-topbar__username">{user.username}</span>
            <button className="wf-btn wf-btn--ghost wf-btn--sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>

      <ColorThemeManager open={themesOpen} onClose={() => setThemesOpen(false)} />
      <AppSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
