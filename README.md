# PulseChat

A full-stack, feature-rich real-time chat application built with React 19, Node.js, Socket.io, and MongoDB.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248)

---

## Features

### Core Messaging
- Real-time text messaging via WebSocket (Socket.io)
- **Markdown support** — `**bold**`, `*italic*`, `` `inline code` `` rendered inline
- Reply-to-message with quoted preview
- Edit and delete your own messages (soft delete)
- File attachments — images, PDFs, Word, Excel, plain text (up to 5 MB)
- **Voice messages** — record audio in-browser via MediaRecorder, upload and play inline
- **Message forwarding** — forward any message to one or more conversations
- **Message starring** — star important messages, persisted per user in localStorage
- **Emoji reactions** — 8 emojis, persistent, real-time synced to all participants
- **GIF support** — Giphy API integration with search and trending (requires `VITE_GIPHY_API_KEY`)
- **Stickers** — 20 emoji stickers, rendered large in the bubble
- **Polls** — create polls with 2–10 options, optional multi-select, live vote percentage bars
- **Events** — send structured event cards: Birthday, Meeting, Reminder, or Other with title, description, and date/time
- **Link preview** — URL metadata (title, description, image, site name) stored and rendered as a card
- **@Mentions** — `@name` autocomplete from conversation participants, highlighted in bubbles
- **#Hashtags** — detected and styled in accent colour
- Message search inside any conversation
- Cursor-based pagination — loads 30 messages at a time with a "Load older messages" button
- Draft persistence per conversation (localStorage)
- Day dividers in message list

### Conversations
- Direct (1:1) conversations — deduplicated, no self-DMs
- Group chats with full admin controls: rename, add/remove members, promote/demote admin
- **Announcement groups** — toggle mode where only admins can send messages
- **Pinned messages** — pin up to 3 messages per group (admin only), shown with indicator
- **Nicknames** — set custom display names per user inside a group (server-persisted)
- At-least-one-admin enforcement on removal and demotion
- Unread count badges (capped at 99+)
- Pin, mute, and archive per conversation (client-side preference)
- Filter conversations: All / Unread / Direct / Groups
- Inbox and Archived views
- User profile panel — click any avatar in a 1:1 chat to view profile

### Shared Media
- Dedicated **Shared Media panel** with 6 tabs: Images, Videos, Documents, Links, Audio, GIFs
- All media fetched from server filtered by MIME type

### Presence & Status
- Online / offline dot on avatars (multi-tab aware via Set of socket IDs)
- "Last seen X ago" with relative time formatting
- 3-stage delivery receipts: `sent` → `delivered` → `seen` with WhatsApp-style checkmarks
- **Read-by list** — group messages show an eye icon with count; expand to see which members read it
- Typing indicators with multi-user display ("X is typing" / "N people are typing")

### User & Settings
- Settings modal with 7 sections, accessible from sidebar gear icon:
  - **Profile** — edit display name, change password (local accounts), view auth provider
  - **Appearance** — Light/Dark theme, 5 accent colours, font size (S/M/L), message density (Compact/Cozy)
  - **Chat** — Enter-to-send toggle, timestamp visibility, message sounds, keyboard shortcuts reference
  - **Notifications** — browser push toggle, global mute-all
  - **Privacy** — read receipts, last-seen, online-status toggles
  - **Data & storage** — clear drafts/preferences with confirm step, sign out
  - **About** — version, tech stack, full keyboard shortcut reference

### Auth
- Email/password registration and login (JWT, 7-day expiry)
- Google OAuth sign-in via `@react-oauth/google`
- Session auto-restore on page reload (`GET /api/auth/me`)
- Profile name and password update via API

### Notifications
- Browser push via Service Worker (`/notification-sw.js`)
- Respects per-conversation mute preference and global mute-all toggle
- Only fires when tab is hidden or a different conversation is active
- Notification click navigates directly to the relevant conversation

