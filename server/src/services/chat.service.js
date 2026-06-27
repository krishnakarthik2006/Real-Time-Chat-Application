const mongoose = require("mongoose");
const { Conversation, Message, User } = require("../models/chat.models");
const { sanitizeUser } = require("../utils/auth");
const AppError = require("../utils/app-error");
const { presenceService } = require("./presence.service");

const userPublicFields = "name email avatarSeed lastSeen createdAt";

function normalizeId(value) {
  return value?._id ? String(value._id) : String(value);
}

function ensureObjectId(value, label = "Resource") {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${label} not found.`, 404);
  }

  return new mongoose.Types.ObjectId(value);
}

function toObjectId(value, label = "Resource") {
  return ensureObjectId(normalizeId(value), label);
}

function isSameId(left, right) {
  return normalizeId(left) === normalizeId(right);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapAttachment(message) {
  if (!message?.fileUrl) {
    return null;
  }

  return {
    name: message.fileName,
    url: message.fileUrl,
    size: message.fileSize,
    mimeType: message.mimeType,
  };
}

function mapMessageSender(sender) {
  if (!sender) {
    return null;
  }

  if (sender.name) {
    return sanitizeUser(sender);
  }

  return {
    id: normalizeId(sender),
    name: "",
    email: "",
    avatarSeed: "",
    lastSeen: null,
    createdAt: null,
  };
}

function mapReplyMessage(message) {
  if (!message) {
    return null;
  }

  const isDeleted = Boolean(message.isDeleted);

  return {
    id: normalizeId(message),
    content: isDeleted ? "" : message.content || "",
    messageType: message.messageType || "text",
    isDeleted,
    attachment: isDeleted ? null : mapAttachment(message),
    sender: mapMessageSender(message.sender),
  };
}

function mapMessageDoc(message) {
  const isDeleted = Boolean(message.isDeleted);

  return {
    id: normalizeId(message),
    conversationId: normalizeId(message.conversation),
    sender: mapMessageSender(message.sender),
    content: isDeleted ? "" : message.content || "",
    messageType: message.messageType,
    attachment: isDeleted ? null : mapAttachment(message),
    status: message.status,
    replyTo: mapReplyMessage(message.replyToMessage),
    isDeleted,
    deletedAt: message.deletedAt,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
  };
}

function mapLastMessage(message) {
  if (!message) {
    return null;
  }

  const isDeleted = Boolean(message.isDeleted);

  return {
    id: normalizeId(message),
    content: isDeleted ? "" : message.content || "",
    messageType: message.messageType,
    status: message.status,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    isDeleted,
    attachment: isDeleted ? null : mapAttachment(message),
    sender: mapMessageSender(message.sender),
  };
}

function mapParticipant(participant) {
  const user = participant.user;

  return {
    ...sanitizeUser(user),
    role: participant.role,
    lastSeen: user?.lastSeen ?? null,
    lastReadMessageId: participant.lastReadMessage ? normalizeId(participant.lastReadMessage) : null,
  };
}

function mapConversation(conversation, lastMessage, unreadCount) {
  return {
    id: normalizeId(conversation),
    name: conversation.name,
    type: conversation.type,
    createdBy: conversation.createdBy ? normalizeId(conversation.createdBy) : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    unreadCount,
    participants: [...conversation.participants]
      .map(mapParticipant)
      .sort((left, right) => left.name.localeCompare(right.name)),
    lastMessage: mapLastMessage(lastMessage),
  };
}

function populateMessageQuery(query) {
  return query
    .populate("sender", userPublicFields)
    .populate({
      path: "replyToMessage",
      populate: {
        path: "sender",
        select: userPublicFields,
      },
    });
}

function participantMatchesUser(participant, userId) {
  return isSameId(participant.user?._id || participant.user, userId);
}

function getParticipant(conversation, userId) {
  return conversation.participants.find((participant) => participantMatchesUser(participant, userId)) || null;
}

async function findUserByEmail(email) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (user) {
    user.id = String(user._id);
  }
  return user;
}

async function findUserById(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  const user = await User.findById(userId).lean();
  if (user) {
    user.id = String(user._id);
  }
  return user;
}

async function createUser({ name, email, passwordHash, avatarSeed, authProvider = "local" }) {
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    authProvider,
    avatarSeed,
  });

  const obj = user.toObject();
  obj.id = String(obj._id);
  return obj;
}

async function searchUsers(currentUserId, search) {
  const filters = {
    _id: {
      $ne: toObjectId(currentUserId, "User"),
    },
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegExp(search), "i");
    filters.$or = [
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  const users = await User.find(filters)
    .sort({ name: 1 })
    .limit(20)
    .lean();

  return users.map(sanitizeUser);
}

async function getConversationMembership(conversationId, userId) {
  const conversation = await Conversation.findOne({
    _id: toObjectId(conversationId, "Conversation"),
    "participants.user": toObjectId(userId, "User"),
  }).lean();

  if (!conversation) {
    return null;
  }

  const participant = getParticipant(conversation, userId);

  return {
    id: normalizeId(conversation),
    name: conversation.name,
    type: conversation.type,
    createdBy: conversation.createdBy ? normalizeId(conversation.createdBy) : null,
    role: participant?.role || "member",
  };
}

async function isConversationParticipant(conversationId, userId) {
  return getConversationMembership(conversationId, userId);
}

async function requireConversationMembership(conversationId, userId) {
  const membership = await getConversationMembership(conversationId, userId);

  if (!membership) {
    throw new AppError("Conversation not found.", 404);
  }

  return membership;
}

async function requireGroupAdmin(conversationId, userId) {
  const membership = await requireConversationMembership(conversationId, userId);

  if (membership.type !== "group") {
    throw new AppError("This action is only available for group conversations.", 400);
  }

  if (membership.role !== "admin") {
    throw new AppError("Only group admins can perform this action.", 403);
  }

  return membership;
}

async function getConversationParticipantIds(conversationId) {
  const conversation = await Conversation.findById(toObjectId(conversationId, "Conversation"))
    .select("participants.user")
    .lean();

  return conversation?.participants.map((participant) => normalizeId(participant.user)) || [];
}

async function getUnreadCount(userId, conversation) {
  const participant = getParticipant(conversation, userId);
  const filters = {
    conversation: conversation._id,
    sender: {
      $ne: toObjectId(userId, "User"),
    },
  };

  if (participant?.lastReadMessage) {
    filters._id = {
      $gt: participant.lastReadMessage,
    };
  }

  return Message.countDocuments(filters);
}

async function getConversationLastMessage(conversationId) {
  return populateMessageQuery(
    Message.findOne({ conversation: conversationId }).sort({ _id: -1 }),
  ).lean();
}

async function mapConversationForUser(userId, conversation) {
  const [lastMessage, unreadCount] = await Promise.all([
    getConversationLastMessage(conversation._id),
    getUnreadCount(userId, conversation),
  ]);

  return mapConversation(conversation, lastMessage, unreadCount);
}

async function getConversationsForUser(userId) {
  const conversations = await Conversation.find({
    "participants.user": toObjectId(userId, "User"),
  })
    .populate("participants.user", userPublicFields)
    .sort({ updatedAt: -1 })
    .lean();

  const mappedConversations = await Promise.all(
    conversations.map((conversation) => mapConversationForUser(userId, conversation)),
  );

  return mappedConversations.sort((left, right) => {
    const leftDate = left.lastMessage?.createdAt || left.updatedAt || left.createdAt;
    const rightDate = right.lastMessage?.createdAt || right.updatedAt || right.createdAt;

    return new Date(rightDate) - new Date(leftDate);
  });
}

async function getConversationForUser(conversationId, userId) {
  const conversation = await Conversation.findOne({
    _id: toObjectId(conversationId, "Conversation"),
    "participants.user": toObjectId(userId, "User"),
  })
    .populate("participants.user", userPublicFields)
    .lean();

  return conversation ? mapConversationForUser(userId, conversation) : null;
}

async function createOrGetDirectConversation(currentUserId, recipientId) {
  if (isSameId(currentUserId, recipientId)) {
    throw new AppError("You cannot start a direct conversation with yourself.", 400);
  }

  const currentUserObjectId = toObjectId(currentUserId, "User");
  const recipientObjectId = toObjectId(recipientId, "Recipient");
  const recipient = await User.findById(recipientObjectId).lean();

  if (!recipient) {
    throw new AppError("Recipient not found.", 404);
  }

  let conversation = await Conversation.findOne({
    type: "direct",
    "participants.user": {
      $all: [currentUserObjectId, recipientObjectId],
    },
    participants: {
      $size: 2,
    },
  }).lean();

  if (!conversation) {
    conversation = await Conversation.create({
      name: null,
      type: "direct",
      createdBy: currentUserObjectId,
      participants: [
        {
          user: currentUserObjectId,
          role: "admin",
        },
        {
          user: recipientObjectId,
          role: "member",
        },
      ],
    });
  }

  return getConversationForUser(normalizeId(conversation), currentUserId);
}

async function createGroupConversation(currentUserId, name, participantIds) {
  const uniqueParticipantIds = Array.from(
    new Set([currentUserId, ...participantIds].map(normalizeId).filter(Boolean)),
  );
  const participantObjectIds = uniqueParticipantIds.map((participantId) => toObjectId(participantId, "User"));
  const existingUserCount = await User.countDocuments({
    _id: {
      $in: participantObjectIds,
    },
  });

  if (existingUserCount !== participantObjectIds.length) {
    throw new AppError("One or more selected participants do not exist.", 404);
  }

  const currentUserIdString = normalizeId(currentUserId);
  const conversation = await Conversation.create({
    name,
    type: "group",
    createdBy: toObjectId(currentUserId, "User"),
    participants: uniqueParticipantIds.map((participantId) => ({
      user: toObjectId(participantId, "User"),
      role: participantId === currentUserIdString ? "admin" : "member",
    })),
  });

  return getConversationForUser(normalizeId(conversation), currentUserId);
}

async function renameGroupConversation(currentUserId, conversationId, name) {
  await requireGroupAdmin(conversationId, currentUserId);

  await Conversation.findByIdAndUpdate(toObjectId(conversationId, "Conversation"), {
    $set: {
      name,
    },
  });

  return getConversationForUser(conversationId, currentUserId);
}

async function addGroupParticipants(currentUserId, conversationId, participantIds) {
  await requireGroupAdmin(conversationId, currentUserId);

  const uniqueParticipantIds = Array.from(new Set(participantIds.map(normalizeId).filter(Boolean)));
  const participantObjectIds = uniqueParticipantIds.map((participantId) => toObjectId(participantId, "User"));
  const existingUserCount = await User.countDocuments({
    _id: {
      $in: participantObjectIds,
    },
  });

  if (existingUserCount !== participantObjectIds.length) {
    throw new AppError("One or more selected people do not exist.", 404);
  }

  const conversation = await Conversation.findById(toObjectId(conversationId, "Conversation"));
  const currentParticipantIds = new Set(
    conversation.participants.map((participant) => normalizeId(participant.user)),
  );
  const newParticipantIds = uniqueParticipantIds.filter(
    (participantId) => !currentParticipantIds.has(participantId),
  );

  if (newParticipantIds.length) {
    newParticipantIds.forEach((participantId) => {
      conversation.participants.push({
        user: toObjectId(participantId, "User"),
        role: "member",
      });
    });
    await conversation.save();
  } else {
    conversation.updatedAt = new Date();
    await conversation.save();
  }

  return getConversationForUser(conversationId, currentUserId);
}

async function updateGroupParticipantRole(currentUserId, conversationId, participantId, role) {
  await requireGroupAdmin(conversationId, currentUserId);

  const conversation = await Conversation.findById(toObjectId(conversationId, "Conversation"));
  const participant = conversation.participants.find((entry) => participantMatchesUser(entry, participantId));

  if (!participant) {
    throw new AppError("Group member not found.", 404);
  }

  if (participant.role === role) {
    return getConversationForUser(conversationId, currentUserId);
  }

  if (participant.role === "admin" && role === "member") {
    const adminCount = conversation.participants.filter((entry) => entry.role === "admin").length;

    if (adminCount <= 1) {
      throw new AppError("A group must always have at least one admin.", 400);
    }
  }

  participant.role = role;
  await conversation.save();

  return getConversationForUser(conversationId, currentUserId);
}

async function removeGroupParticipant(currentUserId, conversationId, participantId) {
  await requireGroupAdmin(conversationId, currentUserId);

  if (isSameId(participantId, currentUserId)) {
    throw new AppError("Self-removal is not supported from admin controls.", 400);
  }

  const conversation = await Conversation.findById(toObjectId(conversationId, "Conversation"));
  const participant = conversation.participants.find((entry) => participantMatchesUser(entry, participantId));

  if (!participant) {
    throw new AppError("Group member not found.", 404);
  }

  if (participant.role === "admin") {
    const adminCount = conversation.participants.filter((entry) => entry.role === "admin").length;

    if (adminCount <= 1) {
      throw new AppError("You cannot remove the last admin from a group.", 400);
    }
  }

  conversation.participants = conversation.participants.filter(
    (entry) => !participantMatchesUser(entry, participantId),
  );
  await conversation.save();

  return {
    conversation: await getConversationForUser(conversationId, currentUserId),
    removedUserId: normalizeId(participantId),
  };
}

async function getMessagesForConversation(userId, conversationId, { cursor, limit }) {
  await requireConversationMembership(conversationId, userId);

  const filters = {
    conversation: toObjectId(conversationId, "Conversation"),
  };

  if (cursor) {
    filters._id = {
      $lt: toObjectId(cursor, "Message"),
    };
  }

  const messages = await populateMessageQuery(
    Message.find(filters).sort({ _id: -1 }).limit(limit),
  ).lean();

  return messages.reverse().map(mapMessageDoc);
}

async function getMessageById(messageId) {
  if (!mongoose.isValidObjectId(messageId)) {
    return null;
  }

  const message = await populateMessageQuery(Message.findById(messageId)).lean();
  return message ? mapMessageDoc(message) : null;
}

async function searchMessagesInConversation(userId, conversationId, search, limit) {
  await requireConversationMembership(conversationId, userId);

  const searchRegex = new RegExp(escapeRegExp(search), "i");
  const messages = await populateMessageQuery(
    Message.find({
      conversation: toObjectId(conversationId, "Conversation"),
      isDeleted: false,
      $or: [
        { content: searchRegex },
        { fileName: searchRegex },
      ],
    })
      .sort({ _id: -1 })
      .limit(limit),
  ).lean();

  return messages.map(mapMessageDoc);
}

async function createMessage(userId, conversationId, payload) {
  await requireConversationMembership(conversationId, userId);

  const conversationObjectId = toObjectId(conversationId, "Conversation");
  const userObjectId = toObjectId(userId, "User");

  if (payload.replyToMessageId) {
    const replyTarget = await Message.findOne({
      _id: toObjectId(payload.replyToMessageId, "Message"),
      conversation: conversationObjectId,
    }).lean();

    if (!replyTarget) {
      throw new AppError("The message you are replying to no longer exists.", 404);
    }
  }

  const participantIds = await getConversationParticipantIds(conversationId);
  const recipientIds = participantIds.filter((participantId) => !isSameId(participantId, userId));
  const initialStatus =
    recipientIds.length && recipientIds.every((participantId) => presenceService.isOnline(participantId))
      ? "delivered"
      : "sent";

  const message = await Message.create({
    conversation: conversationObjectId,
    sender: userObjectId,
    content: payload.content || "",
    messageType: payload.messageType,
    fileName: payload.fileName || null,
    fileUrl: payload.fileUrl || null,
    fileSize: payload.fileSize || null,
    mimeType: payload.mimeType || null,
    status: initialStatus,
    replyToMessage: payload.replyToMessageId ? toObjectId(payload.replyToMessageId, "Message") : null,
  });

  await Conversation.findByIdAndUpdate(conversationObjectId, {
    $set: {
      updatedAt: new Date(),
    },
  });

  return {
    message: await getMessageById(normalizeId(message)),
    participantIds,
  };
}

async function updateMessage(userId, conversationId, messageId, content) {
  await requireConversationMembership(conversationId, userId);

  const message = await Message.findOne({
    _id: toObjectId(messageId, "Message"),
    conversation: toObjectId(conversationId, "Conversation"),
  }).lean();

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  if (!isSameId(message.sender, userId)) {
    throw new AppError("You can only edit your own messages.", 403);
  }

  if (message.isDeleted) {
    throw new AppError("Deleted messages cannot be edited.", 400);
  }

  await Message.findByIdAndUpdate(messageId, {
    $set: {
      content,
      editedAt: new Date(),
    },
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      updatedAt: new Date(),
    },
  });

  return {
    message: await getMessageById(messageId),
    participantIds: await getConversationParticipantIds(conversationId),
  };
}

async function deleteMessage(userId, conversationId, messageId) {
  await requireConversationMembership(conversationId, userId);

  const message = await Message.findOne({
    _id: toObjectId(messageId, "Message"),
    conversation: toObjectId(conversationId, "Conversation"),
  }).lean();

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  if (!isSameId(message.sender, userId)) {
    throw new AppError("You can only delete your own messages.", 403);
  }

  if (message.isDeleted) {
    throw new AppError("Message has already been deleted.", 400);
  }

  await Message.findByIdAndUpdate(messageId, {
    $set: {
      content: "",
      fileName: null,
      fileUrl: null,
      fileSize: null,
      mimeType: null,
      isDeleted: true,
      deletedAt: new Date(),
      editedAt: null,
    },
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      updatedAt: new Date(),
    },
  });

  return {
    message: await getMessageById(messageId),
    participantIds: await getConversationParticipantIds(conversationId),
  };
}

async function markConversationAsRead(userId, conversationId) {
  await requireConversationMembership(conversationId, userId);

  const conversation = await Conversation.findById(toObjectId(conversationId, "Conversation"));
  const participant = getParticipant(conversation, userId);
  const participantIds = conversation.participants.map((entry) => normalizeId(entry.user));
  const latestIncomingMessage = await Message.findOne({
    conversation: conversation._id,
    sender: {
      $ne: toObjectId(userId, "User"),
    },
  }).sort({ _id: -1 });

  if (latestIncomingMessage) {
    participant.lastReadMessage = latestIncomingMessage._id;
    conversation.markModified("participants");
    await conversation.save();
  }

  const pendingMessages = await Message.find({
    conversation: conversation._id,
    status: {
      $ne: "seen",
    },
  }).lean();
  const seenMessageIds = pendingMessages
    .filter((message) => {
      const recipients = conversation.participants.filter(
        (entry) => !isSameId(entry.user, message.sender),
      );

      return recipients.every((entry) => (
        entry.lastReadMessage && normalizeId(entry.lastReadMessage) >= normalizeId(message)
      ));
    })
    .map((message) => normalizeId(message));

  if (seenMessageIds.length) {
    await Message.updateMany(
      {
        _id: {
          $in: seenMessageIds.map((messageId) => toObjectId(messageId, "Message")),
        },
      },
      {
        $set: {
          status: "seen",
        },
      },
    );
  }

  return {
    participantIds,
    seenMessageIds,
  };
}

async function markPendingDirectMessagesDelivered(userId) {
  const conversations = await Conversation.find({
    type: "direct",
    "participants.user": toObjectId(userId, "User"),
  })
    .select("_id")
    .lean();
  const conversationIds = conversations.map((conversation) => conversation._id);

  if (!conversationIds.length) {
    return [];
  }

  const messages = await Message.find({
    conversation: {
      $in: conversationIds,
    },
    sender: {
      $ne: toObjectId(userId, "User"),
    },
    status: "sent",
  })
    .select("_id sender conversation")
    .lean();

  if (!messages.length) {
    return [];
  }

  await Message.updateMany(
    {
      _id: {
        $in: messages.map((message) => message._id),
      },
    },
    {
      $set: {
        status: "delivered",
      },
    },
  );

  return messages.map((message) => ({
    id: normalizeId(message),
    senderId: normalizeId(message.sender),
    conversationId: normalizeId(message.conversation),
  }));
}

async function updateUserLastSeen(userId) {
  await User.findByIdAndUpdate(toObjectId(userId, "User"), {
    $set: {
      lastSeen: new Date(),
    },
  });
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  searchUsers,
  getConversationsForUser,
  getConversationForUser,
  createOrGetDirectConversation,
  createGroupConversation,
  renameGroupConversation,
  addGroupParticipants,
  updateGroupParticipantRole,
  removeGroupParticipant,
  getMessagesForConversation,
  searchMessagesInConversation,
  createMessage,
  updateMessage,
  deleteMessage,
  markConversationAsRead,
  isConversationParticipant,
  markPendingDirectMessagesDelivered,
  updateUserLastSeen,
};
