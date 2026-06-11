const express = require("express");
const {
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
} = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", listConversations);
router.post("/direct", createDirect);
router.post("/group", createGroup);
router.patch("/:conversationId/group", renameGroup);
router.post("/:conversationId/group/participants", addParticipants);
router.patch("/:conversationId/group/participants/:participantId", updateParticipantRole);
router.delete("/:conversationId/group/participants/:participantId", removeParticipant);
router.get("/:conversationId/messages", listMessages);
router.get("/:conversationId/messages/search", searchMessages);
router.post("/:conversationId/messages", sendMessage);
router.patch("/:conversationId/messages/:messageId", editMessage);
router.delete("/:conversationId/messages/:messageId", removeMessage);
router.post("/:conversationId/read", markRead);

module.exports = router;
