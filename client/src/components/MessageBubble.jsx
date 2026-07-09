import { memo, useState } from "react";
import { Reply, Pencil, Trash2, Copy, Check, Forward, Star, Pin } from "lucide-react";
import { formatFileSize, formatInlinePreview, formatMessageTime } from "../utils/chat";
import MessageReactions from "./MessageReactions";
import PollMessage from "./PollMessage";
import EventMessage from "./EventMessage";
import LinkPreview from "./LinkPreview";
import ReadByList from "./ReadByList";

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

/** Render text with markdown bold/italic/code, @mentions and #hashtags */
function RichText({ text, isOwn }) {
  if (!text) return null;
  // Simple tokeniser: bold, italic, inline code, mention, hashtag
  const parts = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(@\w+)|(#\w+)/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    if (m[1]) parts.push({ type: "bold", value: m[2] });
    else if (m[3]) parts.push({ type: "italic", value: m[4] });
    else if (m[5]) parts.push({ type: "code", value: m[6] });
    else if (m[7]) parts.push({ type: "mention", value: m[7] });
    else if (m[8]) parts.push({ type: "hashtag", value: m[8] });
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return (
    <p className="message-copy">
      {parts.map((p, i) => {
        switch (p.type) {
          case "bold":    return <strong key={i}>{p.value}</strong>;
          case "italic":  return <em key={i}>{p.value}</em>;
          case "code":    return <code key={i} className="inline-code">{p.value}</code>;
          case "mention": return <span key={i} className={`mention${isOwn ? " mention--own" : ""}`}>{p.value}</span>;
          case "hashtag": return <span key={i} className={`hashtag${isOwn ? " hashtag--own" : ""}`}>{p.value}</span>;
          default:        return p.value;
        }
      })}
    </p>
  );
}

const MessageBubble = memo(function MessageBubble({
  message, isOwnMessage, isHighlighted, isEditing, editingContent, showSender,
  isNewGroup, isStarred, conversation,
  onEditContentChange, onStartReply, onStartEdit, onCancelEdit, onSaveEdit, onDelete,
  onAddReaction, onRemoveReaction, onForward, onToggleStar, onPollVote, onPinMessage,
  currentUserId,
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

  const isAudio   = message.messageType === "audio";
  const isPoll    = message.messageType === "poll";
  const isEvent   = message.messageType === "event";
  const isGif     = message.messageType === "gif";
  const isSticker = message.messageType === "sticker";

  const bubbleCls = [
    "message-bubble",
    isOwnMessage      ? "message-bubble--own"      : "",
    isHighlighted     ? "message-bubble--highlighted" : "",
    isStarred         ? "message-bubble--starred"   : "",
    message.isPinned  ? "message-bubble--pinned"    : "",
  ].filter(Boolean).join(" ");

  return (
    <article
      id={`message-${message.id}`}
      className={bubbleCls}
      style={isNewGroup ? { marginTop: 10 } : undefined}
    >
      {/* Pinned indicator */}
      {message.isPinned && (
        <div className="pinned-indicator" aria-label="Pinned message">
          <Pin size={10} /> Pinned
        </div>
      )}

      <div className="message-bubble__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isOwnMessage && showSender && (
            <p className="message-author" style={{ color: conversation?.nicknames?.[message.sender.id] ? "var(--clr-accent)" : undefined }}>
              {conversation?.nicknames?.[message.sender.id] || message.sender.name}
            </p>
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
            <button className={`msg-action-btn${isStarred ? " msg-action-btn--starred" : ""}`} type="button" onClick={() => onToggleStar?.(message)} title={isStarred ? "Unstar" : "Star"} aria-pressed={isStarred}><Star size={13} /></button>
            {!isAudio && !isPoll && !isEvent && (
              <button className="msg-action-btn" type="button" onClick={handleCopy} title={copied ? "Copied" : "Copy"}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            <button className="msg-action-btn" type="button" onClick={() => onStartReply?.(message)} title="Reply"><Reply size={13} /></button>
            <button className="msg-action-btn" type="button" onClick={() => onForward?.(message)} title="Forward"><Forward size={13} /></button>
            {onPinMessage && conversation?.type === "group" && (
              <button className="msg-action-btn" type="button" onClick={() => onPinMessage?.(message, !message.isPinned)} title={message.isPinned ? "Unpin" : "Pin"}><Pin size={13} /></button>
            )}
            {isOwnMessage && !isAudio && !isPoll && !isEvent && (
              <button className="msg-action-btn" type="button" onClick={() => onStartEdit?.(message)} title="Edit"><Pencil size={13} /></button>
            )}
            {isOwnMessage && (
              <button className="msg-action-btn msg-action-btn--danger" type="button" onClick={() => onDelete?.(message)} title="Delete"><Trash2 size={13} /></button>
            )}
          </div>
        )}
      </div>

      <div className="message-body">
        {message.isDeleted ? (
          <p className="message-copy message-copy--muted">This message was deleted.</p>
        ) : (
          <>
            {/* Poll */}
            {isPoll && <PollMessage poll={message.poll} messageId={message.id} currentUserId={currentUserId} onVote={onPollVote} isOwn={isOwnMessage} />}

            {/* Event */}
            {isEvent && <EventMessage event={message.event} />}

            {/* GIF */}
            {isGif && message.gifUrl && (
              <div className="gif-message">
                <img src={message.gifUrl} alt={message.gifTitle || "GIF"} className="gif-message__img" loading="lazy" />
                {message.gifTitle && <p className="gif-message__title">{message.gifTitle}</p>}
              </div>
            )}

            {/* Sticker */}
            {isSticker && message.stickerUrl && (
              <img src={message.stickerUrl} alt="Sticker" className="sticker-message" loading="lazy" />
            )}

            {/* Audio */}
            {isAudio && message.attachment?.url && (
              <div className="audio-message">
                <span className="audio-message__icon" aria-hidden="true">🎤</span>
                <audio src={message.attachment.url} controls className="audio-message__player" preload="metadata" />
                {message.attachment.size && <span className="audio-message__size">{formatFileSize(message.attachment.size)}</span>}
              </div>
            )}

            {/* File attachment */}
            {!isAudio && !isGif && !isSticker && !isPoll && !isEvent && message.attachment && (
              <a className="file-card" href={message.attachment.url} target="_blank" rel="noreferrer">
                <span className="file-card__icon">{getFileIcon(message.attachment.mimeType)}</span>
                <div className="file-card__info">
                  <div className="file-card__name">{message.attachment.name}</div>
                  <div className="file-card__meta">{message.attachment.mimeType || "File"} · {formatFileSize(message.attachment.size)}</div>
                </div>
              </a>
            )}

            {/* Text / edit */}
            {!isAudio && !isGif && !isSticker && !isPoll && !isEvent && (
              isEditing ? (
                <div className="edit-message-box">
                  <textarea
                    className="composer-input"
                    value={editingContent}
                    onChange={(e) => onEditContentChange?.(e.target.value)}
                    rows={Math.min(6, (editingContent.match(/\n/g) || []).length + 2)}
                    maxLength={4000}
                    autoFocus
                    style={{ minHeight: 36, resize: "none" }}
                  />
                  <div className="edit-message-box__actions">
                    <button className="secondary-button" style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} type="button" onClick={onCancelEdit}>Cancel</button>
                    <button className="primary-button" style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} type="button" onClick={onSaveEdit}>Save</button>
                  </div>
                </div>
              ) : message.content ? (
                <RichText text={message.content} isOwn={isOwnMessage} />
              ) : null
            )}

            {/* Link preview */}
            {message.linkPreview?.url && !isPoll && !isEvent && (
              <LinkPreview preview={message.linkPreview} isOwn={isOwnMessage} />
            )}
          </>
        )}
      </div>

      <div className="message-meta">
        <span>
          {isStarred && <span style={{ marginRight: 4, color: "#f59e0b" }} aria-label="Starred">★</span>}
          {formatMessageTime(message.createdAt)}
          {message.editedAt ? " · edited" : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Read-by list for group messages */}
          {isOwnMessage && conversation?.type === "group" && (
            <ReadByList readBy={message.readBy} participants={conversation?.participants} />
          )}
          {isOwnMessage && (
            <span className={`message-status ${message.status === "seen" ? "message-status--seen" : ""}`} title={message.status}>
              {STATUS_ICONS[message.status] || STATUS_ICONS.sent}
            </span>
          )}
        </div>
      </div>

      {!message.isDeleted && (
        <MessageReactions message={message} currentUserId={currentUserId} onAddReaction={onAddReaction} onRemoveReaction={onRemoveReaction} />
      )}
    </article>
  );
});

export default MessageBubble;
