import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";

export default function GroupManagerPanel({
  conversation,
  currentUser,
  open,
  searchTerm,
  candidateUsers,
  loadingCandidates,
  onSearchTermChange,
  onRenameGroup,
  onAddMembers,
  onUpdateRole,
  onRemoveParticipant,
  onClose,
}) {
  const [groupName, setGroupName] = useState(conversation?.name || "");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const currentMember = useMemo(
    () => conversation?.participants?.find((participant) => participant.id === currentUser.id) || null,
    [conversation, currentUser.id],
  );
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    if (open) {
      setGroupName(conversation?.name || "");
      setSelectedUserIds([]);
    }
  }, [open, conversation?.id, conversation?.name]);

  if (!open || !conversation) {
    return null;
  }

  const participantIds = new Set(conversation.participants.map((participant) => participant.id));
  const visibleCandidates = candidateUsers.filter((user) => !participantIds.has(user.id));

  return (
    <section className="group-panel">
      <div className="group-panel__header">
        <div>
          <p className="eyebrow">Group</p>
          <h3>People and settings</h3>
        </div>
        <button className="text-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {isAdmin ? (
        <div className="group-panel__block">
          <label>
            <span>Group name</span>
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Study Circle"
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={!groupName.trim() || groupName.trim() === conversation.name}
            onClick={() => onRenameGroup(groupName.trim())}
          >
            Save Name
          </button>
        </div>
      ) : (
        <div className="group-panel__block">
          <p className="helper-copy">Only group admins can rename the chat or manage members.</p>
        </div>
      )}

      <div className="group-panel__block">
        <div className="group-panel__section-title">
          <strong>Members</strong>
          <span>{conversation.participants.length}</span>
        </div>
        <div className="group-panel__members">
          {conversation.participants.map((participant) => (
            <div key={participant.id} className="group-member-row">
              <div className="group-member-row__identity">
                <Avatar name={participant.name} seed={participant.avatarSeed} small />
                <div>
                  <strong>
                    {participant.name}
                    {participant.id === currentUser.id ? " (You)" : ""}
                  </strong>
                  <span>{participant.email}</span>
                </div>
              </div>
              <div className="group-member-row__actions">
                <span className="pill">{participant.role}</span>
                {isAdmin && participant.id !== currentUser.id ? (
                  <>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => onUpdateRole(participant.id, participant.role === "admin" ? "member" : "admin")}
                    >
                      {participant.role === "admin" ? "Make Member" : "Make Admin"}
                    </button>
                    <button
                      className="text-button text-button--danger"
                      type="button"
                      onClick={() => onRemoveParticipant(participant.id)}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin ? (
        <div className="group-panel__block">
          <div className="group-panel__section-title">
            <strong>Add people</strong>
          </div>
          <input
            type="search"
            placeholder="Search people to add"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />

          <div className="group-panel__candidates">
            {loadingCandidates ? <p className="helper-copy">Loading people...</p> : null}
            {!loadingCandidates && !visibleCandidates.length ? (
              <p className="helper-copy">No additional people matched that search.</p>
            ) : null}

            {visibleCandidates.map((user) => {
              const selected = selectedUserIds.includes(user.id);

              return (
                <button
                  key={user.id}
                  className={`group-user ${selected ? "group-user--selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedUserIds((current) => (
                    current.includes(user.id)
                      ? current.filter((id) => id !== user.id)
                      : [...current, user.id]
                  ))}
                >
                  <Avatar name={user.name} seed={user.avatarSeed} small />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className="pill">{selected ? "Selected" : "Select"}</span>
                </button>
              );
            })}
          </div>

          <button
            className="secondary-button"
            type="button"
            disabled={!selectedUserIds.length}
            onClick={async () => {
              const added = await onAddMembers(selectedUserIds);

              if (added !== false) {
                setSelectedUserIds([]);
              }
            }}
          >
            Add Selected People
          </button>
        </div>
      ) : null}
    </section>
  );
}
