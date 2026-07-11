import { memo, useEffect, useRef, useState } from "react";
import { LogOut, UserPlus, MoreVertical, Pin, PinOff, BellOff, Bell, Archive, ArchiveRestore, Search, Settings } from "lucide-react";
import Avatar from "./Avatar";
import SettingsModal from "./SettingsModal";
import { formatListTime, formatMessagePreview, getConversationTitle } from "../utils/chat";

const FILTER_OPTIONS = [
  { id: "all",    label: "All" },
  { id: "unread", label: "Unread" },
  { id: "direct", label: "Direct" },
  { id: "group",  label: "Groups" },
];

const ContextMenu = memo(function ContextMenu({ open, preference, onPin, onMute, onArchive, onClose, menuRef }) {
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose, menuRef]);

  if (!open) return null;
  return (
    <div className="ctx-menu" ref={menuRef} role="menu">
      <button className="ctx-menu-item" type="button" onClick={onPin} role="menuitem">
        {preference.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        {preference.pinned ? "Unpin" : "Pin"}
      </button>
      <button className="ctx-menu-item" type="button" onClick={onMute} role="menuitem">
        {preference.muted ? <Bell size={14} /> : <BellOff size={14} />}
        {preference.muted ? "Unmute" : "Mute"}
      </button>
      <div className="ctx-menu-divider" />
      <button className="ctx-menu-item" type="button" onClick={onArchive} role="menuitem">
        {preference.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        {preference.archived ? "Unarchive" : "Archive"}
      </button>
    </div>
  );
});

