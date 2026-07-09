const asyncHandler = require("../utils/async-handler");
const { parseWithSchema } = require("../utils/validation");
const {
  searchUsersQuerySchema,
  directConversationSchema,
  groupConversationSchema,
  messageQuerySchema,
  searchMessagesQuerySchema,
  messageSchema,
  editMessageSchema,
  renameGroupSchema,
  addGroupParticipantsSchema,
  updateGroupRoleSchema,
  reactionSchema,
  pollVoteSchema,
  pinMessageSchema,
  nicknameSchema,
  announcementSchema,
} = require("../validators/chat.schemas");
const {
  searchUsers,
  getConversationsForUser,
  getConversationForUser,
  createOrGetDirectConversation,
  createGroupConversation,
  getMessagesForConversation,
  searchMessagesInConversation,
  createMessage,
  updateMessage,
  deleteMessage,
  renameGroupConversation,
  addGroupParticipants,
  updateGroupParticipantRole,
  removeGroupParticipant,
  markConversationAsRead,
  addReactionToMessage,
  removeReactionFromMessage,
  getConversationParticipantIds: getConversationParticipantIdsFromService,
  voteOnPoll,
  pinMessage,
  setNickname,
  setAnnouncementMode,
  getPinnedMessages,
  getSharedMedia,
} = require("../services/chat.service");
const { userRoom, conversationRoom } = require("../services/presence.service");

async function emitConversationUpsert(io, conversationId, participantIds) {
  if (!conversationId || !participantIds?.length) {
    return;
  }

  await Promise.all(
    participantIds.map(async (participantId) => {
      const personalizedConversation = await getConversationForUser(conversationId, participantId);

      if (personalizedConversation) {
        io.to(userRoom(participantId)).emit("conversation:upsert", personalizedConversation);
      }
    }),
  );
}

async function emitConversationUpsertById(io, conversationId, actorUserId) {
  const actorConversation = await getConversationForUser(conversationId, actorUserId);

  if (!actorConversation) {
    return;
  }

  await emitConversationUpsert(
    io,
    conversationId,
    actorConversation.participants.map((participant) => participant.id),
  );
}

const listUsers = asyncHandler(async (req, res) => {
  const query = parseWithSchema(searchUsersQuerySchema, req.query);
  const users = await searchUsers(req.user.id, query.q);

  res.json({ users });
});

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await getConversationsForUser(req.user.id);

  res.json({ conversations });
});

const createDirect = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(directConversationSchema, req.body);
  const conversation = await createOrGetDirectConversation(req.user.id, payload.recipientId);

  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.status(201).json({ conversation });
});

const createGroup = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(groupConversationSchema, req.body);
  const conversation = await createGroupConversation(req.user.id, payload.name, payload.participantIds);

  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.status(201).json({ conversation });
});

const listMessages = asyncHandler(async (req, res) => {
  const query = parseWithSchema(messageQuerySchema, req.query);
  const { conversationId } = req.params;
  const messages = await getMessagesForConversation(req.user.id, conversationId, query);

  res.json({ messages });
});

const searchMessages = asyncHandler(async (req, res) => {
  const query = parseWithSchema(searchMessagesQuerySchema, req.query);
  const { conversationId } = req.params;
  const messages = await searchMessagesInConversation(req.user.id, conversationId, query.q, query.limit);

  res.json({ messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(messageSchema, req.body);
  const { conversationId } = req.params;
  const { message, participantIds } = await createMessage(req.user.id, conversationId, payload);

  participantIds.forEach((participantId) => {
    req.io.to(userRoom(participantId)).emit("message:new", message);
  });

  await emitConversationUpsertById(req.io, conversationId, req.user.id);

  res.status(201).json({ message });
});

const editMessage = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(editMessageSchema, req.body);
  const { conversationId, messageId } = req.params;
  const { message, participantIds } = await updateMessage(
    req.user.id,
    conversationId,
    messageId,
    payload.content,
  );

  participantIds.forEach((participantId) => {
    req.io.to(userRoom(participantId)).emit("message:update", message);
  });

  await emitConversationUpsertById(req.io, conversationId, req.user.id);

  res.json({ message });
});

const removeMessage = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.params;
  const { message, participantIds } = await deleteMessage(req.user.id, conversationId, messageId);

  participantIds.forEach((participantId) => {
    req.io.to(userRoom(participantId)).emit("message:update", message);
  });

  await emitConversationUpsertById(req.io, conversationId, req.user.id);

  res.json({ message });
});

const renameGroup = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(renameGroupSchema, req.body);
  const { conversationId } = req.params;
  const conversation = await renameGroupConversation(req.user.id, conversationId, payload.name);

  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.json({ conversation });
});

const addParticipants = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(addGroupParticipantsSchema, req.body);
  const { conversationId } = req.params;
  const conversation = await addGroupParticipants(req.user.id, conversationId, payload.participantIds);

  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.json({ conversation });
});

