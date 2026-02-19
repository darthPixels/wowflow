import { useState, useEffect } from 'react';
import useWorkflowStore from '../store/workflowStore';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#0a84ff' },
  { name: 'Green', value: '#30d158' },
  { name: 'Orange', value: '#ff9f0a' },
  { name: 'Red', value: '#ff453a' },
  { name: 'Purple', value: '#bf5af2' },
  { name: 'Teal', value: '#64d2ff' },
  { name: 'Pink', value: '#ff375f' },
  { name: 'Yellow', value: '#ffd60a' },
];

const FONTS = [
  { name: 'Inter', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { name: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { name: 'Quicksand', value: "'Quicksand', sans-serif" },
  { name: 'Roboto Mono', value: "'Roboto Mono', monospace" },
  { name: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
];

const SIZES = [
  { name: 'Small', value: '0.85' },
  { name: 'Medium', value: '1' },
  { name: 'Large', value: '1.15' },
];

const STORAGE_KEY = 'wowflow_app_settings';

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applySettings(settings) {
  const root = document.documentElement;
  if (settings.accentColor) {
    root.style.setProperty('--accent-blue', settings.accentColor);
    root.style.setProperty('--border-focus', settings.accentColor);
    root.style.setProperty('--edge-selected', settings.accentColor);
  }
  if (settings.fontFamily) {
    root.style.setProperty('--app-font', settings.fontFamily);
  }
  if (settings.uiScale) {
    root.style.zoom = settings.uiScale;
  }
}

// Apply on load
applySettings(loadSettings());

export default function AppSettings({ open, onClose }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  if (!open) return null;

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="wf-theme-overlay" onClick={onClose}>
      <div className="wf-theme-modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="wf-theme-modal__header">
          <div className="wf-theme-modal__title">App Settings</div>
          <button className="wf-btn wf-btn--ghost" onClick={onClose}>✕</button>
        </div>

        <div className="wf-theme-modal__body wf-scrollable">
          {/* Accent Color */}
          <div className="wf-settings__section">
            <div className="wf-settings__label">Primary Color</div>
            <div className="wf-settings__colors">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`wf-settings__color-btn ${settings.accentColor === c.value ? 'wf-settings__color-btn--active' : ''}`}
                  style={{ background: c.value }}
                  onClick={() => update('accentColor', c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="wf-settings__section">
            <div className="wf-settings__label">Font</div>
            <div className="wf-settings__options">
              {FONTS.map((f) => (
                <button
                  key={f.name}
                  className={`wf-settings__option ${settings.fontFamily === f.value ? 'wf-settings__option--active' : ''}`}
                  style={{ fontFamily: f.value }}
                  onClick={() => update('fontFamily', f.value)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="wf-settings__section">
            <div className="wf-settings__label">UI Scale</div>
            <div className="wf-settings__options">
              {SIZES.map((s) => (
                <button
                  key={s.name}
                  className={`wf-settings__option ${settings.uiScale === s.value ? 'wf-settings__option--active' : ''}`}
                  onClick={() => update('uiScale', s.value)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="wf-settings__section">
            <button
              className="wf-btn wf-btn--ghost"
              onClick={() => {
                const root = document.documentElement;
                root.style.removeProperty('--accent-blue');
                root.style.removeProperty('--border-focus');
                root.style.removeProperty('--edge-selected');
                root.style.removeProperty('--app-font');
                root.style.zoom = '';
                setSettings({});
                localStorage.removeItem(STORAGE_KEY);
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
