import { useState } from "react";
import {
  formatFileSize,
  formatInlinePreview,
  formatMessageTime,
} from "../utils/chat";

const statusLabels = {
  sent: "Sent",
  delivered: "Delivered",
  seen: "Seen",
};

function MessageStatus({ status }) {
  const showDoubleCheck = status === "delivered" || status === "seen";

  return (
    <span
      className={`message-status ${status === "seen" ? "message-status--seen" : ""}`}
      aria-label={statusLabels[status] || "Sent"}
      title={statusLabels[status] || "Sent"}
    >
      <svg className="message-status__checks" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M4.5 10.5L7.75 13.75L13.5 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        {showDoubleCheck ? (
          <path
            d="M8 10.5L11.25 13.75L17 8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        ) : null}
      </svg>
    </span>
  );
}

export default function MessageBubble({
  message,
  isOwnMessage,
  isHighlighted,
  isEditing,
  editingContent,
  showSender,
  onEditContentChange,
  onStartReply,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function handleCopy() {
    const nextValue = message.content || formatInlinePreview(message);

    if (!nextValue) {
      return;
    }

    try {
      if (!navigator?.clipboard) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(nextValue);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    } catch (_error) {
      setCopyLabel("Unavailable");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    }
  }

  return (
    <article
      id={`message-${message.id}`}
      className={[
        "message-bubble",
        isOwnMessage ? "message-bubble--own" : "",
        isHighlighted ? "message-bubble--highlighted" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="message-bubble__header">
        <div>
          {!isOwnMessage && showSender ? <p className="message-author">{message.sender.name}</p> : null}
          {message.replyTo ? (
            <div className="quoted-message">
              <strong>{message.replyTo.sender?.name || "Unknown user"}</strong>
              <span>{formatInlinePreview(message.replyTo)}</span>
            </div>
          ) : null}
        </div>

        {!message.isDeleted ? (
          <div className="message-actions">
            <button className="text-button" type="button" onClick={handleCopy}>
              {copyLabel}
            </button>
            <button className="text-button" type="button" onClick={() => onStartReply(message)}>
              Reply
            </button>
            {isOwnMessage ? (
              <>
                <button className="text-button" type="button" onClick={() => onStartEdit(message)}>
                  Edit
                </button>
                <button className="text-button text-button--danger" type="button" onClick={() => onDelete(message)}>
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="message-body">
        {message.isDeleted ? (
          <p className="message-copy message-copy--muted">This message was deleted.</p>
        ) : (
          <>
            {message.attachment ? (
              <a
                className="file-card"
                href={message.attachment.url}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{message.attachment.name}</strong>
                <span className="file-card__meta">
                  {message.attachment.mimeType || "File"} • {formatFileSize(message.attachment.size)}
                </span>
              </a>
            ) : null}

            {isEditing ? (
              <div className="edit-message-box">
                <input
                  type="text"
                  value={editingContent}
                  onChange={(event) => onEditContentChange(event.target.value)}
                />
                <div className="edit-message-box__actions">
                  <button className="secondary-button" type="button" onClick={onCancelEdit}>
                    Cancel
                  </button>
                  <button className="primary-button" type="button" onClick={onSaveEdit}>
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
          {message.editedAt ? " • edited" : ""}
        </span>
        {isOwnMessage ? <MessageStatus status={message.status} /> : null}
      </div>
    </article>
  );
}
