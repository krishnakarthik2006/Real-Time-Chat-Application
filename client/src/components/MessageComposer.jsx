import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import { formatFileSize, formatInlinePreview } from "../utils/chat";
import VoiceRecorder from "./VoiceRecorder";
import ComposeExtras from "./ComposeExtras";
import FileShare from "./FileShare";

function getDraftKey(cid) { return `chat-app-draft-${cid}`; }

export default function MessageComposer({
  conversationId, socket, onSend, disabled,
  replyingTo, onCancelReply,
  participants, // for @mention autocomplete
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null); // string when active
  const [showFilePicker, setShowFilePicker] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Build URL preview by detecting URLs in content
  const urlMatch = content.match(/https?:\/\/[^\s]{8,}/);
  const detectedUrl = urlMatch ? urlMatch[0] : null;

  function emitTyping(start) {
    if (socket && conversationId) socket.emit(start ? "typing:start" : "typing:stop", { conversationId });
  }

  async function submit(payload = null) {
    const p = payload || { content: content.trim(), file, replyToMessageId: replyingTo?.id };
    if (!p.content && !p.file && !p.poll && !p.event && !p.gifUrl && !p.stickerUrl) return;
    if (disabled) return;

    // Attach detected link preview metadata to text messages
    if (!payload && p.content && detectedUrl) {
      p.linkPreview = { url: detectedUrl };
    }

    const result = await onSend(conversationId, p);
    if (result === false) return;
    clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
    setContent("");
    setFile(null);
    setMentionQuery(null);
    setShowFilePicker(false);
    localStorage.removeItem(getDraftKey(conversationId));
    textareaRef.current?.focus();
  }

  async function sendVoice(audioFile) {
    await onSend(conversationId, { content: "", file: audioFile, messageType: "audio", replyToMessageId: replyingTo?.id });
  }

  // Draft restore
  useEffect(() => {
    setContent(conversationId ? localStorage.getItem(getDraftKey(conversationId)) || "" : "");
    setFile(null);
    setMentionQuery(null);
    setShowFilePicker(false);
    textareaRef.current?.focus();
  }, [conversationId]);

  // Draft save
  useEffect(() => {
    if (!conversationId) return;
    content.trim() ? localStorage.setItem(getDraftKey(conversationId), content) : localStorage.removeItem(getDraftKey(conversationId));
  }, [content, conversationId]);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  useEffect(() => () => { clearTimeout(typingTimeoutRef.current); emitTyping(false); }, [conversationId, socket]);

  function handleChange(value) {
    setContent(value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
    // Detect @mention
    const m = value.match(/@(\w*)$/);
    setMentionQuery(m ? m[1] : null);
  }

  function insertMention(name) {
    const updated = content.replace(/@\w*$/, `@${name} `);
    setContent(updated);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  const mentionCandidates = mentionQuery !== null && participants
    ? participants.filter((p) => p.name.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  const canSend = !disabled && (content.trim().length > 0 || file !== null);

  return (
    <div className="composer-wrap">
      {/* Compose extras (poll / event / gif / sticker) */}
      <ComposeExtras
        onSendPoll={(poll) => submit({ content: "", poll, messageType: "poll", replyToMessageId: replyingTo?.id })}
        onSendEvent={(event) => submit({ content: "", event, messageType: "event", replyToMessageId: replyingTo?.id })}
        onSendGif={({ gifUrl, gifTitle }) => submit({ content: "", gifUrl, gifTitle, messageType: "gif", replyToMessageId: replyingTo?.id })}
        onSendSticker={(emoji) => submit({ content: "", stickerUrl: emoji, messageType: "sticker", replyToMessageId: replyingTo?.id })}
      />

      <form className="composer" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        {replyingTo && (
          <div className="reply-strip">
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Replying to {replyingTo.sender?.name || "message"}</strong>
              <p>{formatInlinePreview(replyingTo)}</p>
            </div>
            <button className="icon-button" type="button" onClick={onCancelReply} aria-label="Cancel reply"><X size={14} /></button>
          </div>
        )}

        {file && (
          <div className="file-preview-strip">
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{file.name}</strong>
              <span className="file-preview-strip__meta">{formatFileSize(file.size)}</span>
            </div>
            <button className="icon-button" type="button" aria-label="Remove file" onClick={() => { setFile(null); setShowFilePicker(false); }}><X size={14} /></button>
          </div>
        )}

        {/* @mention autocomplete */}
        {mentionCandidates.length > 0 && (
          <div className="mention-suggestions">
            {mentionCandidates.map((p) => (
              <button key={p.id} type="button" className="mention-suggestion" onClick={() => insertMention(p.name)}>
                <span className="mention-suggestion__name">@{p.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="composer-row">
          <button className="upload-button--icon" type="button" aria-label="Attach file" title="Attach file" onClick={() => setShowFilePicker((value) => !value)}>
            <Paperclip size={17} className="upload-button__icon" />
          </button>

          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder={replyingTo ? "Write a reply…" : "Type a message… (@mention, #hashtag, **bold**)"}
            value={content}
            maxLength={4000}
            rows={1}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); }
              if (e.key === "Escape") setMentionQuery(null);
            }}
          />

          {!content.trim() && !file ? (
            <VoiceRecorder onSend={sendVoice} onCancel={() => {}} disabled={disabled} />
          ) : (
            <button className="send-button" type="submit" disabled={!canSend} aria-label="Send message" title="Send">
              <SendHorizonal size={15} className="send-button__icon" />
            </button>
          )}
        </div>

        {showFilePicker && !file && (
          <div style={{ padding: "0 8px 8px" }}>
            <FileShare onFileSelect={(selectedFile) => { setFile(selectedFile); setShowFilePicker(false); }} disabled={disabled} />
          </div>
        )}

        <div className="composer-meta">
          <span className="composer-hint">{content.length}/4000</span>
        </div>
      </form>
    </div>
  );
}
