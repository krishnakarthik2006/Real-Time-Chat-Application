import { Fragment, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import GroupManagerPanel from "./GroupManagerPanel";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import MessageSearchPanel from "./MessageSearchPanel";
import TypingIndicator from "./TypingIndicator";
import {
  formatDayDivider,
  getConversationStatus,
  getConversationTitle,
  isSameDay,
} from "../utils/chat";

export default function ChatWindow({
  currentUser,
  conversation,
  conversationPreference,
  messages,
  typingUsers,
  loadingMessages,
  sendingMessage,
  presenceByUserId,
  socket,
  onSendMessage,
  searchPanelOpen,
  searchQuery,
  searchResults,
  searchingMessages,
  onToggleSearchPanel,
  onSearchQueryChange,
  onSelectSearchMessage,
  onClearSearch,
  highlightedMessageId,
  replyTarget,
  onReplyToMessage,
  onCancelReply,
  editingMessageId,
  editingContent,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteMessage,
  groupPanelOpen,
  onToggleGroupPanel,
  groupSearchTerm,
  groupCandidates,
  loadingGroupCandidates,
  onGroupSearchTermChange,
  onRenameGroup,
  onAddGroupMembers,
  onUpdateGroupRole,
  onRemoveGroupParticipant,
  isMobileLayout,
  showBackButton,
  onBackToList,
  onTogglePinConversation,
  onToggleMuteConversation,
  onToggleArchiveConversation,
}) {
  const listRef = useRef(null);
  const endRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const previousConversationIdRef = useRef(conversation?.id || null);

  useEffect(() => {
    const listElement = listRef.current;

    if (!listElement) {
      return undefined;
    }

    const updateScrollIntent = () => {
      const distanceFromBottom =
        listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight;

      shouldAutoScrollRef.current = distanceFromBottom < 96;
    };

    updateScrollIntent();
    listElement.addEventListener("scroll", updateScrollIntent);

    return () => {
      listElement.removeEventListener("scroll", updateScrollIntent);
    };
  }, [conversation?.id]);

  useEffect(() => {
    const changedConversation = previousConversationIdRef.current !== conversation?.id;

    if (changedConversation) {
      previousConversationIdRef.current = conversation?.id || null;
      shouldAutoScrollRef.current = true;
    }

    if (shouldAutoScrollRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.id, messages.length, typingUsers.length]);

  useEffect(() => {
    if (!highlightedMessageId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById(`message-${highlightedMessageId}`);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedMessageId]);

  if (!conversation) {
    return (
      <section className="chat-panel chat-panel--empty">
        <div className="empty-stage">
          <p className="eyebrow">Messages</p>
          <h2>Select a conversation to start chatting.</h2>
          <p>Photos, files, replies, delivery states, and live typing will all show up here.</p>
        </div>
      </section>
    );
  }

  const title = getConversationTitle(conversation, currentUser);
  const status = getConversationStatus(conversation, currentUser, presenceByUserId);
  const isGroup = conversation.type === "group";

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <div className="chat-title">
          {showBackButton ? (
            <button className="icon-button icon-button--surface" type="button" onClick={onBackToList}>
              Back
            </button>
          ) : null}

          <Avatar name={title} seed={conversation.name || title} />
          <div className="chat-title__copy">
            <div className="chat-title__meta">
              <h2>{title}</h2>
              {conversationPreference.pinned ? <span className="subtle-chip">Pinned</span> : null}
              {conversationPreference.muted ? <span className="subtle-chip">Muted</span> : null}
            </div>
            <p>{status}</p>
          </div>
        </div>

        <div className="chat-header__actions">
          <button className="icon-button icon-button--surface" type="button" onClick={onToggleSearchPanel}>
            {searchPanelOpen ? "Close Search" : "Search"}
          </button>
          {isGroup ? (
            <button className="icon-button icon-button--surface" type="button" onClick={onToggleGroupPanel}>
              {groupPanelOpen ? "Close Group" : "Group"}
            </button>
          ) : null}
          <button className="icon-button icon-button--surface" type="button" onClick={onTogglePinConversation}>
            {conversationPreference.pinned ? "Unpin" : "Pin"}
          </button>
          <button className="icon-button icon-button--surface" type="button" onClick={onToggleMuteConversation}>
            {conversationPreference.muted ? "Unmute" : "Mute"}
          </button>
          <button className="icon-button icon-button--surface" type="button" onClick={onToggleArchiveConversation}>
            {conversationPreference.archived ? "Restore" : "Archive"}
          </button>
        </div>
      </header>

      {searchPanelOpen ? (
        <MessageSearchPanel
          query={searchQuery}
          loading={searchingMessages}
          results={searchResults}
          onQueryChange={onSearchQueryChange}
          onSelectMessage={onSelectSearchMessage}
          onClear={onClearSearch}
        />
      ) : null}

      <GroupManagerPanel
        conversation={conversation}
        currentUser={currentUser}
        open={groupPanelOpen}
        searchTerm={groupSearchTerm}
        candidateUsers={groupCandidates}
        loadingCandidates={loadingGroupCandidates}
        onSearchTermChange={onGroupSearchTermChange}
        onRenameGroup={onRenameGroup}
        onAddMembers={onAddGroupMembers}
        onUpdateRole={onUpdateGroupRole}
        onRemoveParticipant={onRemoveGroupParticipant}
        onClose={onToggleGroupPanel}
      />

      <div ref={listRef} className="message-list">
        {loadingMessages ? <p className="helper-copy">Loading messages...</p> : null}
        {!loadingMessages && !messages.length ? (
          <div className="empty-card empty-card--center">
            <p>No messages yet. Say hello and start the conversation.</p>
          </div>
        ) : null}

        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const showDateDivider = !previousMessage || !isSameDay(previousMessage.createdAt, message.createdAt);

          return (
            <Fragment key={message.id}>
              {showDateDivider ? (
                <div className="message-day-divider">
                  <span>{formatDayDivider(message.createdAt)}</span>
                </div>
              ) : null}

              <MessageBubble
                message={message}
                isOwnMessage={message.sender.id === currentUser.id}
                isHighlighted={message.id === highlightedMessageId}
                isEditing={editingMessageId === message.id}
                editingContent={editingMessageId === message.id ? editingContent : ""}
                showSender={isGroup}
                onEditContentChange={onEditContentChange}
                onStartReply={onReplyToMessage}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={() => onSaveEdit(message.id)}
                onDelete={onDeleteMessage}
              />
            </Fragment>
          );
        })}

        <TypingIndicator users={typingUsers} />
        <div ref={endRef} />
      </div>

      <MessageComposer
        conversationId={conversation.id}
        socket={socket}
        onSend={onSendMessage}
        disabled={loadingMessages || sendingMessage}
        replyingTo={replyTarget}
        onCancelReply={onCancelReply}
        compact={isMobileLayout}
      />
    </section>
  );
}
