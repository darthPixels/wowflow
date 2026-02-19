import { useState, useEffect } from 'react';
import { Icon, iconList } from '../icons';
import useWorkflowStore from '../store/workflowStore';
import {
  getAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  builtInThemes,
} from '../colorThemes';

const colorOptions = [
  'none', 'blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink', 'yellow', 'gray',
];

// All icon names that can appear in a theme mapping
const themeIcons = [
  ...iconList.map((i) => i.name),
  'start', 'end', 'decision', 'process',
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

const iconLabels = Object.fromEntries([
  ...iconList.map((i) => [i.name, i.label]),
  ['start', 'Start'],
  ['end', 'End'],
  ['decision', 'Decision'],
  ['process', 'Process'],
]);

export default function ColorThemeManager({ open, onClose }) {
  const [themes, setThemes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('list'); // 'list' | 'edit'
  const [editName, setEditName] = useState('');
  const [editMapping, setEditMapping] = useState({});
  const applyColorTheme = useWorkflowStore((s) => s.applyColorTheme);

  useEffect(() => {
    if (open) {
      setThemes(getAllThemes());
      setMode('list');
      setSelectedId(null);
    }
  }, [open]);

  if (!open) return null;

  const selectedTheme = themes.find((t) => t.id === selectedId);

  const handleApply = () => {
    if (selectedTheme) {
      applyColorTheme(selectedTheme.mapping);
      onClose();
    }
  };

  const handleNew = () => {
    const base = builtInThemes[0].mapping;
    setEditMapping({ ...base });
    setEditName('My Theme');
    setSelectedId(null);
    setMode('edit');
  };

  const handleEdit = (theme) => {
    setEditMapping({ ...theme.mapping });
    setEditName(theme.name);
    setSelectedId(theme.id);
    setMode('edit');
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    if (selectedId && !themes.find((t) => t.id === selectedId)?.builtIn) {
      updateTheme(selectedId, { name: editName, mapping: editMapping });
    } else {
      createTheme(editName, editMapping);
    }
    setThemes(getAllThemes());
    setMode('list');
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this theme?')) return;
    deleteTheme(id);
    setThemes(getAllThemes());
    if (selectedId === id) setSelectedId(null);
  };

  const setIconColor = (icon, field, value) => {
    setEditMapping((prev) => ({
      ...prev,
      [icon]: { ...prev[icon], [field]: value },
    }));
  };

  return (
    <div className="wf-theme-overlay" onClick={onClose}>
      <div className="wf-theme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wf-theme-modal__header">
          <span className="wf-theme-modal__title">
            {mode === 'list' ? 'Color Themes' : 'Edit Theme'}
          </span>
          <button className="wf-properties__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="wf-theme-modal__body wf-scrollable">
          {mode === 'list' && (
            <>
              <div className="wf-theme-list">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    className={`wf-theme-list__item ${selectedId === t.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <div>
                      <span className="wf-theme-list__name">{t.name}</span>
                      {t.builtIn && (
                        <span className="wf-theme-list__badge"> Built-in</span>
                      )}
                    </div>
                    <div className="wf-theme-list__actions">
                      {!t.builtIn && (
                        <>
                          <button
                            className="wf-btn wf-btn--ghost wf-btn--sm"
                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                          >
                            Edit
                          </button>
                          <button
                            className="wf-btn wf-btn--ghost wf-btn--sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview selected theme */}
              {selectedTheme && Object.keys(selectedTheme.mapping).length > 0 && (
                <div className="wf-theme-preview">
                  <div className="wf-theme-preview__title">Preview</div>
                  <div className="wf-theme-preview__grid">
                    {Object.entries(selectedTheme.mapping).map(([icon, colors]) => (
                      <div key={icon} className="wf-theme-preview__item">
                        <span
                          className="wf-theme-preview__swatch"
                          style={{ backgroundColor: colors.outlineColor !== 'none' ? `var(--accent-${colors.outlineColor})` : 'var(--text-tertiary)' }}
                        />
                        <Icon name={icon} size={14} />
                        <span className="wf-theme-preview__label">{iconLabels[icon] || icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'edit' && (
            <>
              <div className="wf-properties__field" style={{ marginBottom: 16 }}>
                <label>Theme Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="wf-theme-editor__grid">
                <div className="wf-theme-editor__head">Icon</div>
                <div className="wf-theme-editor__head">Name</div>
                <div className="wf-theme-editor__head">Outline</div>
                <div className="wf-theme-editor__head">Fill</div>

                {themeIcons.map((icon) => {
                  const colors = editMapping[icon] || { outlineColor: 'none', fillColor: 'none' };
                  return (
                    <div key={icon} className="wf-theme-editor__row">
                      <div className="wf-theme-editor__icon">
                        <Icon name={icon} size={16} />
                      </div>
                      <div className="wf-theme-editor__label">
                        {iconLabels[icon] || icon}
                      </div>
                      <div className="wf-theme-editor__colors">
                        {colorOptions.map((c) => (
                          <button
                            key={c}
                            className={`wf-theme-editor__color-btn ${colors.outlineColor === c ? 'active' : ''}`}
                            style={c === 'none' ? {} : { backgroundColor: `var(--accent-${c})` }}
                            onClick={() => setIconColor(icon, 'outlineColor', c)}
                            title={c}
                          >
                            {c === 'none' && '∅'}
                          </button>
                        ))}
                      </div>
                      <div className="wf-theme-editor__colors">
                        {colorOptions.map((c) => (
                          <button
                            key={c}
                            className={`wf-theme-editor__color-btn ${colors.fillColor === c ? 'active' : ''}`}
                            style={c === 'none' ? {} : { backgroundColor: `var(--accent-${c})` }}
                            onClick={() => setIconColor(icon, 'fillColor', c)}
                            title={c}
                          >
                            {c === 'none' && '∅'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="wf-theme-modal__footer">
          {mode === 'list' && (
            <>
              <button className="wf-btn wf-btn--ghost" onClick={handleNew}>
                + New Theme
              </button>
              <button
                className="wf-btn wf-btn--primary"
                onClick={handleApply}
                disabled={!selectedId}
              >
                Apply Theme
              </button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <button className="wf-btn wf-btn--ghost" onClick={() => setMode('list')}>
                Cancel
              </button>
              <button className="wf-btn wf-btn--primary" onClick={handleSaveEdit}>
                Save Theme
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
