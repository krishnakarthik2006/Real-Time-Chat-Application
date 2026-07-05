import { memo } from "react";

/**
 * Memoised — only re-renders when the users array reference changes,
 * which happens only when someone starts/stops typing.
 */
const TypingIndicator = memo(function TypingIndicator({ users }) {
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
});

export default TypingIndicator;
