const express = require("express");
const {
  listConversations, createDirect, createGroup,
  listMessages, searchMessages, sendMessage, editMessage, removeMessage,
  renameGroup, addParticipants, updateParticipantRole, removeParticipant,
  markRead, addReaction, removeReaction,
  castPollVote, pinMsg, listPinnedMessages,
  updateNickname, setAnnouncement, listSharedMedia,
} = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(requireAuth);

router.get("/",                                                      listConversations);
router.post("/direct",                                               createDirect);
router.post("/group",                                                createGroup);
router.patch("/:conversationId/group",                               renameGroup);
router.patch("/:conversationId/group/announcement",                  setAnnouncement);
router.post("/:conversationId/group/participants",                   addParticipants);
router.patch("/:conversationId/group/participants/:participantId",   updateParticipantRole);
router.delete("/:conversationId/group/participants/:participantId",  removeParticipant);
router.patch("/:conversationId/group/nickname",                      updateNickname);
router.get("/:conversationId/messages",                              listMessages);
router.get("/:conversationId/messages/search",                       searchMessages);
router.get("/:conversationId/messages/pinned",                       listPinnedMessages);
router.get("/:conversationId/media",                                 listSharedMedia);
router.post("/:conversationId/messages",                             sendMessage);
router.patch("/:conversationId/messages/:messageId",                 editMessage);
router.delete("/:conversationId/messages/:messageId",                removeMessage);
router.post("/:conversationId/read",                                 markRead);
router.post("/:conversationId/messages/:messageId/reactions",        addReaction);
router.delete("/:conversationId/messages/:messageId/reactions/:emoji", removeReaction);
router.post("/:conversationId/messages/:messageId/vote",             castPollVote);
router.patch("/:conversationId/messages/:messageId/pin",             pinMsg);

module.exports = router;
