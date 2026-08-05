# SyncWrite

Live link:  https://synkwrite.netlify.app/

**SyncWrite** is a production-ready, real-time collaborative document editor. It enables multiple users to seamlessly edit documents simultaneously, manage permissions, leave threaded comments, and track document revision history.

---

## 📖 Project Overview and Purpose
SyncWrite provides a robust platform for real-time collaboration. It combines a rich-text editing experience with a powerful backend that handles conflict-free real-time synchronization, structured document metadata, user authentication, and granular access control. 

## 🚀 Key Features (Implemented)
- **Real-Time Collaboration**: True real-time typing and cursor presence using Yjs (CRDT) and WebSockets.
- **Rich-Text Editor**: Powered by Tiptap. Supports bold, italic, underline, highlight, text alignment, colors, fonts, images, and tables.
- **Authentication**: Built with `better-auth`. Supports Email/Password authentication and Google Social Login.
- **Document Management**: Dashboard to view recent, owned, and shared documents. Create, open, rename, duplicate, and delete documents.
- **Roles & Permissions**: Granular access control with defined roles: **Owner**, **Editor**, **Commenter**, and **Viewer**.
- **Sharing**: Invite users to a document via email and assign specific roles.
- **Comments & Threads**: Leave comments on documents, reply in threads, and resolve comment threads.
- **Revision History**: Capture document snapshots, view revision history, and restore previous versions.
- **Notifications**: Real-time in-app notifications for shares, comments, and role changes with unread status tracking.
- **Exporting**: Export capabilities to PDF (via `html2pdf.js`) and Markdown (via `turndown`).

*(Note: There are currently no unimplemented "future" features documented here. All listed features are present in the codebase.)*

---

## 🛠 Technology Stack
**Frontend (Client)**
- **Framework**: React 18 & Vite
- **Routing**: React Router DOM v7
- **Editor**: Tiptap (ProseMirror)
- **Collaboration**: Yjs, y-websocket, y-prosemirror
- **Styling**: Tailwind CSS v4, Framer Motion, Lucide React

**Backend (Server)**
- **Runtime**: Node.js & Express v5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Real-Time**: `ws` (WebSockets)

---

## 🏗 Architecture Overview
SyncWrite follows a decoupled Client-Server architecture:
1. **REST API**: The Express server handles authentication, document metadata (CRUD), permissions, comments, notifications, and version history.
2. **WebSocket Server**: An integrated Node `ws` server handles real-time document synchronization. The client connects via `y-websocket` to sync Yjs CRDTs.
3. **Database Layer**: PostgreSQL stores all structured relational data (users, permissions, comments) managed via Prisma ORM. Document binary state is stored either in the database as CRDT binaries or maintained in memory by the WebSocket server and periodically persisted.

---

## ⚙️ Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (v13 or higher running locally or remotely)
- **Git**

---

## 💻 Local Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd syncwrite
```

### 2. Database & Environment Setup (Backend)
Navigate to the server directory:
```bash
cd server
npm install
```

Create your environment file:
```bash
cp .env.example .env
```

**Environment Variables (`server/.env`)**:
Update the `.env` file with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/syncwrite"
BETTER_AUTH_URL="http://localhost:5000"

# Google Social Login Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration (Leave empty for credential-free mock mode)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="noreply@syncwrite.app"
```

### 3. Database Migrations
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
# OR if using migrations:
# npx prisma migrate dev
```
Generate the Prisma client:
```bash
npx prisma generate
```

### 4. Frontend Setup
Open a new terminal and navigate to the client directory:
```bash
cd client
npm install
```

---

## 🏃‍♂️ Development Commands

**Run the Backend Server**
```bash
cd server
npm run dev
# Starts the Express server and WebSocket server on port 5000 (default)
```

**Run the Frontend Client**
```bash
cd client
npm run dev
# Starts the Vite development server (usually on port 5173)
```

---

## 📦 Production Build & Run

**Backend:**
```bash
cd server
npm run build
# Starts the compiled server
node dist/index.js 
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

---

## 🔐 Authentication Setup
The application uses `better-auth`. 
- **Email/Password**: Works out of the box once the database is connected. 
- **Google Auth**: To enable Google login, provide a `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend `.env` file. The server automatically registers these with the auth instance.
- **Email Verification / Password Reset**: Configured via SMTP. If SMTP variables are left blank in `.env`, the system defaults to a mock mode (check server logs for generated links).

---

## 🔌 WebSocket Configuration
The WebSocket server is attached directly to the Express HTTP server via the `upgrade` event in `server/src/index.ts`. 
Clients connect to `ws://localhost:5000` using `y-websocket`. The server handles room-based collaboration natively.

---

## 📚 API Documentation
A complete OpenAPI 3.0 specification is available in the repository.
- **Location**: `docs/openApi.yaml`
- You can load this file into [Swagger UI](https://editor.swagger.io/) or Postman to view detailed endpoints for Authentication, Documents, Shares, Comments, Revisions, and Notifications.

---

## 🧪 Testing and Verification
The repository includes manual test scripts to verify integrations:
- **Backend Auth Test**: `server/test-google-auth.js`
- **Frontend Auth Test**: `client/test_auth.ts`

Run them manually using Node or a TypeScript executor like `tsx`.

---

## 🐳 Docker
*(Note: Dockerfiles and docker-compose configurations are not currently implemented in this repository.)*

---

## 📁 Project Folder Structure
```text
syncwrite/
├── client/              # React/Vite frontend application
│   ├── src/             # Frontend source code (components, hooks, pages)
│   ├── package.json
│   └── tailwind.config.js
├── server/              # Node.js/Express backend & WebSocket server
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # Backend source code (routes, controllers, websockets)
│   ├── .env.example
│   └── package.json
└── docs/                # Project documentation
    └── openApi.yaml     # OpenAPI 3.0 API Specification
```

---

## 🛡 Security Notes
- **API Security**: The backend utilizes `helmet` for secure HTTP headers and `cors` strictly configured for the frontend origin.
- **Auth Security**: Passwords are securely hashed by `better-auth`. Session tokens are managed securely via cookies.
- **Payload Limits**: Express JSON and URL-encoded body parsers are limited to `10mb` to prevent payload abuse.

---

## 🐛 Troubleshooting & Common Issues
1. **Database Connection Error**: Ensure PostgreSQL is running and the `DATABASE_URL` in `server/.env` contains the correct username, password, and port.
2. **WebSocket Disconnections**: If the editor is not syncing, check the browser console for CORS or WebSocket connection refused errors. Ensure the backend server is running on port 5000.
3. **Prisma Client Not Found**: If the backend throws a Prisma error on startup, ensure you run `npx prisma generate` in the `server` directory.
