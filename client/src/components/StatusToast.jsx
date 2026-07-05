import { useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";

/**
 * A self-dismissing toast that appears at the top of the workspace.
 * Auto-dismisses after 5 seconds; user can also close it manually.
 */
export default function StatusToast({ message, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;
    timerRef.current = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timerRef.current);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="status-toast" role="alert" aria-live="polite">
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>{message}</span>
      <button
        className="icon-button"
        type="button"
        style={{ width: 22, height: 22, color: "inherit" }}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
