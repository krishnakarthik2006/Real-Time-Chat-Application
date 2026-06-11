import Avatar from "./Avatar";
import {
  formatListTime,
  formatMessagePreview,
  getConversationStatus,
  getConversationTitle,
} from "../utils/chat";

const filterOptions = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "direct", label: "Direct" },
  { id: "group", label: "Groups" },
];

function getConversationPreference(preferences, conversationId) {
  return {
    pinned: false,
    muted: false,
    archived: false,
    ...preferences[conversationId],
  };
}

function ConversationCard({
  conversation,
  currentUser,
  selectedConversationId,
  presenceByUserId,
  conversationPreferences,
  onSelectConversation,
  onTogglePinConversation,
  onToggleMuteConversation,
  onToggleArchiveConversation,
}) {
  const title = getConversationTitle(conversation, currentUser);
  const directPartner = conversation.participants.find(
    (participant) => participant.id !== currentUser.id,
  );
  const isDirectOnline = Boolean(
    conversation.type === "direct" && directPartner && presenceByUserId[directPartner.id]?.isOnline,
  );
  const preference = getConversationPreference(conversationPreferences, conversation.id);

  return (
    <article className={`conversation-card ${selectedConversationId === conversation.id ? "conversation-card--active" : ""}`}>
      <button
        className="conversation-card__main"
        type="button"
        onClick={() => onSelectConversation(conversation)}
      >
        <div className="conversation-card__avatar">
          <Avatar
            name={title}
            seed={conversation.type === "group"
              ? conversation.name
              : directPartner?.avatarSeed}
          />
          {conversation.type === "direct" ? (
            <span className={`presence-dot ${isDirectOnline ? "presence-dot--online" : ""}`} />
          ) : null}
        </div>

        <div className="conversation-card__menu">
          <button className="icon-button" type="button" aria-label="More options" style={{ fontSize: "0.8rem" }}>
            &#8942;
          </button>
        </div>

        <div className="conversation-content">
          <div className="conversation-row">
            <strong className="conversation-card__title">{title}</strong>
            <span>{formatListTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
          </div>

          <div className="conversation-row conversation-row--muted">
            <p>{formatMessagePreview(conversation.lastMessage, currentUser)}</p>
            {conversation.unreadCount ? (
              <span className="badge">{conversation.unreadCount}</span>
            ) : (
              <span className="status-copy">
                {getConversationStatus(conversation, currentUser, presenceByUserId)}
              </span>
            )}
          </div>


        </div>
      </button>

        <div className="conversation-card__menu">
          <button className="icon-button" type="button" aria-label="More options">
            &#8942;
          </button>
        </div>
    </article>
  );
}

export default function Sidebar({
  currentUser,
  pinnedConversations,
  recentConversations,
  conversationStats,
  conversationOverview,
  conversationView,
  conversationQuery,
  conversationFilter,
  selectedConversationId,
  presenceByUserId,
  searchTerm,
  searchResults,
  searchingUsers,
  conversationPreferences,
  onConversationViewChange,
  onConversationQueryChange,
  onConversationFilterChange,
  onSearchTermChange,
  onSelectConversation,
  onStartDirectConversation,
  onOpenGroupModal,
  notificationsSupported,
  notificationPermission,
  onEnableNotifications,
  onTogglePinConversation,
  onToggleMuteConversation,
  onToggleArchiveConversation,
  onLogout,
}) {
  const filterCounts = {
    all: conversationStats.total,
    unread: conversationStats.unread,
    direct: conversationStats.direct,
    group: conversationStats.group,
  };
  const notificationCopy = notificationPermission === "denied"
    ? "Notifications are blocked right now. You can still allow them from your browser settings."
    : "Turn on notifications so new messages still reach you when the tab is in the background.";
  const hasVisibleConversations = pinnedConversations.length || recentConversations.length;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-top__name">
          <Avatar name={currentUser.name} seed={currentUser.avatarSeed} />
          <strong>{currentUser.name}</strong>
        </div>

        <div className="sidebar-top__actions">
          <button className="icon-button" type="button" onClick={onOpenGroupModal} aria-label="New Group" title="New Group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
          </button>
          <button className="icon-button" type="button" onClick={onLogout} aria-label="Log Out" title="Log Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <input
          id="conversation-search"
          type="search"
          placeholder="Search or start new chat"
          value={conversationQuery || searchTerm}
          onChange={(event) => {
            onConversationQueryChange(event.target.value);
            onSearchTermChange(event.target.value);
          }}
        />

        {searchTerm ? (
          <div className="search-results">
            {searchingUsers ? <p className="helper-copy">Searching people...</p> : null}
            {!searchingUsers && !searchResults.length ? (
              <p className="helper-copy">No people matched that search.</p>
            ) : null}
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="search-result"
                type="button"
                onClick={() => onStartDirectConversation(user)}
              >
                <Avatar name={user.name} seed={user.avatarSeed} />
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <span className="pill">Chat</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>



      <div className="conversation-section">
        {pinnedConversations.length ? (
          <>
            <div className="conversation-section__header">
              <p className="eyebrow">Pinned</p>
              <span>{pinnedConversations.length}</span>
            </div>
            <div className="conversation-list">
              {pinnedConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  currentUser={currentUser}
                  selectedConversationId={selectedConversationId}
                  presenceByUserId={presenceByUserId}
                  conversationPreferences={conversationPreferences}
                  onSelectConversation={onSelectConversation}
                  onTogglePinConversation={onTogglePinConversation}
                  onToggleMuteConversation={onToggleMuteConversation}
                  onToggleArchiveConversation={onToggleArchiveConversation}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="conversation-section__header">
          <p className="eyebrow">{conversationView === "archived" ? "Archived" : "Chats"}</p>
          <span>{pinnedConversations.length + recentConversations.length}</span>
        </div>

        <div className="conversation-list">
          {!hasVisibleConversations ? (
            <div className="empty-card">
              <p>
                {conversationView === "archived"
                  ? "Archived conversations will appear here."
                  : "No conversations match this view yet. Start a new chat or create a group to get going."}
              </p>
            </div>
          ) : null}

          {recentConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              currentUser={currentUser}
              selectedConversationId={selectedConversationId}
              presenceByUserId={presenceByUserId}
              conversationPreferences={conversationPreferences}
              onSelectConversation={onSelectConversation}
              onTogglePinConversation={onTogglePinConversation}
              onToggleMuteConversation={onToggleMuteConversation}
              onToggleArchiveConversation={onToggleArchiveConversation}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
