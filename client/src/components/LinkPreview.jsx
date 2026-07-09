import { memo } from "react";
import { ExternalLink } from "lucide-react";

const LinkPreview = memo(function LinkPreview({ preview, isOwn }) {
  if (!preview?.url) return null;

  return (
    <a
      className={`link-preview${isOwn ? " link-preview--own" : ""}`}
      href={preview.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {preview.image && (
        <img
          className="link-preview__image"
          src={preview.image}
          alt={preview.title || ""}
          loading="lazy"
        />
      )}
      <div className="link-preview__body">
        {preview.siteName && (
          <span className="link-preview__site">{preview.siteName}</span>
        )}
        {preview.title && (
          <p className="link-preview__title">{preview.title}</p>
        )}
        {preview.description && (
          <p className="link-preview__desc">{preview.description}</p>
        )}
        <span className="link-preview__url">
          <ExternalLink size={10} />
          {preview.url.replace(/^https?:\/\//, "").slice(0, 60)}
        </span>
      </div>
    </a>
  );
});

export default LinkPreview;
