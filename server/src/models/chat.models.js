const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 120,
    },
    passwordHash: {
      type: String,
      required: false, // Optional for Google OAuth users
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatarSeed: {
      type: String,
      required: true,
      maxlength: 80,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const participantSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator(participants) {
          return participants.length > 0;
        },
        message: "Conversation must have at least one participant.",
      },
    },
    // Group-only: only admins can send messages
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
    // Group-only: per-user display name overrides
    nicknames: {
      type: Map,
      of: String,
      default: {},
    },
    // Pinned message IDs (ordered, max 3)
    pinnedMessages: {
      type: [{ type: Schema.Types.ObjectId, ref: "Message" }],
      default: [],
    },
    // Per-conversation wallpaper key
    wallpaper: {
      type: String,
      default: null,
      maxlength: 80,
    },
  },
  {
    timestamps: true,
  },
);

const reactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 12,
    },
    reactedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const pollOptionSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 120 },
    votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: true },
);

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
      maxlength: 4000,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "audio", "poll", "event", "gif", "sticker"],
      default: "text",
    },
    // File fields
    fileName: { type: String, default: null, maxlength: 255 },
    fileUrl:  { type: String, default: null, maxlength: 500 },
    fileSize: { type: Number, default: null },
    mimeType: { type: String, default: null, maxlength: 120 },
    // Poll
    poll: {
      question: { type: String, default: null, maxlength: 300 },
      options:  { type: [pollOptionSchema], default: [] },
      allowMultiple: { type: Boolean, default: false },
      closedAt: { type: Date, default: null },
    },
    // Event
    event: {
      title:       { type: String, default: null, maxlength: 120 },
      description: { type: String, default: null, maxlength: 500 },
      eventType:   { type: String, enum: ["birthday", "meeting", "reminder", "other"], default: "other" },
      startsAt:    { type: Date, default: null },
    },
    // GIF / sticker
    gifUrl:    { type: String, default: null, maxlength: 500 },
    gifTitle:  { type: String, default: null, maxlength: 120 },
    stickerUrl:{ type: String, default: null, maxlength: 500 },
    // Link preview (populated server-side or client-reported)
    linkPreview: {
      url:         { type: String, default: null, maxlength: 500 },
      title:       { type: String, default: null, maxlength: 200 },
      description: { type: String, default: null, maxlength: 400 },
      image:       { type: String, default: null, maxlength: 500 },
      siteName:    { type: String, default: null, maxlength: 80 },
    },
    // Read-by tracking (users who have seen this specific message)
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Pinned in conversation
    isPinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    replyToMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    editedAt:  { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ "participants.user": 1, updatedAt: -1 });
messageSchema.index({ conversation: 1, _id: -1 });
// Compound index for markPendingDirectMessagesDelivered:
// filters by conversation + sender + status in one index scan
messageSchema.index({ conversation: 1, sender: 1, status: 1 });
// Compound index for getConversationLastMessage (sort by _id desc per conversation)
messageSchema.index({ conversation: 1, isDeleted: 1, _id: -1 });

const User = mongoose.model("User", userSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = {
  User,
  Conversation,
  Message,
};
