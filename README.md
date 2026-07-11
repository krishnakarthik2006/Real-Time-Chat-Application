# Real-Time Chat Application

A full-stack real-time chat application built with React, Vite, Express, Socket.io, and MongoDB. It includes one-to-one chats, group conversations, file sharing, presence, typing indicators, read receipts, and a polished responsive UI.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248)

## Overview

This project provides a complete messaging experience with:

- Real-time text, file, voice, poll, event, GIF, and sticker messages
- Group management, announcements, pinned messages, and nicknames
- Presence and last-seen tracking with browser notifications
- JWT-based authentication, local login, and Google OAuth support
- Search, media panels, drafts, and client-side preferences

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 6, socket.io-client 4.8 |
| Backend | Node.js, Express 4, Socket.io 4.8 |
| Database | MongoDB, Mongoose 9 |
| Auth | JWT, bcryptjs, @react-oauth/google |
| Validation | Zod 3 |
| Uploads | Multer 2 |
| Styling | Plain CSS with design tokens |

## Features

### Messaging
- Direct and group conversations
- Message edit, delete, reply, forward, star, and reactions
- Shared media panel for images, videos, documents, links, audio, and GIFs
- Draft persistence per conversation
- Cursor-based message pagination and in-conversation search

### Presence and realtime updates
- Online/offline status indicators
- Typing indicators
- Delivery and read receipts
- Socket-based conversation and message synchronization

### User experience
- Light and dark theme support
- Custom accent colors, font size, and density settings
- Responsive layout for desktop and mobile
- Browser notifications with mute and per-conversation controls

## Project Structure

```text
.
├── client/                 # React/Vite frontend
├── server/                 # Express + Socket.io backend
├── package.json            # npm workspaces root
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB instance or Atlas connection string
- Optional: Giphy API key for GIF support

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Example server configuration:

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
GOOGLE_CLIENT_ID=your-google-client-id
```

Example client configuration:

```env
VITE_API_URL=/api
VITE_SERVER_URL=
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GIPHY_API_KEY=your-giphy-api-key
```

3. Start the app

```bash
npm run dev
```

The project runs with:

- Frontend: http://localhost:5173
- Backend: http://localhost:5009

## Production Build

```bash
npm run build
npm start
```

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`

### Users
- `GET /api/users?q=...`

### Conversations
- `GET /api/conversations`
- `POST /api/conversations/direct`
- `POST /api/conversations/group`
- `PATCH /api/conversations/:id/group`
- `PATCH /api/conversations/:id/group/announcement`
- `PATCH /api/conversations/:id/group/nickname`
- `POST /api/conversations/:id/group/participants`
- `PATCH /api/conversations/:id/group/participants/:pid`
- `DELETE /api/conversations/:id/group/participants/:pid`
- `GET /api/conversations/:id/messages`
- `GET /api/conversations/:id/messages/search`
- `GET /api/conversations/:id/messages/pinned`
- `GET /api/conversations/:id/media`
- `POST /api/conversations/:id/messages`
- `PATCH /api/conversations/:id/messages/:mid`
- `DELETE /api/conversations/:id/messages/:mid`
- `POST /api/conversations/:id/read`
- `POST /api/conversations/:id/messages/:mid/reactions`
- `DELETE /api/conversations/:id/messages/:mid/reactions/:emoji`
- `POST /api/conversations/:id/messages/:mid/vote`
- `PATCH /api/conversations/:id/messages/:mid/pin`

### Uploads
- `POST /api/uploads`

### Health
- `GET /api/health`

## Socket.io Events

### Client to server
- `conversation:join`
- `conversation:leave`
- `typing:start`
- `typing:stop`

### Server to client
- `presence:snapshot`
- `presence:update`
- `conversation:upsert`
- `conversation:removed`
- `message:new`
- `message:update`
- `message:status`
- `message:pinned`
- `typing:update`

## Notes

- The project uses a Vite dev proxy for frontend API requests.
- File uploads are stored under the server uploads directory.
- Credentials and personal data should never be committed to source control.


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
