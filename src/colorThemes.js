const STORAGE_KEY = 'wowflow_color_themes';

// BPMN Industry Standard — maps icon names to outline/fill colors
export const builtInThemes = [
  {
    id: 'industry-standard',
    name: 'BPMN Industry Standard',
    builtIn: true,
    mapping: {
      // Activities / Business
      process:  { outlineColor: 'blue',   fillColor: 'none' },
      business: { outlineColor: 'blue',   fillColor: 'none' },
      po:       { outlineColor: 'blue',   fillColor: 'none' },
      link:     { outlineColor: 'blue',   fillColor: 'none' },
      // People / Communication
      user:     { outlineColor: 'teal',   fillColor: 'none' },
      users:    { outlineColor: 'teal',   fillColor: 'none' },
      email:    { outlineColor: 'teal',   fillColor: 'none' },
      // Technical
      it:       { outlineColor: 'purple', fillColor: 'none' },
      database: { outlineColor: 'purple', fillColor: 'none' },
      settings: { outlineColor: 'purple', fillColor: 'none' },
      // Data / Start events
      form:     { outlineColor: 'green',  fillColor: 'none' },
      start:    { outlineColor: 'green',  fillColor: 'none' },
      // Creative / Transitions
      design:   { outlineColor: 'pink',   fillColor: 'none' },
      handoff:  { outlineColor: 'pink',   fillColor: 'none' },
      // Gateways / Milestones
      approval: { outlineColor: 'orange', fillColor: 'none' },
      decision: { outlineColor: 'orange', fillColor: 'none' },
      flag:     { outlineColor: 'orange', fillColor: 'none' },
      // Negative / End events
      reject:   { outlineColor: 'red',    fillColor: 'none' },
      end:      { outlineColor: 'red',    fillColor: 'none' },
      // Artifacts / Timing
      document: { outlineColor: 'gray',   fillColor: 'none' },
      clock:    { outlineColor: 'gray',   fillColor: 'none' },
      // Annotations / Priority
      note:     { outlineColor: 'yellow', fillColor: 'none' },
      star:     { outlineColor: 'yellow', fillColor: 'none' },
    },
  },
  {
    id: 'no-color',
    name: 'No Color (Reset)',
    builtIn: true,
    mapping: {},
  },
];

export function loadCustomThemes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function getAllThemes() {
  return [...builtInThemes, ...loadCustomThemes()];
}

export function createTheme(name, mapping = {}) {
  const customs = loadCustomThemes();
  const newTheme = {
    id: `custom-${Date.now()}`,
    name,
    builtIn: false,
    mapping: { ...mapping },
  };
  customs.push(newTheme);
  saveCustomThemes(customs);
  return newTheme;
}

export function updateTheme(id, updates) {
  const customs = loadCustomThemes();
  const idx = customs.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  customs[idx] = { ...customs[idx], ...updates };
  saveCustomThemes(customs);
  return customs[idx];
}

export function deleteTheme(id) {
  const customs = loadCustomThemes().filter((t) => t.id !== id);
  saveCustomThemes(customs);
}
