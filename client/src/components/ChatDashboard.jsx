import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { request } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useBrowserNotifications } from "../hooks/useBrowserNotifications";
import { useChatSocket } from "../hooks/useChatSocket";
import { useConversationOperations, useLocalStorage } from "../hooks/useOptimizedChat";
import { conversationApi } from "../utils/apiHelpers";
import ChatWindow from "./ChatWindow";
import CreateGroupModal from "./CreateGroupModal";
import ForwardMessageModal from "./ForwardMessageModal";
import Sidebar from "./Sidebar";
import StatusToast from "./StatusToast";
import {
  formatInlinePreview,
  formatMessagePreview,
  getConversationTitle,
  sortConversations,
  updateMessageStatuses,
  upsertConversation,
  upsertMessage,
} from "../utils/chat";

const DEFAULT_CONVERSATION_PREFERENCE = {
  pinned: false,
  muted: false,
  archived: false,
};

function mergePresenceFromConversations(currentPresence, conversations) {
  const nextPresence = { ...currentPresence };

  conversations.forEach((conversation) => {
    conversation.participants.forEach((participant) => {
      nextPresence[participant.id] = {
        isOnline: nextPresence[participant.id]?.isOnline || false,
        lastSeen: participant.lastSeen ?? nextPresence[participant.id]?.lastSeen ?? null,
      };
    });
  });

  return nextPresence;
}

function getRequestedConversationId() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("conversationId");
}

