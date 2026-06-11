import { useEffect, useRef, useState } from "react";
import { formatFileSize, formatInlinePreview } from "../utils/chat";

function getDraftStorageKey(conversationId) {
  return `pulse-chat-draft-${conversationId}`;
}

export default function MessageComposer({
  conversationId,
  socket,
  onSend,
  disabled,
  replyingTo,
  onCancelReply,
  compact = false,
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  function stopTyping() {
    if (socket && conversationId) {
      socket.emit("typing:stop", { conversationId });
    }
  }

  async function submitMessage() {
    if ((!content.trim() && !file) || disabled) {
      return;
    }

    const sent = await onSend(conversationId, {
      content: content.trim(),
      file,
      replyToMessageId: replyingTo?.id,
    });

    if (sent === false) {
      return;
    }

    clearTimeout(typingTimeoutRef.current);
    stopTyping();
    setContent("");
    setFile(null);
    window.localStorage.removeItem(getDraftStorageKey(conversationId));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    textareaRef.current?.focus();
  }

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      stopTyping();
    };
  }, [conversationId, socket]);

  useEffect(() => {
    const nextDraft = conversationId
      ? window.localStorage.getItem(getDraftStorageKey(conversationId)) || ""
      : "";

    setContent(nextDraft);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    textareaRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    if (!content.trim()) {
      window.localStorage.removeItem(getDraftStorageKey(conversationId));
      return;
    }

    window.localStorage.setItem(getDraftStorageKey(conversationId), content);
  }, [content, conversationId]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [content]);

  function handleContentChange(value) {
    setContent(value);

    if (!socket || !conversationId) {
      return;
    }

    socket.emit("typing:start", { conversationId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1200);
  }

  function handleSubmit(event) {
    event.preventDefault();
    void submitMessage();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  return (
    <form className={`composer ${compact ? "composer--compact" : ""}`} onSubmit={handleSubmit}>
      {replyingTo ? (
        <div className="reply-strip">
          <div>
            <strong>Replying to {replyingTo.sender?.name || "message"}</strong>
            <p>{formatInlinePreview(replyingTo)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancelReply}>
            Close
          </button>
        </div>
      ) : null}

      {file ? (
        <div className="file-preview">
          <div>
            <strong>{file.name}</strong>
            <span className="file-preview__meta">{formatFileSize(file.size)}</span>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="composer-row">
        <label
          className="upload-button upload-button--icon"
          htmlFor="file-upload"
          aria-label="Attach file"
          title="Attach file"
        >
          <svg className="upload-button__icon" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M7.5 15.5V6.75C7.5 4.96 8.96 3.5 10.75 3.5C12.54 3.5 14 4.96 14 6.75V15.25C14 16.77 12.77 18 11.25 18C9.73 18 8.5 16.77 8.5 15.25V7.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        </label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          hidden
        />

        <textarea
          ref={textareaRef}
          className="composer-input composer-input--multiline"
          placeholder={replyingTo ? "Write a reply" : "Type a message"}
          value={content}
          maxLength={2000}
          rows={1}
          onChange={(event) => handleContentChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          className="send-button"
          type="submit"
          disabled={disabled || (!content.trim() && !file)}
          aria-label={disabled ? "Sending message" : "Send message"}
          title={disabled ? "Sending message" : "Send message"}
        >
          {disabled ? (
            <span className="send-button__label">...</span>
          ) : (
            <svg className="send-button__icon" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 10L16 4L12.5 16L9 11.5L3 10Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <div className="composer-meta">
        <span className="composer-hint">Press Enter to send and Shift+Enter for a new line.</span>
        <span className="composer-hint">
          {content.trim() ? "Draft saved locally" : "Ready to send"}
          {" • "}
          {content.length}/2000
        </span>
      </div>
    </form>
  );
}
