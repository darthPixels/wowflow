import useWorkflowStore from '../store/workflowStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useWorkflowStore();

  return (
    <button
      className="wf-theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
