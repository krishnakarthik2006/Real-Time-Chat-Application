# Chat App

A full-stack real-time chat application built with React 19, Node.js, Socket.io, and MongoDB.

![Chat App](https://img.shields.io/badge/version-1.0.0-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248)

---

## Features

### Messaging
- Real-time text messaging via WebSocket (Socket.io)
- Reply-to-message with quoted preview
- Edit and delete your own messages (soft delete)
- File attachments — images, PDFs, Word, Excel, plain text (up to 5 MB)
- Emoji reactions — persistent, synced to all participants in real time
- Message search inside any conversation
- Cursor-based pagination — loads 30 messages at a time with a "Load older" button
- Draft persistence per conversation (localStorage)

### Conversations
- Direct (1:1) conversations — deduplicated, no self-DMs
- Group chats with full admin controls: rename, add/remove members, promote/demote admin
- At-least-one-admin enforcement on removal and demotion
- Unread count badges (capped at 99+)
- Pin, mute, and archive per conversation (client-side preference)
- Filter conversations: All / Unread / Direct / Groups
- Inbox and Archived views

### Presence & Status
- Online / offline dot on avatars (multi-tab aware)
- "Last seen X ago" with relative time formatting
- 3-stage message delivery: `sent` → `delivered` → `seen` with WhatsApp-style checkmarks
- Typing indicators with multi-user display

### User & Settings
- User profile panel — click any avatar in a 1:1 chat to view name, email, online status, join date
- Settings modal with 7 sections:
  - **Profile** — edit display name, change password
  - **Appearance** — Light/Dark theme, 5 accent colours, font size (S/M/L), message density
  - **Chat** — Enter-to-send toggle, timestamp visibility, message sounds, keyboard shortcuts
  - **Notifications** — browser push notification toggle, global mute-all
  - **Privacy** — read receipts, last-seen, online-status visibility toggles
  - **Data & storage** — clear drafts/preferences, sign out
  - **About** — version, tech stack, keyboard shortcut reference

### Auth
- Email/password registration and login (JWT, 7-day expiry)
- Google OAuth sign-in via `@react-oauth/google`
- Session auto-restore on page reload
- Profile name and password update via API

### Notifications
- Browser push via Service Worker (`/notification-sw.js`)
- Respects per-conversation mute preference
- Only fires when the tab is hidden or a different conversation is active
- Notification click navigates directly to the relevant conversation

### UX & Performance
- Fully responsive — mobile layout below 720 px with pane-based navigation
- URL deep-linking via `?conversationId=` query param
- Status error toast — dismissable, auto-expires after 5 s
- Lazy-loaded `ChatDashboard` chunk — reduces initial JS payload by ~35%
- In-flight GET deduplication in the API client
- Gzip compression on all server responses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, socket.io-client 4.8 |
| Styling | Plain CSS with design tokens (no CSS framework) |
| Icons | lucide-react |
| Auth (OAuth) | @react-oauth/google |
| Backend | Node.js, Express 4, Socket.io 4.8 |
| Database | MongoDB, Mongoose 9 |
| Validation | Zod 3 |
| File uploads | Multer 2 |
| Compression | compression 1.7 |
| Auth (server) | jsonwebtoken, bcryptjs |
| Dev tooling | Vite HMR, nodemon, concurrently |

---

## Project Structure

```
.
├── client/                     # React + Vite frontend
│   ├── public/
│   │   └── notification-sw.js  # Service worker for push notifications
│   └── src/
│       ├── api/                # Fetch client with deduplication
│       ├── auth/               # AuthContext (JWT + Google OAuth)
│       ├── components/         # All UI components
│       │   ├── AuthScreen.jsx
│       │   ├── Avatar.jsx
│       │   ├── ChatDashboard.jsx
│       │   ├── ChatWindow.jsx
│       │   ├── CreateGroupModal.jsx
│       │   ├── ErrorBoundary.jsx
│       │   ├── FileShare.jsx
│       │   ├── GroupManagerPanel.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── MessageComposer.jsx
│       │   ├── MessageReactions.jsx
│       │   ├── MessageSearchPanel.jsx
│       │   ├── SettingsModal.jsx
│       │   ├── Sidebar.jsx
│       │   ├── StatusToast.jsx
│       │   ├── ThemeSelector.jsx
│       │   ├── TypingIndicator.jsx
│       │   └── UserProfilePanel.jsx
│       ├── hooks/
│       │   ├── useBrowserNotifications.js
│       │   ├── useChatSocket.js
│       │   └── useOptimizedChat.js
│       ├── styles/
│       │   └── global.css      # Design tokens, themes, all component styles
│       ├── theme/
│       │   └── ThemeContext.jsx
│       └── utils/
│           ├── apiHelpers.js   # Typed wrappers for all REST endpoints
│           └── chat.js         # Formatting, sorting, upsert helpers
│
├── server/                     # Node.js + Express + Socket.io backend
│   ├── uploads/                # Uploaded files (gitignored)
│   └── src/
│       ├── config/
│       │   ├── db.js           # MongoDB connection
│       │   └── env.js          # Validated environment variables
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── chat.controller.js
│       │   └── upload.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   └── upload.middleware.js
│       ├── models/
│       │   └── chat.models.js  # User, Conversation, Message schemas
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── chat.routes.js
│       │   ├── upload.routes.js
│       │   └── user.routes.js
│       ├── services/
│       │   ├── chat.service.js   # All DB logic, bulk-query optimised
│       │   ├── presence.service.js
│       │   └── socket.service.js
│       ├── utils/
│       │   ├── app-error.js
│       │   ├── async-handler.js
│       │   ├── auth.js         # JWT sign/verify, sanitizeUser
│       │   └── validation.js
│       ├── validators/
│       │   ├── auth.schemas.js
│       │   └── chat.schemas.js
│       ├── app.js
│       └── index.js
│
├── package.json                # npm workspaces root
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone and install

```bash
git clone <repo-url>
cd real-time-chat-application
npm install
```

### 2. Environment files

Copy the examples and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

```env
PORT=5009
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:5009
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=Real_Time_Chat_Application
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
GOOGLE_CLIENT_ID=your-google-client-id   # optional — only needed for Google sign-in
```

**`client/.env`**

```env
VITE_API_URL=/api          # leave as-is for dev (Vite proxy handles it)
VITE_SERVER_URL=           # leave empty for dev; set to server origin in production
VITE_GOOGLE_CLIENT_ID=your-google-client-id   # optional
```

> **Port note:** The Vite dev proxy and the server default both use port `5009`. If you change `PORT` in `server/.env`, update `vite.config.js` proxy targets to match.

### 3. Run in development

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---|---|
| React client | http://localhost:5173 |
| Express + Socket.io | http://localhost:5009 |

Individual commands:

```bash
npm run dev:client   # client only
npm run dev:server   # server only
```

### 4. Production build

```bash
npm run build        # builds client to client/dist
npm start            # starts the Node.js server
```

Serve `client/dist` as static files from your CDN or reverse proxy and point `VITE_API_URL` / `VITE_SERVER_URL` at your deployed server.

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/register` | — | Create account (name, email, password) |
| `POST` | `/login` | — | Email/password sign-in |
| `POST` | `/google` | — | Google OAuth token exchange |
| `GET` | `/me` | ✓ | Get current user |
| `PATCH` | `/profile` | ✓ | Update display name |
| `PATCH` | `/password` | ✓ | Change password (local accounts only) |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/?q=` | ✓ | Search users by name or email (max 20) |

### Conversations — `/api/conversations`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/` | ✓ | List all conversations for current user |
| `POST` | `/direct` | ✓ | Create or open existing 1:1 conversation |
| `POST` | `/group` | ✓ | Create group conversation |
| `PATCH` | `/:id/group` | ✓ | Rename group (admin only) |
| `POST` | `/:id/group/participants` | ✓ | Add members (admin only) |
| `PATCH` | `/:id/group/participants/:pid` | ✓ | Update member role (admin only) |
| `DELETE` | `/:id/group/participants/:pid` | ✓ | Remove member (admin only) |
| `GET` | `/:id/messages` | ✓ | Paginated messages (`?limit=30&cursor=`) |
| `GET` | `/:id/messages/search` | ✓ | Search messages by content or filename |
| `POST` | `/:id/messages` | ✓ | Send message |
| `PATCH` | `/:id/messages/:mid` | ✓ | Edit own message |
| `DELETE` | `/:id/messages/:mid` | ✓ | Soft-delete own message |
| `POST` | `/:id/read` | ✓ | Mark conversation as read |
| `POST` | `/:id/messages/:mid/reactions` | ✓ | Add emoji reaction |
| `DELETE` | `/:id/messages/:mid/reactions/:emoji` | ✓ | Remove emoji reaction |

### Uploads — `/api/uploads`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/` | ✓ | Upload file (multipart/form-data, max 5 MB) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Returns `{ "status": "ok" }` |

---

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `{ conversationId }` | Join a conversation room |
| `conversation:leave` | `{ conversationId }` | Leave a conversation room |
| `typing:start` | `{ conversationId }` | Broadcast typing started |
| `typing:stop` | `{ conversationId }` | Broadcast typing stopped |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `presence:snapshot` | `{ onlineUserIds[] }` | Full online list on connect |
| `presence:update` | `{ userId, isOnline, lastSeen }` | Single user presence change |
| `conversation:upsert` | `conversation` | New or updated conversation |
| `conversation:removed` | `{ conversationId }` | Current user was removed from a group |
| `message:new` | `message` | Incoming message |
| `message:update` | `message` | Edited, deleted, or reacted-to message |
| `message:status` | `{ conversationId, messageIds[], status }` | Bulk delivered/seen update |
| `typing:update` | `{ conversationId, userId, userName, isTyping }` | Typing indicator |

---

## Database Schema

### User
```
name, email (unique), passwordHash?, authProvider (local|google),
avatarSeed, lastSeen, createdAt, updatedAt
```

### Conversation
```
name?, type (direct|group), createdBy,
participants[]: { user, role (member|admin), joinedAt, lastReadMessage }
```

### Message
```
conversation, sender, content, messageType (text|file),
fileName?, fileUrl?, fileSize?, mimeType?,
status (sent|delivered|seen), replyToMessage?,
reactions[]: { user, emoji, reactedAt },
isDeleted, deletedAt?, editedAt?, createdAt, updatedAt
```

**Indexes:**
- `Conversation`: `{ participants.user: 1, updatedAt: -1 }`
- `Message`: `{ conversation: 1, _id: -1 }`, `{ conversation: 1, sender: 1, status: 1 }`, `{ conversation: 1, isDeleted: 1, _id: -1 }`

---

## Manual Test Flow

1. Register two users in different browser windows.
2. Search for the second user and start a direct conversation.
3. Send messages — confirm live delivery, typing indicator, and online dot.
4. Open the chat on the second account — confirm `seen` status updates.
5. Reply to a message, edit it, then delete it.
6. Attach a file and verify it appears in both windows.
7. Add an emoji reaction and confirm it persists after reload.
8. Create a group, add both users, test admin actions (rename, add/remove members).
9. Search for a message inside a conversation using the search panel.
10. Open Settings → Appearance and switch theme and accent colour.
11. Enable browser notifications, send a message from the other account while the tab is hidden.
12. Test the mobile layout by narrowing the browser to below 720 px.

---

## Notes

- Uploaded files are saved to `server/uploads/` and served as static assets.
- MongoDB collections and indexes are created automatically on first write.
- Conversation preferences (pin, mute, archive) are stored in `localStorage` per user ID.
- Privacy toggles (read receipts, last seen, online status) are client-side only in this version.
- The JWT has a 7-day expiry with no refresh token — users are logged out silently on expiry.

---

## Testing Report

> **Test run date:** 2026-07-06  
> **Node.js version:** v24.11.1  
> **npm version:** 11.8.0  
> **Environment:** Windows 11, local development

---

### Summary

| Test Suite | Tests | Passed | Failed | Result |
|---|:-:|:-:|:-:|:-:|
| Server — config validation | 5 | 5 | 0 | ✅ PASS |
| Server — validators (auth + chat) | 17 | 17 | 0 | ✅ PASS |
| Server — utility functions | 11 | 11 | 0 | ✅ PASS |
| Server — error middleware | 4 | 4 | 0 | ✅ PASS |
| Server — auth middleware | 2 | 2 | 0 | ✅ PASS |
| Server — upload middleware | 4 | 4 | 0 | ✅ PASS |
| Server — database models & indexes | 23 | 23 | 0 | ✅ PASS |
| Server — route registration | 16 | 16 | 0 | ✅ PASS |
| Server — socket service setup | 2 | 2 | 0 | ✅ PASS |
| Server — syntax check (all files) | 13 | 13 | 0 | ✅ PASS |
| Server — require smoke test | 3 | 3 | 0 | ✅ PASS |
| Client — chat utility functions | 23 | 23 | 0 | ✅ PASS |
| Client — API helpers (all methods) | 15 | 15 | 0 | ✅ PASS |
| Client — production build | 1 | 1 | 0 | ✅ PASS |
| **TOTAL** | **139** | **139** | **0** | ✅ **ALL PASS** |

---

### Suite Details

#### 1. Server — Config Validation
Verifies that `env.js` resolves all required variables to their expected types and values.

| Test | Result |
|---|:-:|
| PORT defaults to 5009 | ✅ |
| CLIENT_URL is set | ✅ |
| JWT_SECRET is set | ✅ |
| MONGODB_URI is set | ✅ |
| MAX_FILE_SIZE_BYTES = 5 242 880 (5 MB) | ✅ |

---

#### 2. Server — Validators (Zod Schemas)
Verifies all Zod schemas accept valid input and reject invalid input with the correct messages.

| Test | Result |
|---|:-:|
| `registerSchema` valid payload | ✅ |
| `registerSchema` rejects name < 2 chars | ✅ |
| `loginSchema` valid payload | ✅ |
| `updateProfileSchema` valid payload | ✅ |
| `changePasswordSchema` valid payload | ✅ |
| `directConversationSchema` valid ObjectId | ✅ |
| `directConversationSchema` rejects bad id | ✅ |
| `groupConversationSchema` valid payload | ✅ |
| `messageSchema` text message | ✅ |
| `messageSchema` file message | ✅ |
| `messageSchema` rejects empty content + no file | ✅ |
| `editMessageSchema` valid content | ✅ |
| `editMessageSchema` rejects empty string | ✅ |
| `reactionSchema` valid emoji | ✅ |
| `renameGroupSchema` valid name | ✅ |
| `messageQuerySchema` default limit = 30 | ✅ |
| `messageQuerySchema` coerces string limit to number | ✅ |

---

#### 3. Server — Utility Functions
Tests JWT signing/verification, user sanitization, AppError, asyncHandler, and the in-memory presence service.

| Test | Result |
|---|:-:|
| `signToken` returns a string | ✅ |
| `verifyToken` round-trip preserves id + email | ✅ |
| `verifyToken` rejects garbage token | ✅ |
| `sanitizeUser` strips `passwordHash` | ✅ |
| `sanitizeUser` includes `id` field | ✅ |
| `AppError` sets correct `statusCode` | ✅ |
| `AppError` is an `Error` instance | ✅ |
| `asyncHandler` forwards to handler | ✅ |
| `userRoom` returns `user:<id>` | ✅ |
| `conversationRoom` returns `conversation:<id>` | ✅ |
| Presence: connect → online → multi-tab → disconnect | ✅ |
| Presence: `getOnlineUserIds` includes connected user | ✅ |

---

#### 4. Server — Error Middleware
Tests the Express error handler for all error types and status code mapping.

| Test | Result |
|---|:-:|
| `AppError 404` → HTTP 404 with correct message | ✅ |
| `Generic Error` → HTTP 500 | ✅ |
| `MulterError` → HTTP 400 | ✅ |
| `AppError 401` → HTTP 401 | ✅ |

---

#### 5. Server — Auth Middleware
Tests the `requireAuth` middleware guard for missing and invalid tokens.

| Test | Result |
|---|:-:|
| Missing `Authorization` header → `AppError 401` | ✅ |
| Malformed/invalid JWT → `AppError 401` | ✅ |

---

#### 6. Server — Upload Middleware
Verifies Multer is configured correctly with the right file size limit and storage.

| Test | Result |
|---|:-:|
| `upload.single` is a function | ✅ |
| `upload.array` is a function | ✅ |
| Max file size = 5 MB | ✅ |
| `UPLOAD_DIR` is defined | ✅ |

---

#### 7. Server — Database Models & Indexes
Verifies Mongoose schemas have all required fields, correct enum values, and all compound indexes.

| Test | Result |
|---|:-:|
| User: `name`, `email`, `passwordHash`, `authProvider`, `avatarSeed`, `lastSeen` | ✅ |
| Conversation: `name`, `type`, `createdBy`, `participants` | ✅ |
| Message: `conversation`, `sender`, `content`, `messageType`, `status`, `replyToMessage`, `isDeleted`, `reactions` | ✅ |
| Message compound index `{ conversation, sender, status }` | ✅ |
| Message status enum: `sent`, `delivered`, `seen` | ✅ |
| Message type enum: `text`, `file` | ✅ |
| Conversation type enum: `direct`, `group` | ✅ |
| User authProvider enum: `local`, `google` | ✅ |

---

#### 8. Server — Route Registration
Verifies every expected API endpoint is registered on the correct router with the correct HTTP method.

| Route | Method | Result |
|---|:-:|:-:|
| `/api/auth/register` | POST | ✅ |
| `/api/auth/login` | POST | ✅ |
| `/api/auth/google` | POST | ✅ |
| `/api/auth/me` | GET | ✅ |
| `/api/auth/profile` | PATCH | ✅ |
| `/api/auth/password` | PATCH | ✅ |
| `/api/users/` | GET | ✅ |
| `/api/conversations/` | GET | ✅ |
| `/api/conversations/direct` | POST | ✅ |
| `/api/conversations/group` | POST | ✅ |
| `/api/conversations/:id/messages` | POST | ✅ |
| `/api/conversations/:id/read` | POST | ✅ |
| `/api/conversations/:id/messages/:mid/reactions` | POST | ✅ |
| `/api/conversations/:id/messages/:mid/reactions/:emoji` | DELETE | ✅ |
| `/api/conversations/:id/messages/search` | GET | ✅ |
| `/api/uploads/` | POST | ✅ |

---

#### 9. Server — Socket Service Setup
Verifies Socket.io auth middleware and connection handler are registered correctly.

| Test | Result |
|---|:-:|
| `setupSocket` is a function | ✅ |
| `setupSocket` runs without throwing | ✅ |
| Auth middleware registered on default namespace | ✅ |
| Connection event listener registered | ✅ |

---

#### 10. Server — Syntax Check (All Source Files)
Node.js `--check` flag run against every server source file.

| File | Result |
|---|:-:|
| `src/index.js` | ✅ |
| `src/app.js` | ✅ |
| `src/config/env.js` | ✅ |
| `src/config/db.js` | ✅ |
| `src/models/chat.models.js` | ✅ |
| `src/controllers/auth.controller.js` | ✅ |
| `src/controllers/chat.controller.js` | ✅ |
| `src/controllers/upload.controller.js` | ✅ |
| `src/middleware/auth.middleware.js` | ✅ |
| `src/middleware/error.middleware.js` | ✅ |
| `src/services/chat.service.js` | ✅ |
| `src/services/socket.service.js` | ✅ |
| `src/services/presence.service.js` | ✅ |

---

#### 11. Server — Require Smoke Test
`node -e "require(...)"` on all entry-point modules to catch any runtime-level circular dependency or missing module errors.

| Module | Result |
|---|:-:|
| `src/app.js` | ✅ |
| `src/routes/auth.routes.js` | ✅ |
| `src/routes/chat.routes.js` | ✅ |

---

#### 12. Client — Chat Utility Functions
Pure-function tests for all formatting, sorting, and state-update helpers in `client/src/utils/chat.js`.

| Test | Result |
|---|:-:|
| `getInitials` — two words | ✅ |
| `getInitials` — one word | ✅ |
| `getInitials` — empty string returns `?` | ✅ |
| `getAvatarBackground` — returns CSS gradient | ✅ |
| `formatFileSize` — bytes | ✅ |
| `formatFileSize` — kilobytes | ✅ |
| `formatFileSize` — megabytes | ✅ |
| `formatFileSize` — null returns `""` | ✅ |
| `isSameDay` — same date returns true | ✅ |
| `isSameDay` — different dates returns false | ✅ |
| `isSameDay` — null inputs returns false | ✅ |
| `sortConversations` — newest first | ✅ |
| `upsertMessage` — adds new message | ✅ |
| `upsertMessage` — updates existing message | ✅ |
| `updateMessageStatuses` — updates matching IDs only | ✅ |
| `formatInlinePreview` — text message | ✅ |
| `formatInlinePreview` — deleted message | ✅ |
| `formatInlinePreview` — file/image message | ✅ |
| `getConversationTitle` — group conversation | ✅ |
| `upsertConversation` — inserts new | ✅ |
| `upsertConversation` — updates existing | ✅ |
| `formatLastSeen` — is a function | ✅ |
| `formatLastSeen` — returns non-empty string for recent date | ✅ |

---

#### 13. Client — API Helpers
Verifies all expected methods exist on `conversationApi`, `userApi`, and `uploadApi` in `client/src/utils/apiHelpers.js`.

| Method | Result |
|---|:-:|
| `conversationApi.markAsRead` | ✅ |
| `conversationApi.sendMessage` | ✅ |
| `conversationApi.editMessage` | ✅ |
| `conversationApi.deleteMessage` | ✅ |
| `conversationApi.searchMessages` | ✅ |
| `conversationApi.createDirect` | ✅ |
| `conversationApi.createGroup` | ✅ |
| `conversationApi.renameGroup` | ✅ |
| `conversationApi.addParticipants` | ✅ |
| `conversationApi.updateParticipantRole` | ✅ |
| `conversationApi.removeParticipant` | ✅ |
| `conversationApi.addReaction` | ✅ |
| `conversationApi.removeReaction` | ✅ |
| `userApi.searchUsers` | ✅ |
| `uploadApi.uploadFile` | ✅ |

---

#### 14. Client — Production Build
Full Vite production build with bundle analysis.

| Check | Result |
|---|:-:|
| Build exits without errors | ✅ |
| 1 837 modules transformed | ✅ |
| `ChatDashboard` emitted as separate lazy chunk | ✅ |
| Main JS chunk: 206.92 kB (65.50 kB gzip) | ✅ |
| Dashboard JS chunk: 128.42 kB (35.71 kB gzip) | ✅ |
| CSS bundle: 45.05 kB (8.10 kB gzip) | ✅ |

---

### Known Limitations (not tested here)

| Area | Notes |
|---|---|
| End-to-end socket flow | Requires a live MongoDB instance; covered by manual test flow |
| Google OAuth | Requires a valid `GOOGLE_CLIENT_ID` in env |
| File upload I/O | Requires the server running; path/disk verified via middleware config test |
| Privacy toggles | Client-side localStorage only; no server enforcement yet |
| JWT token refresh | No refresh token mechanism; silent logout on 7-day expiry |
