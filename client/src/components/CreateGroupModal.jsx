import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import Avatar from "./Avatar";

export default function CreateGroupModal({
  open, users, searchTerm, selectedUserIds, loading,
  onSearchTermChange, onToggleUser, onClose, onCreateGroup,
}) {
  const [groupName, setGroupName] = useState("");

  useEffect(() => { if (!open) setGroupName(""); }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="group-modal-title">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--clr-accent-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="var(--clr-accent)" />
            </div>
            <div>
              <p className="eyebrow">New Group</p>
              <h2 id="group-modal-title">Create a group chat</h2>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <label>
            <span>Group name</span>
            <input
              type="text"
              placeholder="e.g. Weekend Plans"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </label>

          <label>
            <span>Add people</span>
            <input
              type="search"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </label>

          <div className="group-list">
            {loading && <p className="helper-copy" style={{ padding: "8px 4px" }}>Loading people…</p>}
            {!loading && !users.length && <p className="helper-copy" style={{ padding: "8px 4px" }}>No people found.</p>}
            {users.map((user) => {
              const selected = selectedUserIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  className={`group-user ${selected ? "group-user--selected" : ""}`}
                  type="button"
                  onClick={() => onToggleUser(user.id)}
                >
                  <Avatar name={user.name} seed={user.avatarSeed} size="small" />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`pill ${selected ? "pill--accent" : ""}`}>{selected ? "Added" : "Add"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <span className="helper-copy" style={{ flex: 1 }}>{selectedUserIds.length} selected</span>
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onCreateGroup(groupName)}
            disabled={!groupName.trim() || !selectedUserIds.length}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
