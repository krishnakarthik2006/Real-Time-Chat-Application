import { formatInlinePreview, formatMessageTime } from "../utils/chat";

export default function MessageSearchPanel({
  query,
  loading,
  results,
  onQueryChange,
  onSelectMessage,
  onClear,
}) {
  return (
    <section className="search-panel">
      <div className="search-panel__header">
        <div>
          <p className="eyebrow">Search</p>
          <h3>Find something in this chat</h3>
        </div>
        <div className="search-panel__summary">
          {query && !loading ? <span className="pill">{results.length} matches</span> : null}
          {query ? (
            <button className="text-button" type="button" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <input
        type="search"
        placeholder="Search text, replies, or file names"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      {query ? (
        <div className="search-panel__results">
          {loading ? <p className="helper-copy">Searching messages...</p> : null}
          {!loading && !results.length ? (
            <p className="helper-copy">No matching messages were found.</p>
          ) : null}

          {results.map((message) => (
            <button
              key={message.id}
              className="search-hit"
              type="button"
              onClick={() => onSelectMessage(message)}
            >
              <div>
                <strong>{message.sender.name}</strong>
                <p>{formatInlinePreview(message)}</p>
              </div>
              <span>{formatMessageTime(message.createdAt)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
