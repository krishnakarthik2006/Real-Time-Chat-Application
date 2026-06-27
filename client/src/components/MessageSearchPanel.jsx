import { formatInlinePreview, formatMessageTime } from "../utils/chat";

export default function MessageSearchPanel({ query, loading, results, onQueryChange, onSelectMessage, onClear }) {
  return (
    <section className="search-panel">
      <div className="search-panel__header">
        <h3>Search in conversation</h3>
        <div className="search-panel__summary">
          {query && !loading && (
            <span className="pill pill--accent">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          )}
          {query && (
            <button className="text-button text-button--muted" type="button" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <input
        type="search"
        placeholder="Search messages, files…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        autoFocus
      />

      {query && (
        <div className="search-panel__results">
          {loading && <p className="helper-copy">Searching…</p>}
          {!loading && !results.length && <p className="helper-copy">No messages matched that search.</p>}
          {results.map((msg) => (
            <button
              key={msg.id}
              className="search-hit"
              type="button"
              onClick={() => onSelectMessage(msg)}
            >
              <div>
                <strong>{msg.sender.name}</strong>
                <p>{formatInlinePreview(msg)}</p>
              </div>
              <span>{formatMessageTime(msg.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
