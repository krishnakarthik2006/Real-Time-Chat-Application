import { useEffect, useRef } from "react";
import { formatInlinePreview, formatMessageTime } from "../utils/chat";

/**
 * Highlights occurrences of `term` inside `text` with a <mark> element.
 */
function Highlight({ text, term }) {
  if (!text) return null;
  if (!term) return <>{text}</>;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="search-highlight">{part}</mark>
          : part,
      )}
    </>
  );
}

export default function MessageSearchPanel({
  query, loading, results, onQueryChange, onSelectMessage, onClear,
}) {
  const inputRef = useRef(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key clears and focuses back
  function handleKeyDown(e) {
    if (e.key === "Escape") { onClear(); }
  }

  const trimmedQuery = query.trim();

  return (
    <section className="search-panel" aria-label="Search messages">
      <div className="search-panel__header">
        <h3>Search in conversation</h3>
        <div className="search-panel__summary">
          {trimmedQuery && !loading && (
            <span className="pill pill--accent">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          )}
          {trimmedQuery && (
            <button className="text-button text-button--muted" type="button" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="search"
        placeholder="Search messages, files…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search messages"
        autoFocus
      />

      {trimmedQuery && (
        <div className="search-panel__results" role="list">
          {loading && (
            <p className="helper-copy" style={{ padding: "10px 14px" }}>Searching…</p>
          )}
          {!loading && !results.length && (
            <p className="helper-copy" style={{ padding: "10px 14px" }}>
              No messages matched "{trimmedQuery}".
            </p>
          )}
          {results.map((msg) => {
            const preview = formatInlinePreview(msg);
            return (
              <button
                key={msg.id}
                className="search-hit"
                type="button"
                role="listitem"
                onClick={() => onSelectMessage(msg)}
                title={`Go to message from ${msg.sender.name}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong className="search-hit__sender">{msg.sender.name}</strong>
                  <p className="search-hit__preview">
                    <Highlight text={preview} term={trimmedQuery} />
                  </p>
                </div>
                <span className="search-hit__time">{formatMessageTime(msg.createdAt)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
