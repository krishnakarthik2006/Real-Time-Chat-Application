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
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
    fileName: {
      type: String,
      default: null,
      maxlength: 255,
    },
    fileUrl: {
      type: String,
      default: null,
      maxlength: 500,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
      maxlength: 120,
    },
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
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
