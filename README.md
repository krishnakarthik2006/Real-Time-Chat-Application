# PulseChat

A full-stack real-time chat application built with React, Node.js, Socket.io, and MySQL.

## Included Features

- JWT authentication with register/login flows
- One-to-one conversations
- Real-time messaging with Socket.io
- Typing indicators
- Online/offline presence
- Group chat
- File sharing
- Sent, delivered, and seen message states
- Reply to messages
- Edit and delete your own messages
- Search messages inside a conversation
- Group admin controls for rename, add members, remove members, and role updates
- Browser notifications for new incoming messages

## Tech Stack

- React + Vite
- Node.js + Express
- Socket.io
- MySQL

## Important MySQL Note

`phpMyAdmin` is the management UI, not the database server itself. The app connects directly to your MySQL server using the credentials in `server/.env`.

If you are using XAMPP, WAMP, Laragon, or a standalone MySQL install:

1. Keep the MySQL service running.
2. Configure the database credentials in `server/.env`.
3. The backend will create the database and tables automatically on startup if the credentials are valid.

## Project Structure

```text
.
|-- client
|   |-- src
|   |   |-- api
|   |   |-- auth
|   |   |-- components
|   |   |-- hooks
|   |   |-- styles
|-- server
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- routes
|   |   |-- services
|   |   |-- utils
|   |   |-- validators
|   |-- uploads
```

## Setup

### 1. Environment Files

Create these files from the examples:

- `client/.env` from `client/.env.example`
- `server/.env` from `server/.env.example`

### 2. Server Environment

Example values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=real_time_chat_app
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run in Development

```bash
npm run dev
```

This starts:

- React client on `http://localhost:5173`
- Node/Socket.io server on `http://localhost:5000`

## Production Build

```bash
npm run build
```

## How the Real-Time Flow Works

- Authentication is handled with JWT tokens.
- The REST API creates users, conversations, messages, and uploads.
- Socket.io handles presence updates, typing events, delivery updates, and incoming messages.
- MySQL stores users, conversations, participants, and message history.

## Main API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users?q=`
- `GET /api/conversations`
- `POST /api/conversations/direct`
- `POST /api/conversations/group`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/read`
- `POST /api/uploads`

## Suggested Manual Test Flow

1. Register two users.
2. Start a direct chat from one account.
3. Open the second account in another browser window.
4. Send messages and confirm:
   - live delivery
   - typing indicator
   - online/offline badge
   - seen status
5. Create a group and send a file.
6. Reply to a message, edit it, then delete it.
7. Search for a recent message inside a conversation.
8. Open a group chat and test admin actions.
9. Enable browser notifications and send a message from another account.

## Notes

- Uploaded files are stored in `server/uploads`.
- The backend auto-creates the schema on startup.
- The UI is responsive and works on desktop and mobile layouts.
