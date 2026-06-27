import { useState, useCallback, useRef, useEffect } from "react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export default function MessageReactions({ message, currentUserId, onAddReaction, onRemoveReaction }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const reactions = message.reactions || [];

  // Group reactions by emoji
  const grouped = EMOJIS.reduce((acc, emoji) => {
    const items = reactions.filter((r) => r.emoji === emoji);
    if (items.length) acc.push({ emoji, count: items.length, users: items.map((r) => r.userName) });
    return acc;
  }, []);

  const userReacted = useCallback(
    (emoji) => reactions.some((r) => r.emoji === emoji && r.userId === currentUserId),
    [reactions, currentUserId],
  );

  const handleToggle = useCallback(
    (emoji) => {
      if (userReacted(emoji)) {
        onRemoveReaction?.(message.id, emoji);
      } else {
        onAddReaction?.(message.id, emoji);
      }
    },
    [message.id, onAddReaction, onRemoveReaction, userReacted],
  );

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  return (
    <div className="message-reactions" style={{ position: "relative" }}>
      {grouped.length > 0 && (
        <div className="reactions-list">
          {grouped.map(({ emoji, count, users }) => (
            <button
              key={emoji}
              className={`reaction-item ${userReacted(emoji) ? "user-reacted" : ""}`}
              onClick={() => handleToggle(emoji)}
              title={users.slice(0, 5).join(", ")}
              type="button"
            >
              <span className="reaction-emoji">{emoji}</span>
              <span className="reaction-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      <button
        className="reaction-add-btn"
        onClick={() => setShowPicker((p) => !p)}
        type="button"
        title="Add reaction"
        aria-label="Add reaction"
      >
        😊
      </button>

      {showPicker && (
        <div className="reaction-picker" ref={pickerRef}>
          <div className="reaction-picker-emojis">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-picker-emoji"
                onClick={() => { handleToggle(emoji); setShowPicker(false); }}
                type="button"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
