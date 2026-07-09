import { useEffect, useMemo, useState } from "react";
import { X, Crown, UserMinus, ShieldCheck, ShieldOff, Megaphone, Tag } from "lucide-react";
import Avatar from "./Avatar";

export default function GroupManagerPanel({
  conversation, currentUser, open, searchTerm, candidateUsers, loadingCandidates,
  onSearchTermChange, onRenameGroup, onAddMembers, onUpdateRole, onRemoveParticipant,
  onSetAnnouncement, onSetNickname, onClose,
}) {
  const [groupName, setGroupName]         = useState("");
  const [selectedIds, setSelectedIds]     = useState([]);
  const [editingNicknameFor, setEditingNicknameFor] = useState(null); // userId
  const [nicknameInput, setNicknameInput] = useState("");

  const currentMember = useMemo(
    () => conversation?.participants?.find((p) => p.id === currentUser.id) || null,
    [conversation, currentUser.id],
  );
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    if (open) {
      setGroupName(conversation?.name || "");
      setSelectedIds([]);
      setEditingNicknameFor(null);
      setNicknameInput("");
    }
  }, [open, conversation?.id, conversation?.name]);

  if (!open || !conversation) return null;

  const participantIds = new Set(conversation.participants.map((p) => p.id));
  const candidates = candidateUsers.filter((u) => !participantIds.has(u.id));
  const isAnnouncement = Boolean(conversation.isAnnouncement);

  function startNicknameEdit(userId, currentNickname) {
    setEditingNicknameFor(userId);
    setNicknameInput(currentNickname || "");
  }

  async function saveNickname(userId) {
    await onSetNickname?.(userId, nicknameInput.trim());
    setEditingNicknameFor(null);
    setNicknameInput("");
  }

  return (
    <section className="group-panel">
      <div className="group-panel__header">
        <div>
          <p className="eyebrow">Group</p>
          <h3>Members &amp; settings</h3>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close group panel">
          <X size={15} />
        </button>
      </div>

      {/* ── Rename ─────────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="group-panel__block">
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "var(--text-sm)", fontWeight: 500 }}>
            <span>Group name</span>
            <input
              type="text"
              value={groupName}
              maxLength={120}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
            />
          </label>
          <button
            className="secondary-button"
            style={{ height: 32, padding: "0 14px", fontSize: "var(--text-xs)", alignSelf: "flex-start" }}
            type="button"
            disabled={!groupName.trim() || groupName.trim() === conversation.name || groupName.trim().length < 2}
            onClick={() => onRenameGroup(groupName.trim())}
          >
            Save name
          </button>
        </div>
      ) : (
        <div className="group-panel__block">
          <p className="helper-copy">Only admins can rename the group or manage members.</p>
        </div>
      )}

      {/* ── Announcement mode (admins only) ─────────────────────── */}
      {isAdmin && (
        <div className="group-panel__block">
          <div className="group-panel__section-title">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Megaphone size={13} /> Announcement mode
            </span>
          </div>
          <div className="group-panel__announcement-row">
            <div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--clr-ink-2)" }}>
                {isAnnouncement ? "Only admins can send messages" : "All members can send messages"}
              </p>
              <p className="helper-copy" style={{ marginTop: 2 }}>
                When enabled, only group admins can post.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAnnouncement}
              className={`settings-toggle${isAnnouncement ? " settings-toggle--on" : ""}`}
              onClick={() => onSetAnnouncement?.(!isAnnouncement)}
              title={isAnnouncement ? "Disable announcement mode" : "Enable announcement mode"}
            />
          </div>
        </div>
      )}

      {/* ── Member list ──────────────────────────────────────────── */}
      <div className="group-panel__block">
        <div className="group-panel__section-title">
          <span>Members</span>
          <span>{conversation.participants.length}</span>
        </div>
        <div className="group-panel__members">
          {conversation.participants.map((member) => {
            const nickname = conversation.nicknames?.[member.id];
            const isEditingThis = editingNicknameFor === member.id;

            return (
              <div key={member.id} className="group-member-row">
                <div className="group-member-row__identity">
                  <Avatar name={member.name} seed={member.avatarSeed} size="small" />
                  <div>
                    <strong>
                      {nickname ? (
                        <>
                          <span style={{ color: "var(--clr-accent)" }}>{nickname}</span>
                          <span style={{ color: "var(--clr-ink-3)", fontWeight: 400, fontSize: "var(--text-xs)", marginLeft: 4 }}>({member.name})</span>
                        </>
                      ) : (
                        member.name
                      )}
                      {member.id === currentUser.id ? " (You)" : ""}
                    </strong>
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="group-member-row__actions">
                  {member.role === "admin" && (
                    <span className="pill pill--accent" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Crown size={10} /> Admin
                    </span>
                  )}
                  {/* Nickname edit inline */}
                  {isEditingThis ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        type="text"
                        value={nicknameInput}
                        maxLength={50}
                        placeholder="Nickname…"
                        onChange={(e) => setNicknameInput(e.target.value)}
                        style={{ height: 26, width: 90, fontSize: "var(--text-xs)", padding: "0 7px" }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveNickname(member.id); if (e.key === "Escape") setEditingNicknameFor(null); }}
                      />
                      <button className="icon-button" type="button" title="Save" onClick={() => saveNickname(member.id)} style={{ width: 24, height: 24, color: "var(--clr-accent)" }}>✓</button>
                      <button className="icon-button" type="button" title="Cancel" onClick={() => setEditingNicknameFor(null)} style={{ width: 24, height: 24 }}>✕</button>
                    </div>
                  ) : (
                    <button
                      className="icon-button"
                      type="button"
                      title={nickname ? `Change nickname (${nickname})` : "Set nickname"}
                      onClick={() => startNicknameEdit(member.id, nickname)}
                      style={{ opacity: 0.6 }}
                    >
                      <Tag size={12} />
                    </button>
                  )}

                  {isAdmin && member.id !== currentUser.id && (
                    <>
                      <button
                        className="icon-button"
                        type="button"
                        title={member.role === "admin" ? "Remove admin" : "Make admin"}
                        onClick={() => onUpdateRole(member.id, member.role === "admin" ? "member" : "admin")}
                      >
                        {member.role === "admin" ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Remove from group"
                        style={{ color: "var(--clr-red)" }}
                        onClick={() => onRemoveParticipant(member.id)}
                      >
                        <UserMinus size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add people (admins only) ─────────────────────────────── */}
      {isAdmin && (
        <div className="group-panel__block">
          <div className="group-panel__section-title"><span>Add people</span></div>
          <input
            type="search"
            placeholder="Search people…"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            style={{ height: 32, fontSize: "var(--text-sm)" }}
          />
          <div className="group-panel__candidates">
            {loadingCandidates && <p className="helper-copy">Loading…</p>}
            {!loadingCandidates && !candidates.length && searchTerm && (
              <p className="helper-copy">No people to add.</p>
            )}
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
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : "people"}
          </button>
        </div>
      )}
    </section>
  );
}
