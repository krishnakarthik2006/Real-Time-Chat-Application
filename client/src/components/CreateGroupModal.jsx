import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function CreateGroupModal({
  open,
  users,
  searchTerm,
  selectedUserIds,
  loading,
  onSearchTermChange,
  onToggleUser,
  onClose,
  onCreateGroup,
}) {
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!open) {
      setGroupName("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="group-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">New Group</p>
            <h2 id="group-modal-title">Create a group conversation</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="modal-body">
          <label>
            <span>Group name</span>
            <input
              type="text"
              placeholder="Weekend Plans"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
          </label>

          <label>
            <span>Add people</span>
            <input
              type="search"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
          </label>

          <div className="group-list">
            {loading ? <p className="helper-copy">Loading people...</p> : null}
            {!loading && !users.length ? <p className="helper-copy">No people found.</p> : null}

            {users.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);

              return (
                <button
                  key={user.id}
                  className={`group-user ${isSelected ? "group-user--selected" : ""}`}
                  type="button"
                  onClick={() => onToggleUser(user.id)}
                >
                  <Avatar name={user.name} seed={user.avatarSeed} small />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className="pill">{isSelected ? "Added" : "Add"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <span className="helper-copy">{selectedUserIds.length} selected</span>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
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
