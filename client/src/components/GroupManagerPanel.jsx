import { useEffect, useMemo, useState } from "react";
import { X, Crown, UserMinus, ShieldCheck, ShieldOff } from "lucide-react";
import Avatar from "./Avatar";

export default function GroupManagerPanel({
  conversation, currentUser, open, searchTerm, candidateUsers, loadingCandidates,
  onSearchTermChange, onRenameGroup, onAddMembers, onUpdateRole, onRemoveParticipant, onClose,
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const currentMember = useMemo(
    () => conversation?.participants?.find((p) => p.id === currentUser.id) || null,
    [conversation, currentUser.id],
  );
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    if (open) { setGroupName(conversation?.name || ""); setSelectedIds([]); }
  }, [open, conversation?.id, conversation?.name]);

  if (!open || !conversation) return null;

  const participantIds = new Set(conversation.participants.map((p) => p.id));
  const candidates = candidateUsers.filter((u) => !participantIds.has(u.id));

  return (
    <section className="group-panel">
      <div className="group-panel__header">
        <div>
          <p className="eyebrow">Group</p>
          <h3>Members & settings</h3>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close group panel">
          <X size={15} />
        </button>
      </div>

      {/* Rename */}
      {isAdmin ? (
        <div className="group-panel__block">
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "var(--text-sm)", fontWeight: 500 }}>
            <span>Group name</span>
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
          </label>
          <button
            className="secondary-button"
            style={{ height: 32, padding: "0 14px", fontSize: "var(--text-xs)", alignSelf: "flex-start" }}
            type="button"
            disabled={!groupName.trim() || groupName.trim() === conversation.name}
            onClick={() => onRenameGroup(groupName.trim())}
          >
            Save Name
          </button>
        </div>
      ) : (
        <div className="group-panel__block">
          <p className="helper-copy">Only admins can rename the group or manage members.</p>
        </div>
      )}

      {/* Member list */}
      <div className="group-panel__block">
        <div className="group-panel__section-title">
          <span>Members</span>
          <span>{conversation.participants.length}</span>
        </div>
        <div className="group-panel__members">
          {conversation.participants.map((p) => (
            <div key={p.id} className="group-member-row">
              <div className="group-member-row__identity">
                <Avatar name={p.name} seed={p.avatarSeed} size="small" />
                <div>
                  <strong>{p.name}{p.id === currentUser.id ? " (You)" : ""}</strong>
                  <span>{p.email}</span>
                </div>
              </div>
              <div className="group-member-row__actions">
                {p.role === "admin" && (
                  <span className="pill pill--accent" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Crown size={10} /> Admin
                  </span>
                )}
                {isAdmin && p.id !== currentUser.id && (
                  <>
                    <button
                      className="icon-button"
                      type="button"
                      title={p.role === "admin" ? "Remove admin" : "Make admin"}
                      onClick={() => onUpdateRole(p.id, p.role === "admin" ? "member" : "admin")}
                    >
                      {p.role === "admin" ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Remove from group"
                      style={{ color: "var(--clr-red)" }}
                      onClick={() => onRemoveParticipant(p.id)}
                    >
                      <UserMinus size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add people */}
      {isAdmin && (
        <div className="group-panel__block">
          <div className="group-panel__section-title"><span>Add people</span></div>
          <input
            type="search" placeholder="Search people…"
            value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)}
            style={{ height: 32, fontSize: "var(--text-sm)" }}
          />
          <div className="group-panel__candidates">
            {loadingCandidates && <p className="helper-copy">Loading…</p>}
            {!loadingCandidates && !candidates.length && <p className="helper-copy">No people to add.</p>}
            {candidates.map((u) => {
              const sel = selectedIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  className={`group-user ${sel ? "group-user--selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedIds((prev) => sel ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                >
                  <Avatar name={u.name} seed={u.avatarSeed} size="small" />
                  <div><strong>{u.name}</strong><span>{u.email}</span></div>
                  <span className={`pill ${sel ? "pill--accent" : ""}`}>{sel ? "Selected" : "Select"}</span>
                </button>
              );
            })}
          </div>
          <button
            className="primary-button"
            style={{ height: 32, padding: "0 14px", fontSize: "var(--text-xs)", alignSelf: "flex-start" }}
            type="button"
            disabled={!selectedIds.length}
            onClick={async () => {
              const ok = await onAddMembers(selectedIds);
              if (ok !== false) setSelectedIds([]);
            }}
          >
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : "People"}
          </button>
        </div>
      )}
    </section>
  );
}
