import { useEffect, useState } from "react";
import { X, Image, Video, FileText, Link, Music, Smile } from "lucide-react";
import { formatFileSize } from "../utils/chat";
import { conversationApi } from "../utils/apiHelpers";

const TABS = [
  { id: "images",    label: "Images",    Icon: Image },
  { id: "videos",    label: "Videos",    Icon: Video },
  { id: "documents", label: "Docs",      Icon: FileText },
  { id: "links",     label: "Links",     Icon: Link },
  { id: "audio",     label: "Audio",     Icon: Music },
  { id: "gifs",      label: "GIFs",      Icon: Smile },
];

export default function SharedMediaPanel({ conversationId, token, open, onClose }) {
  const [tab, setTab] = useState("images");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !conversationId) return;
    let cancelled = false;
    setLoading(true);
    conversationApi.getSharedMedia(conversationId, tab, token)
      .then((data) => { if (!cancelled) setItems(data.messages || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, conversationId, tab, token]);

  if (!open) return null;

  return (
    <aside className="shared-media-panel">
      <div className="shared-media-panel__header">
        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Shared Media</span>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className="shared-media-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`shared-media-tab${tab === id ? " shared-media-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="shared-media-body">
        {loading && <p className="helper-copy" style={{ padding: 16 }}>Loading…</p>}
        {!loading && !items.length && (
          <p className="helper-copy" style={{ padding: 16, textAlign: "center" }}>
            No {tab} shared yet.
          </p>
        )}

        {tab === "images" && (
          <div className="shared-media-grid">
            {items.map((m) => (
              <a key={m.id} href={m.attachment?.url} target="_blank" rel="noreferrer" className="shared-media-thumb">
                <img src={m.attachment?.url} alt={m.attachment?.name} loading="lazy" />
              </a>
            ))}
          </div>
        )}

        {tab === "gifs" && (
          <div className="shared-media-grid">
            {items.map((m) => (
              <a key={m.id} href={m.gifUrl} target="_blank" rel="noreferrer" className="shared-media-thumb">
                <img src={m.gifUrl} alt={m.gifTitle || "GIF"} loading="lazy" />
              </a>
            ))}
          </div>
        )}

        {(tab === "videos" || tab === "documents" || tab === "audio") && (
          <div className="shared-media-list">
            {items.map((m) => (
              <a key={m.id} className="shared-media-file" href={m.attachment?.url} target="_blank" rel="noreferrer">
                <span className="shared-media-file__name">{m.attachment?.name}</span>
                <span className="shared-media-file__size">{formatFileSize(m.attachment?.size)}</span>
              </a>
            ))}
          </div>
        )}

        {tab === "links" && (
          <div className="shared-media-list">
            {items.map((m) => (
              <a key={m.id} className="shared-media-link-row" href={m.linkPreview?.url} target="_blank" rel="noreferrer">
                {m.linkPreview?.image && <img src={m.linkPreview.image} alt="" className="shared-media-link-thumb" loading="lazy" />}
                <div>
                  <p className="shared-media-link-title">{m.linkPreview?.title || m.linkPreview?.url}</p>
                  <span className="shared-media-link-url">{m.linkPreview?.url?.replace(/^https?:\/\//, "").slice(0, 50)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