const updateParticipantRole = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(updateGroupRoleSchema, req.body);
  const { conversationId, participantId } = req.params;
  const conversation = await updateGroupParticipantRole(
    req.user.id,
    conversationId,
    participantId,
    payload.role,
  );

  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.json({ conversation });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { conversationId, participantId } = req.params;
  const { conversation, removedUserId } = await removeGroupParticipant(
    req.user.id,
    conversationId,
    participantId,
  );

  req.io.to(userRoom(removedUserId)).emit("conversation:removed", {
    conversationId,
  });
  req.io.in(userRoom(removedUserId)).socketsLeave(conversationRoom(conversationId));
  await emitConversationUpsert(
    req.io,
    conversation.id,
    conversation.participants.map((participant) => participant.id),
  );

  res.json({ conversation, removedUserId });
});

const markRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { participantIds, seenMessageIds } = await markConversationAsRead(req.user.id, conversationId);

  if (seenMessageIds.length) {
    participantIds.forEach((participantId) => {
      req.io.to(userRoom(participantId)).emit("message:status", {
        conversationId,
        messageIds: seenMessageIds,
        status: "seen",
      });
    });
  }

  res.json({
    conversationId,
    seenMessageIds,
  });
});

const addReaction = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(reactionSchema, req.body);
  const { conversationId, messageId } = req.params;
  const message = await addReactionToMessage(req.user.id, conversationId, messageId, payload.emoji);

  const allParticipantIds = await getConversationParticipantIdsFromService(conversationId);
  allParticipantIds.forEach((participantId) => {
    req.io.to(userRoom(participantId)).emit("message:update", message);
  });

  res.json({ message });
});

const removeReaction = asyncHandler(async (req, res) => {
  const { conversationId, messageId, emoji } = req.params;
  const message = await removeReactionFromMessage(req.user.id, conversationId, messageId, decodeURIComponent(emoji));

  const allParticipantIds = await getConversationParticipantIdsFromService(conversationId);
  allParticipantIds.forEach((participantId) => {
    req.io.to(userRoom(participantId)).emit("message:update", message);
  });

  res.json({ message });
});

/* ── Poll vote ──────────────────────────────────────────────── */
const castPollVote = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(pollVoteSchema, req.body);
  const { conversationId, messageId } = req.params;
  const message = await voteOnPoll(req.user.id, conversationId, messageId, payload.optionIds);

  const allParticipantIds = await getConversationParticipantIdsFromService(conversationId);
  allParticipantIds.forEach((pid) => req.io.to(userRoom(pid)).emit("message:update", message));

  res.json({ message });
});

/* ── Pin message ────────────────────────────────────────────── */
const pinMsg = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.params;
  const { pin } = req.body; // true/false
  const conversation = await pinMessage(req.user.id, conversationId, messageId, Boolean(pin));

  await emitConversationUpsert(
    req.io, conversation.id,
    conversation.participants.map((p) => p.id),
  );
  const allParticipantIds = await getConversationParticipantIdsFromService(conversationId);
  allParticipantIds.forEach((pid) => req.io.to(userRoom(pid)).emit("message:pinned", { conversationId, messageId, pin: Boolean(pin) }));

  res.json({ conversation });
});

/* ── Get pinned messages ────────────────────────────────────── */
const listPinnedMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await getPinnedMessages(req.user.id, conversationId);
  res.json({ messages });
});

/* ── Nickname ───────────────────────────────────────────────── */
const updateNickname = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(nicknameSchema, req.body);
  const { conversationId } = req.params;
  const conversation = await setNickname(req.user.id, conversationId, payload.userId, payload.nickname);

  await emitConversationUpsert(
    req.io, conversation.id,
    conversation.participants.map((p) => p.id),
  );
  res.json({ conversation });
});

/* ── Announcement mode ──────────────────────────────────────── */
const setAnnouncement = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(announcementSchema, req.body);
  const { conversationId } = req.params;
  const conversation = await setAnnouncementMode(req.user.id, conversationId, payload.isAnnouncement);

  await emitConversationUpsert(
    req.io, conversation.id,
    conversation.participants.map((p) => p.id),
  );
  res.json({ conversation });
});

/* ── Shared media ───────────────────────────────────────────── */
const listSharedMedia = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { type = "images" } = req.query;
  const messages = await getSharedMedia(req.user.id, conversationId, type);
  res.json({ messages });
});

module.exports = {
  listUsers,
  listConversations,
  createDirect,
  createGroup,
  listMessages,
  searchMessages,
  sendMessage,
  editMessage,
  removeMessage,
  renameGroup,
  addParticipants,
  updateParticipantRole,
  removeParticipant,
  markRead,
  addReaction,
  removeReaction,
  castPollVote,
  pinMsg,
  listPinnedMessages,
  updateNickname,
  setAnnouncement,
  listSharedMedia,
};
