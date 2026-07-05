import { X } from "lucide-react";
import Avatar from "./Avatar";
import { formatLastSeen } from "../utils/chat";

export default function UserProfilePanel({ user, isOnline, onClose }) {
  if (!user) return null;

  return (
    <aside className="user-profile-panel" aria-label="User profile">
      <div className="user-profile-panel__header">
        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Profile</span>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close profile">
          <X size={16} />
        </button>
      </div>

      <div className="user-profile-panel__body">
        <div className="user-profile-panel__avatar-wrap">
          <Avatar name={user.name} seed={user.avatarSeed} size="large" style={{ width: 64, height: 64, fontSize: 22 }} />
          <span className={`presence-dot${isOnline ? " presence-dot--online" : ""}`}
            style={{ width: 14, height: 14, bottom: 2, right: 2, borderWidth: 2.5 }} />
        </div>

        <h3 className="user-profile-panel__name">{user.name}</h3>
        <p className="user-profile-panel__email">{user.email}</p>

        <div className="user-profile-panel__status">
          {isOnline ? (
            <span className="user-profile-panel__badge user-profile-panel__badge--online">● Online</span>
          ) : (
            <span className="user-profile-panel__badge">
              {user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : "Offline"}
            </span>
          )}
        </div>

        <dl className="user-profile-panel__meta">
          <div>
            <dt>Joined</dt>
            <dd>{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
