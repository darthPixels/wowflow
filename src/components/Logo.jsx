export default function Logo({ size = 'default' }) {
  const s = size === 'large' ? 1.6 : 1;

  return (
    <div className="wf-logo" style={{ transform: `scale(${s})` }}>
      <svg
        width="32"
        height="24"
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="wf-logo__icon"
      >
        {/* Left node — rounded rectangle outline */}
        <rect x="1" y="4" width="10" height="8" rx="3" stroke="var(--accent-blue)" strokeWidth="1.8" fill="none" />
        {/* Right node — rounded rectangle outline */}
        <rect x="21" y="12" width="10" height="8" rx="3" stroke="var(--accent-purple)" strokeWidth="1.8" fill="none" />
        {/* Connector line with curve */}
        <path
          d="M11 8 C16 8, 16 16, 21 16"
          stroke="var(--accent-green)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Connector dots at junction points */}
        <circle cx="11" cy="8" r="2" fill="var(--accent-blue)" />
        <circle cx="21" cy="16" r="2" fill="var(--accent-purple)" />
      </svg>
      <span className="wf-logo__text">wowflow</span>
    </div>
  );
}
