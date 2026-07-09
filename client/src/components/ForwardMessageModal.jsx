import { useState, useDeferredValue } from "react";
import { X, Search, Send } from "lucide-react";
import Avatar from "./Avatar";
import { getConversationTitle, formatInlinePreview } from "../utils/chat";

export default function ForwardMessageModal({ message, conversations, currentUser, onForward, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const deferred = useDeferredValue(query);

  if (!message) return null;

  const filtered = conversations.filter((c) => {
    if (!deferred.trim()) return true;
    const title = getConversationTitle(c, currentUser).toLowerCase();
    return title.includes(deferred.trim().toLowerCase());
  });

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    if (!selectedIds.length || sending) return;
    setSending(true);
    await onForward(message, selectedIds);
    setSending(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Forward message">
        <div className="modal-header">
          <div>
            <h2>Forward message</h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-ink-3)", marginTop: 2 }}>
              Choose one or more conversations
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Preview of message being forwarded */}
        <div className="forward-preview">
          <span className="forward-preview__label">Forwarding</span>
          <p className="forward-preview__text">{formatInlinePreview(message)}</p>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 22px 0" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--clr-ink-3)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder="Search conversations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 32, height: 36 }}
              autoFocus
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="forward-list">
          {filtered.length === 0 && (
            <p style={{ padding: "16px 22px", fontSize: "var(--text-sm)", color: "var(--clr-ink-3)" }}>
              No conversations found.
            </p>
          )}
          {filtered.map((c) => {
            const title = getConversationTitle(c, currentUser);
            const partner = c.type === "direct"
              ? c.participants.find((p) => p.id !== currentUser.id)
              : null;
            const checked = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`forward-list-item${checked ? " forward-list-item--selected" : ""}`}
                onClick={() => toggle(c.id)}
              >
                <Avatar name={title} seed={c.type === "group" ? c.name : partner?.avatarSeed} size="small" />
                <span className="forward-list-item__name">{title}</span>
                <span className={`forward-check${checked ? " forward-check--on" : ""}`} aria-hidden="true">
                  {checked ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button
            className="primary-button"
            type="button"
            disabled={!selectedIds.length || sending}
            onClick={handleSend}
          >
            <Send size={14} />
            {sending ? "Sending…" : `Forward${selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
