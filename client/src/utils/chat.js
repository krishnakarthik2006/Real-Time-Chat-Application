export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function hashValue(input = "") {
  return Array.from(input).reduce((hash, character) => hash + character.charCodeAt(0), 0);
}

export function getAvatarBackground(seed = "") {
  const hue = hashValue(seed) % 360;
  return `linear-gradient(135deg, hsl(${hue} 72% 42%), hsl(${(hue + 42) % 360} 82% 58%))`;
}

export function getDirectPartner(conversation, currentUser) {
  return conversation?.participants?.find((participant) => participant.id !== currentUser?.id) || null;
}

export function getConversationTitle(conversation, currentUser) {
  if (!conversation) {
    return "";
  }

  if (conversation.type === "group") {
    return conversation.name;
  }

  return getDirectPartner(conversation, currentUser)?.name || "New Chat";
}

export function getConversationStatus(conversation, currentUser, presenceByUserId) {
  if (!conversation) {
    return "";
  }

  if (conversation.type === "group") {
    const onlineCount = conversation.participants.filter(
      (participant) => participant.id !== currentUser?.id && presenceByUserId[participant.id]?.isOnline,
    ).length;

    return onlineCount
      ? `${conversation.participants.length} members | ${onlineCount} online`
      : `${conversation.participants.length} members`;
  }

  const partner = getDirectPartner(conversation, currentUser);

  if (!partner) {
    return "Private conversation";
  }

  if (presenceByUserId[partner.id]?.isOnline) {
    return "Online";
  }

  if (presenceByUserId[partner.id]?.lastSeen) {
    return `Last seen ${formatRelativeTime(presenceByUserId[partner.id].lastSeen)}`;
  }

  return "Offline";
}

export function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const now = new Date();
  const target = new Date(value);
  const diffInMinutes = Math.max(0, Math.round((now - target) / 60000));

  if (diffInMinutes < 1) {
    return "just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);

  if (diffInDays <= 7) {
    return `${diffInDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(target);
}

export function isSameDay(leftValue, rightValue) {
  if (!leftValue || !rightValue) {
    return false;
  }

  const left = new Date(leftValue);
  const right = new Date(rightValue);

  return left.toDateString() === right.toDateString();
}

export function formatListTime(value) {
  if (!value) {
    return "";
  }

  const target = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(target, now)) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(target);
  }

  if (isSameDay(target, yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(target);
}

export function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDayDivider(value) {
  if (!value) {
    return "";
  }

  const target = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(target, now)) {
    return "Today";
  }

  if (isSameDay(target, yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(target);
}

function getAttachmentPreviewLabel(message) {
  const mimeType = message?.attachment?.mimeType || "";

  if (mimeType.startsWith("image/")) {
    return "Photo";
  }

  if (mimeType.startsWith("video/")) {
    return "Video";
  }

  if (mimeType.startsWith("audio/")) {
    return "Audio";
  }

  return message?.attachment?.name || "File";
}

export function formatMessagePreview(message, currentUser) {
  if (!message) {
    return "No messages yet. Start the conversation.";
  }

  const prefix = message.sender?.id === currentUser?.id ? "You: " : "";

  if (message.isDeleted) {
    return `${prefix}This message was deleted`;
  }

  if (message.messageType === "file" && !message.content) {
    return `${prefix}${getAttachmentPreviewLabel(message)}`;
  }

  return `${prefix}${message.content || getAttachmentPreviewLabel(message)}`;
}

export function formatInlinePreview(message) {
  if (!message) {
    return "";
  }

  if (message.isDeleted) {
    return "This message was deleted";
  }

  if (message.messageType === "file" && !message.content) {
    return getAttachmentPreviewLabel(message);
  }

  return message.content || message.attachment?.name || "Message";
}

export function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    const leftDate = left.lastMessage?.createdAt || left.updatedAt || left.createdAt;
    const rightDate = right.lastMessage?.createdAt || right.updatedAt || right.createdAt;

    return new Date(rightDate) - new Date(leftDate);
  });
}

export function upsertConversation(conversations, incomingConversation) {
  const existingIndex = conversations.findIndex(
    (conversation) => conversation.id === incomingConversation.id,
  );

  if (existingIndex === -1) {
    return sortConversations([incomingConversation, ...conversations]);
  }

  const nextConversations = [...conversations];
  nextConversations[existingIndex] = {
    ...nextConversations[existingIndex],
    ...incomingConversation,
  };

  return sortConversations(nextConversations);
}

export function upsertMessage(messages, incomingMessage) {
  const existingIndex = messages.findIndex((message) => message.id === incomingMessage.id);

  if (existingIndex === -1) {
    return [...messages, incomingMessage].sort((left, right) => {
      const leftDate = left.createdAt || 0;
      const rightDate = right.createdAt || 0;

      return new Date(leftDate) - new Date(rightDate);
    });
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...incomingMessage,
  };

  return nextMessages;
}

export function updateMessageStatuses(messages, messageIds, status) {
  if (!messageIds.length) {
    return messages;
  }

  const idSet = new Set(messageIds);

  return messages.map((message) => (
    idSet.has(message.id)
      ? {
          ...message,
          status,
        }
      : message
  ));
}

export function formatFileSize(size) {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** Alias for formatRelativeTime — used in profile panels */
export function formatLastSeen(value) {
  return formatRelativeTime(value);
}
