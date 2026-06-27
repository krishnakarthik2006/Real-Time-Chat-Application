import { Fragment, useEffect, useRef } from "react";
import { Search, X, Users, Pin, PinOff, BellOff, Bell, Archive, ArchiveRestore, ChevronLeft } from "lucide-react";
import Avatar from "./Avatar";
import GroupManagerPanel from "./GroupManagerPanel";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import MessageSearchPanel from "./MessageSearchPanel";
import TypingIndicator from "./TypingIndicator";
import { formatDayDivider, getConversationStatus, getConversationTitle, isSameDay } from "../utils/chat";

export default function ChatWindow({
  currentUser, conversation, conversationPreference, messages, typingUsers,
  loadingMessages, sendingMessage, presenceByUserId, socket,
  onSendMessage, searchPanelOpen, searchQuery, searchResults, searchingMessages,
  onToggleSearchPanel, onSearchQueryChange, onSelectSearchMessage, onClearSearch,
  highlightedMessageId, replyTarget, onReplyToMessage, onCancelReply,
  editingMessageId, editingContent, onEditContentChange, onStartEdit, onCancelEdit, onSaveEdit,
  onDeleteMessage, groupPanelOpen, onToggleGroupPanel, groupSearchTerm,
  groupCandidates, loadingGroupCandidates, onGroupSearchTermChange,
  onRenameGroup, onAddGroupMembers, onUpdateGroupRole, onRemoveGroupParticipant,
  isMobileLayout, showBackButton, onBackToList,
  onTogglePinConversation, onToggleMuteConversation, onToggleArchiveConversation,
  onAddReaction, onRemoveReaction,
}) {
  const listRef = useRef(null);
  const endRef = useRef(null);
  const autoScrollRef = useRef(true);
  const prevConvIdRef = useRef(conversation?.id || null);

  // Track scroll intent
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => {
      autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [conversation?.id]);

  // Auto scroll on new messages
  useEffect(() => {
    const changed = prevConvIdRef.current !== conversation?.id;
    if (changed) { prevConvIdRef.current = conversation?.id || null; autoScrollRef.current = true; }
    if (autoScrollRef.current) endRef.current?.scrollIntoView({ behavior: changed ? "instant" : "smooth" });
  }, [conversation?.id, messages.length, typingUsers.length]);

  // Scroll to highlighted message
  useEffect(() => {
    if (!highlightedMessageId) return;
    const id = setTimeout(() => {
      document.getElementById(`message-${highlightedMessageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
    return () => clearTimeout(id);
  }, [highlightedMessageId]);

  if (!conversation) {
    return (
      <section className="chat-panel chat-panel--empty">
        <div className="empty-stage">
          <div className="empty-stage__icon">💬</div>
          <h2>No conversation selected</h2>
          <p>Pick a chat from the sidebar, or search for someone to start a new conversation.</p>
        </div>
      </section>
    );
  }

  const title = getConversationTitle(conversation, currentUser);
  const status = getConversationStatus(conversation, currentUser, presenceByUserId);
  const isGroup = conversation.type === "group";
  const partner = !isGroup ? conversation.participants.find((p) => p.id !== currentUser.id) : null;
  const isPartnerOnline = Boolean(partner && presenceByUserId[partner.id]?.isOnline);

  return (
    <section className="chat-panel">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-title">
          {showBackButton && (
            <button className="icon-button icon-button--surface" type="button" onClick={onBackToList} aria-label="Back to list">
              <ChevronLeft size={18} />
            </button>
          )}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar name={title} seed={isGroup ? conversation.name : partner?.avatarSeed} />
            {!isGroup && (
              <span className={`presence-dot${isPartnerOnline ? " presence-dot--online" : ""}`}
                style={{ borderColor: "var(--clr-surface)" }} />
            )}
          </div>
          <div className="chat-title__copy">
            <div className="chat-title__meta">
              <h2>{title}</h2>
              {conversationPreference.pinned && <span className="subtle-chip">Pinned</span>}
              {conversationPreference.muted && <span className="subtle-chip">Muted</span>}
            </div>
            <p>{status}</p>
          </div>
        </div>

        <div className="chat-header__actions">
          <button
            className={`icon-button icon-button--surface${searchPanelOpen ? " icon-button--active" : ""}`}
            type="button" onClick={onToggleSearchPanel}
            title={searchPanelOpen ? "Close search" : "Search messages"}
          >
            {searchPanelOpen ? <X size={17} /> : <Search size={17} />}
          </button>
          {isGroup && (
            <button
              className={`icon-button icon-button--surface${groupPanelOpen ? " icon-button--active" : ""}`}
              type="button" onClick={onToggleGroupPanel}
              title={groupPanelOpen ? "Close group info" : "Group info"}
            >
              {groupPanelOpen ? <X size={17} /> : <Users size={17} />}
            </button>
          )}
          <button
            className="icon-button icon-button--surface" type="button"
            onClick={onTogglePinConversation}
            title={conversationPreference.pinned ? "Unpin" : "Pin chat"}
          >
            {conversationPreference.pinned ? <PinOff size={17} /> : <Pin size={17} />}
          </button>
          <button
            className="icon-button icon-button--surface" type="button"
            onClick={onToggleMuteConversation}
            title={conversationPreference.muted ? "Unmute" : "Mute notifications"}
          >
            {conversationPreference.muted ? <Bell size={17} /> : <BellOff size={17} />}
          </button>
          <button
            className="icon-button icon-button--surface" type="button"
            onClick={onToggleArchiveConversation}
            title={conversationPreference.archived ? "Unarchive" : "Archive"}
          >
            {conversationPreference.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
          </button>
        </div>
      </header>

      {/* Search panel */}
      {searchPanelOpen && (
        <MessageSearchPanel
          query={searchQuery} loading={searchingMessages} results={searchResults}
          onQueryChange={onSearchQueryChange} onSelectMessage={onSelectSearchMessage} onClear={onClearSearch}
        />
      )}

      {/* Group manager panel */}
      <GroupManagerPanel
        conversation={conversation} currentUser={currentUser} open={groupPanelOpen}
        searchTerm={groupSearchTerm} candidateUsers={groupCandidates}
        loadingCandidates={loadingGroupCandidates}
        onSearchTermChange={onGroupSearchTermChange} onRenameGroup={onRenameGroup}
        onAddMembers={onAddGroupMembers} onUpdateRole={onUpdateGroupRole}
        onRemoveParticipant={onRemoveGroupParticipant} onClose={onToggleGroupPanel}
      />

      {/* Message list */}
      <div ref={listRef} className="message-list">
        {loadingMessages && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <div className="loader-spinner" />
          </div>
        )}
        {!loadingMessages && !messages.length && (
          <div className="empty-card" style={{ margin: "auto 0" }}>
            <p>No messages yet — say hello! 👋</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt);
          // Group consecutive messages from same sender (gap = 8px)
          const isNewGroup = !prev || prev.sender.id !== msg.sender.id || showDate;
          const isOwnMsg = msg.sender.id === currentUser.id;

          return (
            <Fragment key={msg.id}>
              {showDate && (
                <div className="message-day-divider">
                  <span>{formatDayDivider(msg.createdAt)}</span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwnMessage={isOwnMsg}
                isHighlighted={msg.id === highlightedMessageId}
                isEditing={editingMessageId === msg.id}
                editingContent={editingMessageId === msg.id ? editingContent : ""}
                showSender={isGroup && !isOwnMsg && isNewGroup}
                isNewGroup={isNewGroup && i > 0}
                onEditContentChange={onEditContentChange}
                onStartReply={onReplyToMessage}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={() => onSaveEdit(msg.id)}
                onDelete={onDeleteMessage}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                currentUserId={currentUser.id}
              />
            </Fragment>
          );
        })}

        <TypingIndicator users={typingUsers} />
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        conversationId={conversation.id} socket={socket}
        onSend={onSendMessage} disabled={sendingMessage}
        replyingTo={replyTarget} onCancelReply={onCancelReply}
      />
    </section>
  );
}
