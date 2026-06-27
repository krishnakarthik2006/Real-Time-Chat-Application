import { useState, useCallback, useRef } from "react";
import { formatFileSize } from "../utils/chat";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_BYTES = 10 * 1024 * 1024;

function getFileIcon(type = "") {
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("pdf")) return "📄";
  if (type.includes("word")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  if (type.includes("text")) return "📄";
  return "📎";
}

export default function FileShare({ onFileSelect, disabled = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const processFile = useCallback((file) => {
    setError("");
    if (file.size > MAX_BYTES) { setError("File must be smaller than 10 MB."); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setError("File type not supported."); return; }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ file, dataUrl: e.target.result });
      reader.readAsDataURL(file);
    } else {
      setPreview({ file, dataUrl: null });
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (!disabled && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, [disabled, processFile]);

  const handleInput = useCallback((e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  }, [processFile]);

  const handleSend = useCallback(() => {
    if (preview) { onFileSelect(preview.file); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }
  }, [preview, onFileSelect]);

  const handleCancel = useCallback(() => {
    setPreview(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (preview) {
    return (
      <div className="file-preview-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {preview.dataUrl
            ? <img src={preview.dataUrl} alt={preview.file.name} className="file-preview-card__thumb" />
            : <div className="file-preview-card__thumb">{getFileIcon(preview.file.type)}</div>
          }
          <div className="file-preview-card__info">
            <div className="file-preview-card__name">{preview.file.name}</div>
            <div className="file-preview-card__size">{formatFileSize(preview.file.size)}</div>
          </div>
        </div>
        <div className="file-preview-card__actions" style={{ marginTop: 8 }}>
          <button className="primary-button" onClick={handleSend} disabled={disabled} type="button">
            Send File
          </button>
          <button className="secondary-button" onClick={handleCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`file-drop-zone${dragActive ? " drag-active" : ""}${disabled ? " disabled" : ""}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag}
        onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" onChange={handleInput} disabled={disabled}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: "none" }} />
        <div className="file-drop-content">
          <div className="file-drop-icon">📎</div>
          <div className="file-drop-text">
            Drag a file here or <span className="file-select-link">browse</span>
          </div>
          <div className="file-drop-hint">Images, PDF, Word, Excel · max 10 MB</div>
        </div>
      </div>
      {error && <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-red)", marginTop: 6 }}>{error}</p>}
    </div>
  );
}
