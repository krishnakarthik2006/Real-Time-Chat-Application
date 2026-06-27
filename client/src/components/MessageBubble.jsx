import { useState } from "react";
import { Reply, Pencil, Trash2, Copy, Check } from "lucide-react";
import { formatFileSize, formatInlinePreview, formatMessageTime } from "../utils/chat";
import MessageReactions from "./MessageReactions";

const STATUS_ICONS = {
  sent: (
    <svg className="message-status__checks" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5L6 11.5L11 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  ),
  delivered: (
    <svg className="message-status__checks" viewBox="0 0 18 14" aria-hidden="true">
      <path d="M1 7L5 11L11 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6 7L10 11L16 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  ),
  seen: (
    <svg className="message-status__checks" viewBox="0 0 18 14" aria-hidden="true" style={{ color: "#fff" }}>
      <path d="M1 7L5 11L11 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6 7L10 11L16 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  ),
};

function getFileIcon(mimeType = "") {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("text")) return "📄";
  return "📎";
}

export default function MessageBubble({
  message, isOwnMessage, isHighlighted, isEditing, editingContent, showSender,
  isNewGroup,
  onEditContentChange, onStartReply, onStartEdit, onCancelEdit, onSaveEdit, onDelete,
  onAddReaction, onRemoveReaction, currentUserId,
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = message.content || formatInlinePreview(message);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard unavailable */ }
  }

  const bubbleCls = [
    "message-bubble",
    isOwnMessage ? "message-bubble--own" : "",
    isHighlighted ? "message-bubble--highlighted" : "",
  ].filter(Boolean).join(" ");

  return (
    <article
      id={`message-${message.id}`}
      className={bubbleCls}
      style={isNewGroup ? { marginTop: 10 } : undefined}
    >
      <div className="message-bubble__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isOwnMessage && showSender && (
            <p className="message-author">{message.sender.name}</p>
          )}
          {message.replyTo && (
            <div className="quoted-message">
              <strong>{message.replyTo.sender?.name || "Unknown"}</strong>
              <span>{formatInlinePreview(message.replyTo)}</span>
            </div>
          )}
        </div>

        {!message.isDeleted && (
          <div className="message-actions" role="toolbar" aria-label="Message actions">
            <button className="msg-action-btn" type="button" onClick={handleCopy} title={copied ? "Copied" : "Copy"}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button className="msg-action-btn" type="button" onClick={() => onStartReply(message)} title="Reply">
              <Reply size={13} />
            </button>
            {isOwnMessage && (
              <>
                <button className="msg-action-btn" type="button" onClick={() => onStartEdit(message)} title="Edit">
                  <Pencil size={13} />
                </button>
                <button className="msg-action-btn msg-action-btn--danger" type="button" onClick={() => onDelete(message)} title="Delete">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="message-body">
        {message.isDeleted ? (
          <p className="message-copy message-copy--muted">This message was deleted.</p>
        ) : (
          <>
            {message.attachment && (
              <a
                className="file-card"
                href={message.attachment.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="file-card__icon">{getFileIcon(message.attachment.mimeType)}</span>
                <div className="file-card__info">
                  <div className="file-card__name">{message.attachment.name}</div>
                  <div className="file-card__meta">
                    {message.attachment.mimeType || "File"} · {formatFileSize(message.attachment.size)}
                  </div>
                </div>
              </a>
            )}

            {isEditing ? (
              <div className="edit-message-box">
                <input
                  type="text"
                  value={editingContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  autoFocus
                />
                <div className="edit-message-box__actions">
                  <button className="secondary-button" style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} type="button" onClick={onCancelEdit}>
                    Cancel
                  </button>
                  <button className="primary-button" style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} type="button" onClick={onSaveEdit}>
                    Save
                  </button>
                </div>
              </div>
            ) : message.content ? (
              <p className="message-copy">{message.content}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="message-meta">
        <span>
          {formatMessageTime(message.createdAt)}
          {message.editedAt ? " · edited" : ""}
        </span>
        {isOwnMessage && (
          <span className={`message-status ${message.status === "seen" ? "message-status--seen" : ""}`} title={message.status}>
            {STATUS_ICONS[message.status] || STATUS_ICONS.sent}
          </span>
        )}
      </div>

      {!message.isDeleted && (
        <MessageReactions
          message={message}
          currentUserId={currentUserId}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />
      )}
    </article>
  );
}
