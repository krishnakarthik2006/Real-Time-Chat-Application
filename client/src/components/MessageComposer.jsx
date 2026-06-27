import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import { formatFileSize, formatInlinePreview } from "../utils/chat";

function getDraftKey(cid) { return `pulse-draft-${cid}`; }

export default function MessageComposer({ conversationId, socket, onSend, disabled, replyingTo, onCancelReply }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  function emitTyping(start) {
    if (socket && conversationId) {
      socket.emit(start ? "typing:start" : "typing:stop", { conversationId });
    }
  }

  async function submit() {
    if ((!content.trim() && !file) || disabled) return;
    const result = await onSend(conversationId, {
      content: content.trim(),
      file,
      replyToMessageId: replyingTo?.id,
    });
    if (result === false) return;
    clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
    setContent("");
    setFile(null);
    localStorage.removeItem(getDraftKey(conversationId));
    if (fileInputRef.current) fileInputRef.current.value = "";
    textareaRef.current?.focus();
  }

  // Restore draft + reset file on conversation change
  useEffect(() => {
    setContent(conversationId ? localStorage.getItem(getDraftKey(conversationId)) || "" : "");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    textareaRef.current?.focus();
  }, [conversationId]);

  // Save draft
  useEffect(() => {
    if (!conversationId) return;
    if (content.trim()) localStorage.setItem(getDraftKey(conversationId), content);
    else localStorage.removeItem(getDraftKey(conversationId));
  }, [content, conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  // Cleanup on unmount
  useEffect(() => () => { clearTimeout(typingTimeoutRef.current); emitTyping(false); }, [conversationId, socket]);

  function handleChange(value) {
    setContent(value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
  }

  const canSend = !disabled && (content.trim().length > 0 || file !== null);

  return (
    <form className="composer" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {replyingTo && (
        <div className="reply-strip">
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Replying to {replyingTo.sender?.name || "message"}</strong>
            <p>{formatInlinePreview(replyingTo)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancelReply} aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      )}

      {file && (
        <div className="file-preview-strip">
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{file.name}</strong>
            <span className="file-preview-strip__meta">{formatFileSize(file.size)}</span>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Remove file"
            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="composer-row">
        <label className="upload-button--icon" htmlFor="composer-file" aria-label="Attach file" title="Attach file">
          <Paperclip size={17} className="upload-button__icon" />
        </label>
        <input
          ref={fileInputRef}
          id="composer-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          hidden
        />

        <textarea
          ref={textareaRef}
          className="composer-input"
          placeholder={replyingTo ? "Write a reply…" : "Type a message…"}
          value={content}
          maxLength={2000}
          rows={1}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); }
          }}
        />

        <button
          className="send-button"
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          title="Send"
        >
          <SendHorizonal size={15} className="send-button__icon" />
        </button>
      </div>

      <div className="composer-meta">
        <span className="composer-hint">Enter to send · Shift+Enter for new line</span>
        <span className="composer-hint">{content.length}/2000</span>
      </div>
    </form>
  );
}
