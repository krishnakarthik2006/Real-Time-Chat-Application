export default function TypingIndicator({ users }) {
  if (!users || !users.length) return null;

  const label =
    users.length === 1
      ? `${users[0].userName} is typing`
      : `${users.length} people are typing`;

  return (
    <div className="typing-indicator" aria-live="polite" aria-label={label}>
      <div className="typing-indicator__dots" aria-hidden="true">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
      <span>{label}</span>
    </div>
  );
}