function matchesConversationQuery(conversation, currentUser, normalizedQuery) {
  if (!normalizedQuery) {
    return true;
  }

  const participantText = conversation.participants
    .map((participant) => `${participant.name} ${participant.email}`)
    .join(" ");
  const searchableText = [
    getConversationTitle(conversation, currentUser),
    conversation.name,
    participantText,
    formatMessagePreview(conversation.lastMessage, currentUser),
    conversation.lastMessage ? formatInlinePreview(conversation.lastMessage) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function matchesConversationFilter(conversation, filter) {
  if (filter === "unread") {
    return conversation.unreadCount > 0;
  }

  if (filter === "direct") {
    return conversation.type === "direct";
  }

  if (filter === "group") {
    return conversation.type === "group";
  }

  return true;
}

function getConversationPreference(preferences, conversationId) {
  if (!conversationId) {
    return DEFAULT_CONVERSATION_PREFERENCE;
  }

  return {
    ...DEFAULT_CONVERSATION_PREFERENCE,
    ...preferences[conversationId],
  };
}

function orderConversationsForSidebar(conversations, preferences) {
  const chronologicallySorted = sortConversations(conversations);
  const pinned = [];
  const standard = [];

  chronologicallySorted.forEach((conversation) => {
    if (getConversationPreference(preferences, conversation.id).pinned) {
      pinned.push(conversation);
      return;
    }

    standard.push(conversation);
  });

  return [...pinned, ...standard];
}

export default memo(function ChatDashboard() {
  const { user, token, logout } = useAuth();
  const socket = useChatSocket(token);
  const {
    notify,
    isSupported: notificationsSupported,
    permission: notificationPermission,
    requestPermission,
  } = useBrowserNotifications();
  const [conversationPreferences, setConversationPreferences] = useLocalStorage(
    `pulse-chat-preferences-${user.id}`,
    {},
  );
  const conversationPreferencesRef = useRef(conversationPreferences);
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 900px)").matches;
  });

  const conversationOps = useConversationOperations(token, (conversationId, updates) => {
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId ? { ...conversation, ...updates } : conversation
    )));
  });

  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [presenceByUserId, setPresenceByUserId] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [conversationView, setConversationView] = useState("inbox");
  const [conversationQuery, setConversationQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupUsers, setGroupUsers] = useState([]);
  const [loadingGroupUsers, setLoadingGroupUsers] = useState(false);
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const oldestMessageCursorRef = useRef(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [searchingMessages, setSearchingMessages] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupManagerSearchTerm, setGroupManagerSearchTerm] = useState("");
  const [groupManagerCandidates, setGroupManagerCandidates] = useState([]);
  const [loadingGroupManagerCandidates, setLoadingGroupManagerCandidates] = useState(false);
  const [mobilePane, setMobilePane] = useState("list");
  const selectedConversationIdRef = useRef(null);

  // Starred messages — stored in localStorage per user
  const [starredMessageIds, setStarredMessageIds] = useLocalStorage(
    `pulse-starred-${user.id}`,
    [],
  );
  // Forward modal
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const conversationsRef = useRef([]);
  const highlightTimeoutRef = useRef(null);
  const sendingMessageRef = useRef(false);
  const requestedConversationIdRef = useRef(getRequestedConversationId());

  const deferredConversationQuery = useDeferredValue(conversationQuery);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredGroupSearchTerm = useDeferredValue(groupSearchTerm);
  const deferredMessageSearchQuery = useDeferredValue(messageSearchQuery);
  const deferredGroupManagerSearchTerm = useDeferredValue(groupManagerSearchTerm);

  useEffect(() => {
    conversationPreferencesRef.current = conversationPreferences;
  }, [conversationPreferences]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = (event) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setMobilePane("list");
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (isMobileLayout && !selectedConversationId) {
      setMobilePane("list");
    }
  }, [isMobileLayout, selectedConversationId]);

  const conversationOverview = useMemo(() => {
    const onlineParticipantIds = new Set();
    const overview = {
      inbox: 0,
      archived: 0,
      pinned: 0,
      muted: 0,
      online: 0,
    };

    conversations.forEach((conversation) => {
      const preference = getConversationPreference(conversationPreferences, conversation.id);

      if (preference.archived) {
        overview.archived += 1;
      } else {
        overview.inbox += 1;
      }

      if (preference.pinned) {
        overview.pinned += 1;
      }

      if (preference.muted) {
        overview.muted += 1;
      }

      conversation.participants.forEach((participant) => {
        if (participant.id !== user.id && presenceByUserId[participant.id]?.isOnline) {
          onlineParticipantIds.add(participant.id);
        }
      });
    });

    overview.online = onlineParticipantIds.size;
    return overview;
  }, [conversationPreferences, conversations, presenceByUserId, user.id]);

  const orderedConversations = useMemo(
    () => orderConversationsForSidebar(conversations, conversationPreferences),
    [conversationPreferences, conversations],
  );

  const viewConversations = useMemo(() => (
    orderedConversations.filter((conversation) => {
      const preference = getConversationPreference(conversationPreferences, conversation.id);
      return conversationView === "archived" ? preference.archived : !preference.archived;
    })
  ), [conversationPreferences, conversationView, orderedConversations]);

  const conversationStats = useMemo(() => ({
    total: viewConversations.length,
    unread: viewConversations.filter((conversation) => conversation.unreadCount > 0).length,
    direct: viewConversations.filter((conversation) => conversation.type === "direct").length,
    group: viewConversations.filter((conversation) => conversation.type === "group").length,
  }), [viewConversations]);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = deferredConversationQuery.trim().toLowerCase();

    return viewConversations.filter((conversation) => (
      matchesConversationFilter(conversation, conversationFilter)
      && matchesConversationQuery(conversation, user, normalizedQuery)
    ));
  }, [conversationFilter, deferredConversationQuery, user, viewConversations]);

  const pinnedConversations = useMemo(() => (
    visibleConversations.filter((conversation) => (
      getConversationPreference(conversationPreferences, conversation.id).pinned
    ))
  ), [conversationPreferences, visibleConversations]);

  const recentConversations = useMemo(() => (
    visibleConversations.filter((conversation) => (
      !getConversationPreference(conversationPreferences, conversation.id).pinned
    ))
  ), [conversationPreferences, visibleConversations]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  ) || null;
  const selectedConversationPreference = getConversationPreference(
    conversationPreferences,
    selectedConversation?.id,
  );

  const selectConversation = useCallback((conversationId, options = {}) => {
    const { openChatOnMobile = true } = options;

    startTransition(() => {
      setSelectedConversationId(conversationId);
    });

    if (isMobileLayout && openChatOnMobile) {
      setMobilePane("chat");
    }
  }, [isMobileLayout]);

  const updateConversationPreference = useCallback((conversationId, updates) => {
    const nextPreference = {
      ...getConversationPreference(conversationPreferencesRef.current, conversationId),
      ...updates,
    };

    setConversationPreferences((current) => ({
      ...current,
      [conversationId]: nextPreference,
    }));

    return nextPreference;
  }, [setConversationPreferences]);

  const toggleConversationPin = useCallback((conversationId) => {
    const currentPreference = getConversationPreference(conversationPreferencesRef.current, conversationId);

    updateConversationPreference(conversationId, {
      pinned: !currentPreference.pinned,
    });
  }, [updateConversationPreference]);

  const toggleConversationMute = useCallback((conversationId) => {
    const currentPreference = getConversationPreference(conversationPreferencesRef.current, conversationId);

    updateConversationPreference(conversationId, {
      muted: !currentPreference.muted,
    });
  }, [updateConversationPreference]);

  const toggleConversationArchived = useCallback((conversationId) => {
    const currentPreference = getConversationPreference(conversationPreferencesRef.current, conversationId);
    const nextPreference = updateConversationPreference(conversationId, {
      archived: !currentPreference.archived,
    });

    setConversationView(nextPreference.archived ? "archived" : "inbox");
  }, [updateConversationPreference]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = selectedConversationId ? `?conversationId=${selectedConversationId}` : window.location.pathname;
    window.history.replaceState({}, "", query);
  }, [selectedConversationId]);

  useEffect(() => () => {
    window.clearTimeout(highlightTimeoutRef.current);
  }, []);

  useEffect(() => {
    setMessageSearchQuery("");
    setMessageSearchResults([]);
    setHighlightedMessageId(null);
    setReplyTarget(null);
    setEditingMessageId(null);
    setEditingContent("");
    setSearchPanelOpen(false);
    setHasMoreMessages(false);
    oldestMessageCursorRef.current = null;

    if (selectedConversation?.type !== "group") {
      setGroupPanelOpen(false);
      setGroupManagerSearchTerm("");
    }
  }, [selectedConversationId, selectedConversation?.type]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoadingConversations(true);
      setStatusMessage("");

      try {
        const data = await request("/conversations", { token });

        if (cancelled) {
          return;
        }

        const nextConversations = sortConversations(data.conversations);
        setConversations(nextConversations);
        setPresenceByUserId((current) => mergePresenceFromConversations(current, nextConversations));

        const requestedConversation = requestedConversationIdRef.current
          ? nextConversations.find((conversation) => conversation.id === requestedConversationIdRef.current)
          : null;

        if (requestedConversation) {
          selectConversation(requestedConversation.id, { openChatOnMobile: true });

          if (getConversationPreference(conversationPreferencesRef.current, requestedConversation.id).archived) {
            setConversationView("archived");
          }
        } else if (!selectedConversationIdRef.current && nextConversations[0]) {
          selectConversation(nextConversations[0].id, { openChatOnMobile: false });
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    if (token) {
      loadConversations();
    }

    return () => {
      cancelled = true;
    };
  }, [selectConversation, token]);

  useEffect(() => {
    let cancelled = false;

    async function searchUsers() {
      if (!deferredSearchTerm.trim()) {
        setSearchingUsers(false);
        setSearchResults([]);
        return;
      }

      setSearchingUsers(true);

      try {
        const data = await request(`/users?q=${encodeURIComponent(deferredSearchTerm.trim())}`, { token });

        if (!cancelled) {
          setSearchResults(data.users);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }

    searchUsers();

    return () => {
      cancelled = true;
    };
  }, [deferredSearchTerm, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadGroupUsers() {
      if (!showGroupModal) {
        return;
      }

      setLoadingGroupUsers(true);

      try {
        const query = deferredGroupSearchTerm.trim();
        const data = await request(`/users?q=${encodeURIComponent(query)}`, { token });

        if (!cancelled) {
          setGroupUsers(data.users);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingGroupUsers(false);
        }
      }
    }

    loadGroupUsers();

    return () => {
      cancelled = true;
    };
  }, [deferredGroupSearchTerm, showGroupModal, token]);

  useEffect(() => {
    let cancelled = false;

    async function searchMessages() {
      if (!selectedConversationId || !deferredMessageSearchQuery.trim()) {
        setSearchingMessages(false);
        setMessageSearchResults([]);
        return;
      }

      setSearchingMessages(true);

      try {
        const data = await request(
          `/conversations/${selectedConversationId}/messages/search?q=${encodeURIComponent(
            deferredMessageSearchQuery.trim(),
          )}&limit=20`,
          { token },
        );

        if (!cancelled) {
          setMessageSearchResults(data.messages);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setSearchingMessages(false);
        }
      }
    }

    searchMessages();

    return () => {
      cancelled = true;
    };
  }, [deferredMessageSearchQuery, selectedConversationId, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadGroupManagerCandidates() {
      if (!groupPanelOpen || selectedConversation?.type !== "group") {
        return;
      }

      setLoadingGroupManagerCandidates(true);

      try {
        const query = deferredGroupManagerSearchTerm.trim();
        const data = await request(`/users?q=${encodeURIComponent(query)}`, { token });

        if (!cancelled) {
          setGroupManagerCandidates(data.users);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingGroupManagerCandidates(false);
        }
      }
    }

    loadGroupManagerCandidates();

    return () => {
      cancelled = true;
    };
  }, [deferredGroupManagerSearchTerm, groupPanelOpen, selectedConversation?.id, selectedConversation?.type, token]);

  useEffect(() => {
    if (!socket || !selectedConversationId) {
      return undefined;
    }

    socket.emit("conversation:join", {
      conversationId: selectedConversationId,
    });

    return () => {
      socket.emit("conversation:leave", {
        conversationId: selectedConversationId,
      });
    };
  }, [selectedConversationId, socket]);

  const handlePresenceSnapshot = useCallback(({ onlineUserIds }) => {
    setPresenceByUserId((current) => {
      const nextPresence = { ...current };

      Object.keys(nextPresence).forEach((userId) => {
        nextPresence[userId] = {
          ...nextPresence[userId],
          isOnline: false,
        };
      });

      onlineUserIds.forEach((userId) => {
        nextPresence[userId] = {
          ...nextPresence[userId],
          isOnline: true,
        };
      });

      return nextPresence;
    });
  }, []);

  const handlePresenceUpdate = useCallback(({ userId, isOnline, lastSeen }) => {
    setPresenceByUserId((current) => ({
      ...current,
      [userId]: {
        isOnline,
        lastSeen: lastSeen ?? current[userId]?.lastSeen ?? null,
      },
    }));
  }, []);

  const handleConversationUpsert = useCallback((conversation) => {
    setPresenceByUserId((current) => mergePresenceFromConversations(current, [conversation]));
    setConversations((current) => upsertConversation(current, conversation));

    if (!selectedConversationIdRef.current) {
      selectConversation(conversation.id, { openChatOnMobile: false });
    }
  }, [selectConversation]);

  const handleConversationRemoved = useCallback(({ conversationId }) => {
    const remainingConversations = conversationsRef.current.filter(
      (conversation) => conversation.id !== conversationId,
    );

    setConversations(remainingConversations);
    setMessagesByConversation((current) => {
      const nextMessages = { ...current };
      delete nextMessages[conversationId];
      return nextMessages;
    });

    if (selectedConversationIdRef.current === conversationId) {
      if (remainingConversations[0]) {
        selectConversation(remainingConversations[0].id, { openChatOnMobile: false });
      } else {
        setSelectedConversationId(null);
      }
    }
  }, [selectConversation]);

  const handleIncomingMessage = useCallback((message) => {
    setMessagesByConversation((current) => ({
      ...current,
      [message.conversationId]: upsertMessage(current[message.conversationId] || [], message),
    }));

    setMessageSearchResults((current) => (
      current.some((entry) => entry.id === message.id) ? current.map((entry) => (
        entry.id === message.id ? message : entry
      )) : current
    ));

    setConversations((current) => sortConversations(
      current.map((conversation) => (
        conversation.id === message.conversationId
          ? {
              ...conversation,
              lastMessage: message,
              unreadCount:
                message.sender.id !== user.id && selectedConversationIdRef.current !== message.conversationId
                  ? conversation.unreadCount + 1
                  : 0,
            }
          : conversation
      )),
    ));

    if (message.sender.id !== user.id) {
      const conversation = conversationsRef.current.find(
        (entry) => entry.id === message.conversationId,
      );
      const title = conversation?.type === "group"
        ? `${message.sender.name} in ${getConversationTitle(conversation, user)}`
        : message.sender.name;
      const shouldNotify =
        (typeof document !== "undefined" && document.hidden)
        || selectedConversationIdRef.current !== message.conversationId;
      const isMuted = getConversationPreference(
        conversationPreferencesRef.current,
        message.conversationId,
      ).muted;

      if (shouldNotify && !isMuted) {
        notify({
          title,
          body: formatInlinePreview(message),
          url: `/?conversationId=${message.conversationId}`,
          tag: `conversation-${message.conversationId}`,
        });
      }
    }

    if (message.sender.id !== user.id && selectedConversationIdRef.current === message.conversationId) {
      void markConversationAsRead(message.conversationId);
    }
  }, [notify, user]);

  const handleMessageUpdate = useCallback((message) => {
    setMessagesByConversation((current) => ({
      ...current,
      [message.conversationId]: upsertMessage(current[message.conversationId] || [], message),
    }));

    setMessageSearchResults((current) => current.map((entry) => (
      entry.id === message.id ? message : entry
    )));

    setConversations((current) => current.map((conversation) => (
      conversation.id === message.conversationId && conversation.lastMessage?.id === message.id
        ? {
            ...conversation,
            lastMessage: message,
          }
        : conversation
    )));

    setReplyTarget((current) => (current?.id === message.id ? message : current));

    if (editingMessageId === message.id) {
      setEditingMessageId(null);
      setEditingContent("");
    }
  }, [editingMessageId]);

  const handleTypingUpdate = useCallback(({ conversationId, userId, userName, isTyping }) => {
    if (userId === user.id) {
      return;
    }

    setTypingByConversation((current) => {
      const nextTyping = { ...current };
      const currentUsers = nextTyping[conversationId] ? [...nextTyping[conversationId]] : [];

      if (isTyping) {
        if (!currentUsers.some((typingUser) => typingUser.userId === userId)) {
          currentUsers.push({ userId, userName });
        }
      } else {
        const filteredUsers = currentUsers.filter((typingUser) => typingUser.userId !== userId);

        if (filteredUsers.length) {
          nextTyping[conversationId] = filteredUsers;
        } else {
          delete nextTyping[conversationId];
        }

        return nextTyping;
      }

      nextTyping[conversationId] = currentUsers;
      return nextTyping;
    });
  }, [user.id]);

  const handleMessageStatus = useCallback(({ conversationId, messageIds, status }) => {
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: updateMessageStatuses(current[conversationId] || [], messageIds, status),
    }));

    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId && messageIds.includes(conversation.lastMessage?.id)
        ? {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage,
              status,
            },
          }
        : conversation
    )));
  }, []);

  const socketErrorCountRef = useRef(0);

  const handleSocketError = useCallback((error) => {
    // Transport errors (websocket error, ECONNRESET, timeout) are transient —
    // Socket.io will reconnect automatically. Only show a toast for:
    //   • Auth errors (token rejected) — always show immediately
    //   • Persistent failures — after 3 consecutive attempts
    const message = error?.message || "";
    const isAuthError = message.toLowerCase().includes("auth") ||
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("invalid");

    if (isAuthError) {
      setStatusMessage("Connection refused: invalid session. Please sign in again.");
      return;
    }

    socketErrorCountRef.current += 1;
    if (socketErrorCountRef.current >= 3) {
      setStatusMessage("Unable to reach the server. Retrying in the background…");
    }
  }, []);

  // Reset error count on successful reconnect
  const handleSocketReconnect = useCallback(() => {
    socketErrorCountRef.current = 0;
    setStatusMessage("");
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    socket.on("presence:snapshot", handlePresenceSnapshot);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("conversation:upsert", handleConversationUpsert);
    socket.on("conversation:removed", handleConversationRemoved);
    socket.on("message:new", handleIncomingMessage);
    socket.on("message:update", handleMessageUpdate);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("message:status", handleMessageStatus);
    socket.on("connect_error", handleSocketError);

    return () => {
      socket.off("presence:snapshot", handlePresenceSnapshot);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("conversation:upsert", handleConversationUpsert);
      socket.off("conversation:removed", handleConversationRemoved);
      socket.off("message:new", handleIncomingMessage);
      socket.off("message:update", handleMessageUpdate);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("message:status", handleMessageStatus);
      socket.off("connect_error", handleSocketError);
    };
  }, [
    handleConversationRemoved,
    handleConversationUpsert,
    handleIncomingMessage,
    handleMessageStatus,
    handleMessageUpdate,
    handlePresenceSnapshot,
    handlePresenceUpdate,
    handleSocketError,
    handleTypingUpdate,
    socket,
  ]);

  useEffect(() => {
    if (!selectedConversationId) {
      return undefined;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      oldestMessageCursorRef.current = null;
      setHasMoreMessages(false);

      try {
        const data = await request(
          `/conversations/${selectedConversationId}/messages?limit=30`,
          { token },
        );

        if (cancelled) return;

        setMessagesByConversation((current) => ({
          ...current,
          [selectedConversationId]: data.messages,
        }));

        if (data.messages.length === 30) {
          oldestMessageCursorRef.current = data.messages[0]?.id || null;
          setHasMoreMessages(true);
        }

        await markConversationAsRead(selectedConversationId);
      } catch (error) {
        if (!cancelled) setStatusMessage(error.message);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadMessages();

    return () => { cancelled = true; };
  }, [selectedConversationId, token]);

  async function markConversationAsRead(conversationId) {
    try {
      await request(`/conversations/${conversationId}/read`, {
        method: "POST",
        token,
      });

      setConversations((current) => current.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )));
    } catch (_error) {
      return null;
    }

    return null;
  }

  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversationId || loadingMoreMessages || !hasMoreMessages) return;
    const cursor = oldestMessageCursorRef.current;
    if (!cursor) return;

    setLoadingMoreMessages(true);
    try {
      const data = await request(
        `/conversations/${selectedConversationId}/messages?limit=30&cursor=${cursor}`,
        { token },
      );

      if (data.messages.length > 0) {
        setMessagesByConversation((current) => ({
          ...current,
          [selectedConversationId]: [
            ...data.messages,
            ...(current[selectedConversationId] || []),
          ],
        }));
      }

      if (data.messages.length === 30) {
        oldestMessageCursorRef.current = data.messages[0]?.id || null;
        setHasMoreMessages(true);
      } else {
        oldestMessageCursorRef.current = null;
        setHasMoreMessages(false);
      }
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [selectedConversationId, loadingMoreMessages, hasMoreMessages, token]);

  const startDirectConversation = useCallback(async (targetUser) => {
    try {
      const data = await conversationApi.createDirect(targetUser.id, token);
      setSearchTerm("");
      setSearchResults([]);
      setConversationQuery("");
      setConversationFilter("all");
      setConversationView("inbox");
      selectConversation(data.conversation.id);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }, [selectConversation, token]);

  const createGroupConversation = useCallback(async (groupName) => {
    try {
      const data = await conversationApi.createGroup(groupName, selectedGroupUserIds, token);
      setShowGroupModal(false);
      setGroupSearchTerm("");
      setSelectedGroupUserIds([]);
      setConversationQuery("");
      setConversationFilter("all");
      setConversationView("inbox");
      selectConversation(data.conversation.id);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }, [selectConversation, selectedGroupUserIds, token]);

  const sendMessage = useCallback(async (conversationId, payload) => {
    if (sendingMessageRef.current) {
      return false;
    }

    sendingMessageRef.current = true;
    setSendingMessage(true);

    try {
      const message = await conversationOps.sendMessage(conversationId, payload);

      if (message) {
        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: upsertMessage(current[conversationId] || [], message),
        }));

        setConversations((current) => sortConversations(
          current.map((conversation) => (
            conversation.id === conversationId
              ? { ...conversation, lastMessage: message, unreadCount: 0 }
              : conversation
          )),
        ));

        return true;
      }

      return false;
    } catch (error) {
      setStatusMessage(error.message);
      return false;
    } finally {
      sendingMessageRef.current = false;
      setSendingMessage(false);
    }
  }, [conversationOps]);

  const handleAddReaction = useCallback(async (messageId, emoji) => {
    if (!selectedConversationId) return;
    try { await conversationApi.addReaction(selectedConversationId, messageId, emoji, token); }
    catch (error) { setStatusMessage(error.message); }
  }, [selectedConversationId, token]);

  const handleRemoveReaction = useCallback(async (messageId, emoji) => {
    if (!selectedConversationId) return;
    try { await conversationApi.removeReaction(selectedConversationId, messageId, emoji, token); }
    catch (error) { setStatusMessage(error.message); }
  }, [selectedConversationId, token]);

  const handlePollVote = useCallback(async (messageId, optionIds) => {
    if (!selectedConversationId) return;
    try { await conversationApi.castPollVote(selectedConversationId, messageId, optionIds, token); }
    catch (error) { setStatusMessage(error.message); }
  }, [selectedConversationId, token]);

  const handlePinMessage = useCallback(async (message, pin) => {
    if (!selectedConversationId) return;
    try { await conversationApi.pinMessage(selectedConversationId, message.id, pin, token); }
    catch (error) { setStatusMessage(error.message); }
  }, [selectedConversationId, token]);

  const handleToggleStar = useCallback((message) => {
    setStarredMessageIds((current) => {
      if (current.includes(message.id)) {
        return current.filter((id) => id !== message.id);
      }
      return [...current, message.id];
    });
  }, [setStarredMessageIds]);

  const handleForwardMessage = useCallback(async (message, conversationIds) => {
    await Promise.all(
      conversationIds.map((cid) =>
        sendMessage(cid, {
          content: message.content || "",
          // carry over file attachment if present
          ...(message.attachment && !message.isDeleted
            ? {
                messageType: message.messageType,
                fileName: message.attachment.name,
                fileUrl: message.attachment.url,
                fileSize: message.attachment.size,
                mimeType: message.attachment.mimeType,
              }
            : {}),
        }),
      ),
    );
  }, [sendMessage]);

  async function saveEditedMessage(messageId) {
    if (!selectedConversationId || !editingContent.trim()) {
      return;
    }

    try {
      const data = await request(`/conversations/${selectedConversationId}/messages/${messageId}`, {
        method: "PATCH",
        token,
        body: {
          content: editingContent.trim(),
        },
      });

      setMessagesByConversation((current) => ({
        ...current,
        [selectedConversationId]: upsertMessage(current[selectedConversationId] || [], data.message),
      }));
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function removeMessage(message) {
    if (!selectedConversationId) {
      return;
    }

    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const data = await request(`/conversations/${selectedConversationId}/messages/${message.id}`, {
        method: "DELETE",
        token,
      });

      setMessagesByConversation((current) => ({
        ...current,
        [selectedConversationId]: upsertMessage(current[selectedConversationId] || [], data.message),
      }));

      if (replyTarget?.id === message.id) {
        setReplyTarget(null);
      }
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function renameGroup(name) {
    if (!selectedConversationId) {
      return;
    }

    try {
      await request(`/conversations/${selectedConversationId}/group`, {
        method: "PATCH",
        token,
        body: { name },
      });
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function addGroupMembers(participantIds) {
    if (!selectedConversationId) {
      return false;
    }

    try {
      await request(`/conversations/${selectedConversationId}/group/participants`, {
        method: "POST",
        token,
        body: { participantIds },
      });
      return true;
    } catch (error) {
      setStatusMessage(error.message);
      return false;
    }
  }

  async function updateGroupRole(participantId, role) {
    if (!selectedConversationId) {
      return;
    }

    try {
      await request(`/conversations/${selectedConversationId}/group/participants/${participantId}`, {
        method: "PATCH",
        token,
        body: { role },
      });
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function removeGroupParticipant(participantId) {
    if (!selectedConversationId) {
      return;
    }

    if (!window.confirm("Remove this member from the group?")) {
      return;
    }

    try {
      await request(`/conversations/${selectedConversationId}/group/participants/${participantId}`, {
        method: "DELETE",
        token,
      });
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function enableNotifications() {
    try {
      const permission = await requestPermission();

      if (permission === "denied") {
        setStatusMessage("Notifications are blocked in this browser.");
      }
    } catch (error) {
      setStatusMessage(error.message || "Could not enable notifications.");
    }
  }

  function openSearchResult(message) {
    setMessagesByConversation((current) => ({
      ...current,
      [selectedConversationId]: upsertMessage(current[selectedConversationId] || [], message),
    }));
    setHighlightedMessageId(message.id);
    window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2600);
  }

  return (
    <>
      <main className={`app-shell ${isMobileLayout ? (mobilePane === "chat" ? "app-shell--chat-focus" : "app-shell--sidebar-focus") : ""}`}>
        <Sidebar
          currentUser={user}
          pinnedConversations={pinnedConversations}
          recentConversations={recentConversations}
          conversationStats={conversationStats}
          conversationOverview={conversationOverview}
          conversationView={conversationView}
          conversationQuery={conversationQuery}
          conversationFilter={conversationFilter}
          selectedConversationId={selectedConversationId}
          presenceByUserId={presenceByUserId}
          searchTerm={searchTerm}
          searchResults={searchResults}
          searchingUsers={searchingUsers}
          conversationPreferences={conversationPreferences}
          onConversationViewChange={setConversationView}
          onConversationQueryChange={setConversationQuery}
          onConversationFilterChange={setConversationFilter}
          onSearchTermChange={setSearchTerm}
          onSelectConversation={(conversation) => selectConversation(conversation.id)}
          onStartDirectConversation={startDirectConversation}
          onOpenGroupModal={() => {
            setShowGroupModal(true);
            setGroupSearchTerm("");
            setSelectedGroupUserIds([]);
          }}
          notificationsSupported={notificationsSupported}
          notificationPermission={notificationPermission}
          onEnableNotifications={enableNotifications}
          onTogglePinConversation={toggleConversationPin}
          onToggleMuteConversation={toggleConversationMute}
          onToggleArchiveConversation={toggleConversationArchived}
          onLogout={logout}
        />

        <section className="workspace-panel">
          {statusMessage ? (
            <StatusToast message={statusMessage} onDismiss={() => setStatusMessage("")} />
          ) : null}

          <ChatWindow
            currentUser={user}
            conversation={selectedConversation}
            conversationPreference={selectedConversationPreference}
            messages={messagesByConversation[selectedConversationId] || []}
            typingUsers={typingByConversation[selectedConversationId] || []}
            loadingMessages={loadingMessages}
            loadingMoreMessages={loadingMoreMessages}
            hasMoreMessages={hasMoreMessages}
            onLoadMoreMessages={loadMoreMessages}
            sendingMessage={sendingMessage}
            presenceByUserId={presenceByUserId}
            socket={socket}
            onSendMessage={sendMessage}
            searchPanelOpen={searchPanelOpen}
            searchQuery={messageSearchQuery}
            searchResults={messageSearchResults}
            searchingMessages={searchingMessages}
            onToggleSearchPanel={() => {
              setSearchPanelOpen((current) => {
                const next = !current;

                if (!next) {
                  setMessageSearchQuery("");
                  setMessageSearchResults([]);
                }

                return next;
              });
            }}
            onSearchQueryChange={setMessageSearchQuery}
            onSelectSearchMessage={openSearchResult}
            onClearSearch={() => {
              setMessageSearchQuery("");
              setMessageSearchResults([]);
            }}
            highlightedMessageId={highlightedMessageId}
            replyTarget={replyTarget}
            onReplyToMessage={(message) => {
              setReplyTarget(message);
              setEditingMessageId(null);
              setEditingContent("");
            }}
            onCancelReply={() => setReplyTarget(null)}
            editingMessageId={editingMessageId}
            editingContent={editingContent}
            onEditContentChange={setEditingContent}
            onStartEdit={(message) => {
              setReplyTarget(null);
              setEditingMessageId(message.id);
              setEditingContent(message.content || "");
            }}
            onCancelEdit={() => {
              setEditingMessageId(null);
              setEditingContent("");
            }}
            onSaveEdit={saveEditedMessage}
            onDeleteMessage={removeMessage}
            groupPanelOpen={groupPanelOpen}
            onToggleGroupPanel={() => setGroupPanelOpen((current) => !current)}
            groupSearchTerm={groupManagerSearchTerm}
            groupCandidates={groupManagerCandidates}
            loadingGroupCandidates={loadingGroupManagerCandidates}
            onGroupSearchTermChange={setGroupManagerSearchTerm}
            onRenameGroup={renameGroup}
            onAddGroupMembers={addGroupMembers}
            onUpdateGroupRole={updateGroupRole}
            onRemoveGroupParticipant={removeGroupParticipant}
            isMobileLayout={isMobileLayout}
            showBackButton={isMobileLayout && mobilePane === "chat"}
            onBackToList={() => setMobilePane("list")}
            onTogglePinConversation={() => toggleConversationPin(selectedConversation?.id)}
            onToggleMuteConversation={() => toggleConversationMute(selectedConversation?.id)}
            onToggleArchiveConversation={() => {
              if (selectedConversation?.id) {
                toggleConversationArchived(selectedConversation.id);
              }
            }}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            starredMessageIds={starredMessageIds}
            onToggleStar={handleToggleStar}
            onForwardMessage={(msg) => setForwardingMessage(msg)}
            onPollVote={handlePollVote}
            onPinMessage={handlePinMessage}
          />
        </section>
      </main>

      <CreateGroupModal
        open={showGroupModal}
        users={groupUsers}
        searchTerm={groupSearchTerm}
        selectedUserIds={selectedGroupUserIds}
        loading={loadingGroupUsers}
        onSearchTermChange={setGroupSearchTerm}
        onToggleUser={(userId) => {
          setSelectedGroupUserIds((current) => (
            current.includes(userId)
              ? current.filter((id) => id !== userId)
              : [...current, userId]
          ));
        }}
        onClose={() => {
          setShowGroupModal(false);
          setGroupSearchTerm("");
          setSelectedGroupUserIds([]);
        }}
        onCreateGroup={createGroupConversation}
      />

      <ForwardMessageModal
        message={forwardingMessage}
        conversations={conversations}
        currentUser={user}
        onForward={handleForwardMessage}
        onClose={() => setForwardingMessage(null)}
      />
    </>
  );
});