### Performance & UX
- Fully responsive — mobile layout below 720 px with pane-based navigation
- URL deep-linking via `?conversationId=` query param
- Lazy-loaded `ChatDashboard` chunk — reduces initial JS payload by ~35 %
- In-flight GET deduplication in the API client
- Gzip compression on all server responses
- Bulk aggregation queries for conversation list (2 queries instead of 2N)
- Status error toast — dismissable, auto-expires after 5 s
- Socket errors only surface after 3 consecutive failures (transient blips suppressed)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, socket.io-client 4.8 |
| Styling | Plain CSS with design tokens (no CSS framework) |
| Icons | lucide-react |
| Auth (OAuth) | @react-oauth/google |
| GIF API | Giphy API (free tier) |
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
├── client/                        # React + Vite frontend
│   ├── public/
│   │   └── notification-sw.js     # Service worker for push notifications
│   └── src/
│       ├── api/
│       │   └── client.js          # Fetch client with GET deduplication
│       ├── auth/
│       │   └── AuthContext.jsx    # JWT + Google OAuth context
│       ├── components/
│       │   ├── AuthScreen.jsx
│       │   ├── Avatar.jsx
│       │   ├── ChatDashboard.jsx  # Main state container (lazy loaded)
│       │   ├── ChatWindow.jsx
│       │   ├── ComposeExtras.jsx  # Poll / Event / GIF / Sticker toolbar
│       │   ├── CreateGroupModal.jsx
│       │   ├── ErrorBoundary.jsx
│       │   ├── EventMessage.jsx   # Event card renderer
│       │   ├── FileShare.jsx
│       │   ├── ForwardMessageModal.jsx
│       │   ├── GifPicker.jsx      # Giphy search + trending
│       │   ├── GroupManagerPanel.jsx
│       │   ├── LinkPreview.jsx    # URL preview card
│       │   ├── MessageBubble.jsx  # Renders all message types
│       │   ├── MessageComposer.jsx
│       │   ├── MessageReactions.jsx
│       │   ├── MessageSearchPanel.jsx
│       │   ├── PollMessage.jsx    # Interactive poll renderer
│       │   ├── ReadByList.jsx     # Group read-by tooltip
│       │   ├── SettingsModal.jsx
│       │   ├── SharedMediaPanel.jsx
│       │   ├── Sidebar.jsx
│       │   ├── StatusToast.jsx
│       │   ├── ThemeSelector.jsx
│       │   ├── TypingIndicator.jsx
│       │   ├── UserProfilePanel.jsx
│       │   └── VoiceRecorder.jsx
│       ├── hooks/
│       │   ├── useBrowserNotifications.js
│       │   ├── useChatSocket.js
│       │   ├── useLocalPrefs.js
│       │   └── useOptimizedChat.js
│       ├── styles/
│       │   └── global.css         # Design tokens, themes, all component styles
│       ├── theme/
│       │   └── ThemeContext.jsx
│       └── utils/
│           ├── apiHelpers.js      # Typed wrappers for all REST endpoints
│           └── chat.js            # Formatting, sorting, upsert helpers
│
├── server/                        # Node.js + Express + Socket.io
│   ├── uploads/                   # Uploaded files (gitignored)
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   └── env.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── chat.controller.js
│       │   └── upload.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   └── upload.middleware.js
│       ├── models/
│       │   └── chat.models.js     # User, Conversation, Message schemas
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── chat.routes.js
│       │   ├── upload.routes.js
│       │   └── user.routes.js
│       ├── services/
│       │   ├── chat.service.js    # All DB logic, bulk-query optimised
│       │   ├── presence.service.js
│       │   └── socket.service.js
│       ├── utils/
│       │   ├── app-error.js
│       │   ├── async-handler.js
│       │   ├── auth.js
│       │   └── validation.js
│       ├── validators/
│       │   ├── auth.schemas.js
│       │   └── chat.schemas.js
│       ├── app.js
│       └── index.js
│
├── package.json                   # npm workspaces root
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- (Optional) Giphy API key for GIF support — free at [developers.giphy.com](https://developers.giphy.com)

### 1. Clone and install

```bash
git clone <repo-url>
cd real-time-chat-application
npm install
```

### 2. Environment files

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
GOOGLE_CLIENT_ID=your-google-client-id       # optional
```

**`client/.env`**

```env
VITE_API_URL=/api
VITE_SERVER_URL=
VITE_GOOGLE_CLIENT_ID=your-google-client-id  # optional
VITE_GIPHY_API_KEY=your-giphy-api-key        # optional — enables GIF picker
```

> **Port note:** The Vite dev proxy and server both default to `5009`. Changing `PORT` in `server/.env` requires updating `vite.config.js` proxy targets to match.

### 3. Run in development

```bash
npm run dev
```

| Service | URL |
|---|---|
| React client | http://localhost:5173 |
| Express + Socket.io | http://localhost:5009 |

```bash
npm run dev:client   # client only
npm run dev:server   # server only
```

### 4. Production build

```bash
npm run build    # builds client/dist
npm start        # starts Node.js server
```

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/register` | — | Create account |
| `POST` | `/login` | — | Email/password sign-in |
| `POST` | `/google` | — | Google OAuth token exchange |
| `GET` | `/me` | ✓ | Get current user |
| `PATCH` | `/profile` | ✓ | Update display name |
| `PATCH` | `/password` | ✓ | Change password (local only) |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/?q=` | ✓ | Search users by name or email |

### Conversations — `/api/conversations`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/` | ✓ | List all conversations |
| `POST` | `/direct` | ✓ | Create or open 1:1 conversation |
| `POST` | `/group` | ✓ | Create group conversation |
| `PATCH` | `/:id/group` | ✓ | Rename group (admin) |
| `PATCH` | `/:id/group/announcement` | ✓ | Toggle announcement mode (admin) |
| `PATCH` | `/:id/group/nickname` | ✓ | Set nickname for a member |
| `POST` | `/:id/group/participants` | ✓ | Add members (admin) |
| `PATCH` | `/:id/group/participants/:pid` | ✓ | Update member role (admin) |
| `DELETE` | `/:id/group/participants/:pid` | ✓ | Remove member (admin) |
| `GET` | `/:id/messages` | ✓ | Paginated messages (`?limit=30&cursor=`) |
| `GET` | `/:id/messages/search` | ✓ | Search messages |
| `GET` | `/:id/messages/pinned` | ✓ | Get pinned messages |
| `GET` | `/:id/media` | ✓ | Shared media (`?type=images\|videos\|documents\|links\|audio\|gifs`) |
| `POST` | `/:id/messages` | ✓ | Send message (text/file/audio/poll/event/gif/sticker) |
| `PATCH` | `/:id/messages/:mid` | ✓ | Edit own message |
| `DELETE` | `/:id/messages/:mid` | ✓ | Soft-delete own message |
| `POST` | `/:id/read` | ✓ | Mark conversation as read |
| `POST` | `/:id/messages/:mid/reactions` | ✓ | Add emoji reaction |
| `DELETE` | `/:id/messages/:mid/reactions/:emoji` | ✓ | Remove emoji reaction |
| `POST` | `/:id/messages/:mid/vote` | ✓ | Cast poll vote |
| `PATCH` | `/:id/messages/:mid/pin` | ✓ | Pin/unpin message (admin) |

### Uploads — `/api/uploads`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/` | ✓ | Upload file (multipart, max 5 MB) |

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
| `conversation:removed` | `{ conversationId }` | User removed from group |
| `message:new` | `message` | Incoming message |
| `message:update` | `message` | Edited, deleted, reacted, voted, or pinned message |
| `message:status` | `{ conversationId, messageIds[], status }` | Bulk delivered/seen |
| `message:pinned` | `{ conversationId, messageId, pin }` | Pin/unpin notification |
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
isAnnouncement (bool), nicknames (Map<userId, string>),
pinnedMessages[] (ref Message, max 3), wallpaper?,
participants[]: { user, role (member|admin), joinedAt, lastReadMessage }
```

### Message
```
conversation, sender, content (max 4000), status (sent|delivered|seen),
messageType: text | file | audio | poll | event | gif | sticker
fileName?, fileUrl?, fileSize?, mimeType?,
poll: { question, options[]: { text, votes[] }, allowMultiple, closedAt? }
event: { title, description, eventType, startsAt? }
gifUrl?, gifTitle?, stickerUrl?,
linkPreview: { url, title?, description?, image?, siteName? }
readBy[] (User refs), isPinned (bool),
replyToMessage?, reactions[]: { user, emoji, reactedAt },
isDeleted, deletedAt?, editedAt?, createdAt, updatedAt
```

**Indexes:**
- `Conversation`: `{ participants.user, updatedAt }`
- `Message`: `{ conversation, _id }`, `{ conversation, sender, status }`, `{ conversation, isDeleted, _id }`

---

## Manual Test Flow

1. Register two users in separate browser windows.
2. Search for the second user → start a direct conversation.
3. Send a text message — confirm live delivery, typing indicator, online dot.
4. Open the chat on the second account — confirm `seen` status updates.
5. Reply to a message, edit it, then delete it.
6. Type `**hello**` — confirm bold rendering. Type `@` — confirm mention autocomplete.
7. Attach a file and verify it appears in both windows.
8. Hold the microphone button → record a voice message → send → verify playback.
9. Click Forward on a message → select a conversation → confirm delivery.
10. Star a message → verify amber highlight persists after page reload.
11. Click the GIF / Poll / Event / Sticker button above the composer to create each type.
12. React to a message with an emoji → verify count updates in real time.
13. In a group, pin a message → verify pin indicator appears.
14. Toggle Announcement mode (admin) → verify members cannot send.
15. Set a nickname for a member → verify it shows in the group.
16. Open the Shared Media panel → verify images/links tab.
17. Create a group, add both users, test admin actions.
18. Open Settings → Appearance → switch theme and accent colour.
19. Enable browser notifications → send a message from the other account while tab is hidden.
20. Test the mobile layout below 720 px — back button and pane switching.

---

## Notes

- Uploaded files are saved to `server/uploads/` and served as static assets.
- MongoDB collections and indexes are created automatically on first write.
- Conversation preferences (pin, mute, archive) and starred messages are stored in `localStorage` per user ID.
- Privacy toggles (read receipts, last seen, online status) are client-side only in this version.
- Nicknames and announcement mode are fully server-persisted.
- GIF picker requires a free Giphy API key — without it, the picker shows a setup notice.
- The JWT has a 7-day expiry with no refresh token — users are logged out silently on expiry.
- Voice messages use the browser's native `MediaRecorder` API (WebM/OGG output).

---

## Testing Report

> **Test run date:** 2026-07-06
> **Node.js version:** v24.11.1 · **npm version:** 11.8.0
> **Environment:** Windows 11, local development

### Summary

| Suite | Tests | Passed | Failed | Result |
|---|:-:|:-:|:-:|:-:|
| Server — config validation | 5 | 5 | 0 | ✅ |
| Server — validators (auth + chat) | 17 | 17 | 0 | ✅ |
| Server — utility functions | 11 | 11 | 0 | ✅ |
| Server — error middleware | 4 | 4 | 0 | ✅ |
| Server — auth middleware | 2 | 2 | 0 | ✅ |
| Server — upload middleware | 4 | 4 | 0 | ✅ |
| Server — database models & indexes | 23 | 23 | 0 | ✅ |
| Server — route registration | 16 | 16 | 0 | ✅ |
| Server — socket service setup | 2 | 2 | 0 | ✅ |
| Server — syntax check (all files) | 13 | 13 | 0 | ✅ |
| Server — require smoke test | 3 | 3 | 0 | ✅ |
| Client — chat utility functions | 23 | 23 | 0 | ✅ |
| Client — API helpers | 15 | 15 | 0 | ✅ |
| Client — production build | 1 | 1 | 0 | ✅ |
| **TOTAL** | **139** | **139** | **0** | ✅ **ALL PASS** |

### Production Build Output

| Chunk | Size | Gzip |
|---|--:|--:|
| `index.css` | 60.38 kB | 10.23 kB |
| `ChatDashboard-*.js` (lazy) | 155.62 kB | 42.41 kB |
| `index-*.js` (main) | 206.92 kB | 65.50 kB |

### Known Limitations

| Area | Notes |
|---|---|
| End-to-end socket flow | Requires live MongoDB — covered by manual test flow |
| Google OAuth | Requires valid `GOOGLE_CLIENT_ID` in env |
| GIF picker | Requires `VITE_GIPHY_API_KEY` — shows setup notice without it |
| Message Translation | Planned — requires LibreTranslate or DeepL API integration |
| Chat wallpapers | Schema field exists; UI picker not yet wired |
| Privacy toggles | Client-side localStorage only; no server enforcement yet |
| JWT token refresh | No refresh token — silent logout on 7-day expiry |