const ConversationCard = memo(function ConversationCard({
  conversation, currentUser, selectedConversationId,
  presenceByUserId, preference,
  onSelectConversation, onTogglePin, onToggleMute, onToggleArchive,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const title = getConversationTitle(conversation, currentUser);
  const partner = conversation.type === "direct"
    ? conversation.participants.find((p) => p.id !== currentUser.id)
    : null;
  const isOnline = Boolean(partner && presenceByUserId[partner.id]?.isOnline);
  const isActive = selectedConversationId === conversation.id;

  return (
    <article className={`conversation-card${isActive ? " conversation-card--active" : ""}`}>
      <button
        className="conversation-card__main"
        type="button"
        onClick={() => onSelectConversation(conversation)}
      >
        <div className="conversation-card__avatar">
          <Avatar name={title} seed={conversation.type === "group" ? conversation.name : partner?.avatarSeed} />
          {conversation.type === "direct" && (
            <span className={`presence-dot${isOnline ? " presence-dot--online" : ""}`} />
          )}
        </div>
        <div className="conversation-content">
          <div className="conversation-row">
            <strong className="conversation-card__title">{title}</strong>
            <time className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--clr-ink-3)", flexShrink: 0 }}>
              {formatListTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
            </time>
          </div>
          <div className="conversation-row">
            <p>{formatMessagePreview(conversation.lastMessage, currentUser)}</p>
            {conversation.unreadCount > 0 && <span className="badge">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
          </div>
        </div>
      </button>

      <div className="conversation-card__menu">
        <button
          className="icon-button"
          type="button"
          aria-label="More options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
        >
          <MoreVertical size={15} />
        </button>
        <ContextMenu
          open={menuOpen}
          preference={preference}
          menuRef={menuRef}
          onPin={() => { onTogglePin(conversation.id); setMenuOpen(false); }}
          onMute={() => { onToggleMute(conversation.id); setMenuOpen(false); }}
          onArchive={() => { onToggleArchive(conversation.id); setMenuOpen(false); }}
          onClose={() => setMenuOpen(false)}
        />
      </div>
    </article>
  );
});

export default memo(function Sidebar({
  currentUser, pinnedConversations, recentConversations,
  conversationStats, conversationOverview, conversationView,
  conversationQuery, conversationFilter, selectedConversationId,
  presenceByUserId, searchTerm, searchResults, searchingUsers,
  conversationPreferences,
  onConversationViewChange, onConversationQueryChange, onConversationFilterChange,
  onSearchTermChange, onSelectConversation, onStartDirectConversation,
  onOpenGroupModal, notificationsSupported, notificationPermission,
  onEnableNotifications, onTogglePinConversation, onToggleMuteConversation,
  onToggleArchiveConversation, onLogout,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const filterCounts = {
    all: conversationStats.total,
    unread: conversationStats.unread,
    direct: conversationStats.direct,
    group: conversationStats.group,
  };

  function getPreference(id) {
    return { pinned: false, muted: false, archived: false, ...conversationPreferences[id] };
  }

  const hasConversations = pinnedConversations.length + recentConversations.length > 0;

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-top">
        <div className="sidebar-top__name">
          <Avatar name={currentUser.name} seed={currentUser.avatarSeed} />
          <strong>{currentUser.name}</strong>
        </div>
        <div className="sidebar-top__actions">
          <button className="icon-button" type="button" onClick={onOpenGroupModal} aria-label="New group" title="New Group">
            <UserPlus size={18} />
          </button>
          <button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings">
            <Settings size={18} />
          </button>
          <button className="icon-button" type="button" onClick={onLogout} aria-label="Log out" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="sidebar-search-wrap">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="search"
            placeholder="Search chats or find people…"
            value={conversationQuery || searchTerm}
            onChange={(e) => {
              onConversationQueryChange(e.target.value);
              onSearchTermChange(e.target.value);
            }}
          />
        </div>
        {searchTerm && (
          <div className="search-results">
            {searchingUsers && <p className="helper-copy" style={{ padding: "6px 4px" }}>Searching…</p>}
            {!searchingUsers && !searchResults.length && (
              <p className="helper-copy" style={{ padding: "6px 4px" }}>No people found.</p>
            )}
            {searchResults.map((user) => (
              <button key={user.id} className="search-result" type="button" onClick={() => onStartDirectConversation(user)}>
                <Avatar name={user.name} seed={user.avatarSeed} size="small" />
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <span className="pill">Chat</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="filter-chip-row">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`filter-chip${conversationFilter === opt.id ? " filter-chip--active" : ""}`}
            type="button"
            onClick={() => onConversationFilterChange(opt.id)}
          >
            {opt.label}
            {filterCounts[opt.id] > 0 && (
              <span style={{ opacity: .7 }}>{filterCounts[opt.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="view-tabs">
        {["inbox", "archived"].map((view) => (
          <button
            key={view}
            type="button"
            className={`view-tab${conversationView === view ? " view-tab--active" : ""}`}
            aria-current={conversationView === view}
            onClick={() => onConversationViewChange(view)}
          >
            {view === "inbox"
              ? `Chats${conversationOverview.inbox ? ` (${conversationOverview.inbox})` : ""}`
              : `Archived${conversationOverview.archived ? ` (${conversationOverview.archived})` : ""}`}
          </button>
        ))}
      </div>

      {/* Notification banner */}
      {notificationsSupported && notificationPermission !== "granted" && (
        <div className="notification-card">
          <p style={{ marginBottom: 5 }}>Enable notifications to get alerts when new messages arrive.</p>
          {notificationPermission !== "denied" && (
            <button className="text-button" type="button" onClick={onEnableNotifications} style={{ fontWeight: 600, padding: 0 }}>
              Enable notifications
            </button>
          )}
        </div>
      )}

      {/* Conversation list */}
      <div className="conversation-section">
        {pinnedConversations.length > 0 && (
          <>
            <div className="section-label">
              <span>Pinned</span>
              <span>{pinnedConversations.length}</span>
            </div>
            <div className="conversation-list">
              {pinnedConversations.map((c) => (
                <ConversationCard key={c.id} conversation={c} currentUser={currentUser}
                  selectedConversationId={selectedConversationId} presenceByUserId={presenceByUserId}
                  preference={getPreference(c.id)} onSelectConversation={onSelectConversation}
                  onTogglePin={onTogglePinConversation} onToggleMute={onToggleMuteConversation}
                  onToggleArchive={onToggleArchiveConversation} />
              ))}
            </div>
          </>
        )}

        <div className="section-label">
          <span>{conversationView === "archived" ? "Archived" : "Recent"}</span>
          <span>{recentConversations.length}</span>
        </div>
        <div className="conversation-list">
          {!hasConversations && (
            <div className="empty-card">
              <p>{conversationView === "archived" ? "No archived conversations." : "No chats yet. Search for someone to start chatting."}</p>
            </div>
          )}
          {recentConversations.map((c) => (
            <ConversationCard key={c.id} conversation={c} currentUser={currentUser}
              selectedConversationId={selectedConversationId} presenceByUserId={presenceByUserId}
              preference={getPreference(c.id)} onSelectConversation={onSelectConversation}
              onTogglePin={onTogglePinConversation} onToggleMute={onToggleMuteConversation}
              onToggleArchive={onToggleArchiveConversation} />
          ))}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        notificationsSupported={notificationsSupported}
        notificationPermission={notificationPermission}
        onEnableNotifications={() => {
          onEnableNotifications();
          setSettingsOpen(false);
        }}
        onLogout={onLogout}
      />
    </aside>
  );
});
