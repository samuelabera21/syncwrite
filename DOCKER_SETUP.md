# SyncWrite Docker Setup Guide

## Quick Start
If you just want to run SyncWrite and already have your `.env` files configured:

```cmd
docker compose up -d --build
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

---

## 1. Overview
SyncWrite is a full-stack collaborative real-time editing application. Its Dockerized environment consists of three primary services:
- **Frontend (client)**: Built with Vite, React, and Tailwind CSS. The compiled assets are served through a lightweight **Nginx** web server.
- **Backend (server)**: A Node.js/Express server providing REST APIs and WebSocket (`y-websocket`) real-time collaboration.
- **Database (db)**: A **PostgreSQL 15** database running securely inside a container.

These services communicate through a dedicated Docker internal network. The frontend talks to the backend via exposed host ports, and the backend communicates directly with the database container via its internal Docker network name (`db`).

## 2. Architecture

```text
       Browser (Host)
             │
             │ (http://localhost:5173)
             ▼
   ┌──────────────────────┐
   │ client (Nginx)       │
   │ Port: 80 -> 5173     │
   └──────────────────────┘
             │
             │ (http://localhost:5000 API/WS calls)
             ▼
   ┌──────────────────────┐
   │ server (Node.js)     │
   │ Port: 5000 -> 5000   │
   └─────────┬────────────┘
             │
             │ (postgresql://user:password@db:5432/syncwrite)
             ▼
   ┌──────────────────────┐
   │ db (PostgreSQL 15)   │
   │ Port: 5432 -> 5432   │
   └──────────────────────┘
```
**Network Setup**: Docker Compose automatically bridges these services on a default internal network. The `server` resolves `db` automatically. 

## 3. Prerequisites
To run this project, you must install:
- **Docker Desktop** (for Windows/macOS) or Docker Engine (for Linux).
- **Docker Compose** (included with Docker Desktop).
- OS Requirements: This setup supports Windows, macOS, and Linux. For Windows, WSL2 backend for Docker Desktop is recommended for optimal performance.

## 4. Project Structure
Important Docker-related files:
- `docker-compose.yml`: Orchestrates the database, backend, and frontend containers.
- `client/Dockerfile`: Multi-stage build that compiles the Vite frontend and serves it using Nginx.
- `client/nginx.conf`: Nginx configuration to support SPA routing (redirects 404s to `index.html`).
- `client/.dockerignore`: Prevents copying `node_modules/` and local `dist/` into the build context.
- `server/Dockerfile`: Installs dependencies (`openssl` for Alpine), runs Prisma generate, compiles TypeScript, and runs database migrations on startup.
- `server/.dockerignore`: Excludes host `node_modules/`, `dist/`, and local secrets (`.env`).
- `server/.env`: Backend environment variables (Not tracked in git).

## 5. Docker Compose Configuration
The `docker-compose.yml` file defines three services:

### `db`
- **Image**: `postgres:15-alpine`
- **Restart Policy**: `unless-stopped`
- **Environment**: Sets the initial database name, username, and password.
- **Volumes**: Maps `pgdata` to `/var/lib/postgresql/data` for database persistence.
- **Healthcheck**: Uses `pg_isready` to ensure the database is accepting connections before starting the server.

### `server`
- **Build**: Uses `./server/Dockerfile`.
- **Ports**: Exposes internal port `5000` to host port `5000`.
- **Environment**: Automatically inherits the local `./server/.env` file. Overrides `DATABASE_URL` to point to the `db` container, and `BETTER_AUTH_URL` to `http://localhost:5000`.
- **Depends On**: Waits for the `db` service to pass its healthcheck before starting.

### `client`
- **Build**: Uses `./client/Dockerfile`.
- **Ports**: Maps Nginx's internal port `80` to host port `5173`.
- **Depends On**: Waits for the `server` container to start.

## 6. Ports

| Service | Container Port | Host Port | Purpose |
|---------|----------------|-----------|---------|
| `client` | 80 | 5173 | Nginx Web Server serving the Frontend |
| `server` | 5000 | 5000 | Node.js Backend API and WebSockets |
| `db` | 5432 | 5432 | PostgreSQL Database (Exposed for easy local pgAdmin access) |

## 7. Database
**PostgreSQL is running entirely inside Docker.**
- **Database Name**: `syncwrite`
- **Database User**: `user`
- **Database Password**: `password` (As configured in `docker-compose.yml`)
- **Persistence**: Data is saved to a persistent Docker named volume (`pgdata`). 
- **Restarting**: If the container stops or restarts, your data remains safe in the volume.
- **Removing Containers**: Using `docker compose down` will remove the container but KEEP your data.
- **WARNING**: Deleting the volume (e.g., via Docker Desktop GUI or `docker compose down -v`) **WILL PERMANENTLY DELETE** your local development database.

## 8. Prisma
The backend uses **Prisma ORM**.
- **Schema**: Defined in `server/prisma/schema.prisma`.
- **Client Generation**: Happens automatically inside `server/Dockerfile` during `npm ci`.
- **Migrations**: The server `Dockerfile` sets the startup command to: `npx prisma migrate deploy && node dist/src/index.js`.
- **When Migrations Run**: Every time the `server` container boots, it checks the `server/prisma/migrations/` folder. If new migrations exist, they are applied automatically to the PostgreSQL container before the Node API starts.
- **Creating Migrations**: When developing locally, modify `schema.prisma`, then generate the migration by running:
  ```cmd
  docker compose exec server npx prisma migrate dev --name your_migration_name
  ```

## 9. First-Time Setup
From a completely clean clone of the project:

1. **Configure Environment Variables**:
   Copy `.env.example` files to `.env` in the `server` directory and configure the missing secrets.
   
2. **Build and Start**:
   ```cmd
   docker compose up -d --build
   ```

3. **Verify**:
   Run `docker compose ps` to ensure all 3 services state `Up` (and `db` is `healthy`).

4. **Access**:
   Open a browser and navigate to `http://localhost:5173`.

## 10. Normal Startup
To start the application when you already have it built:
```cmd
docker compose up -d
```
To verify running containers:
```cmd
docker compose ps
```

## 11. Rebuilding After Code Changes
If you modify `server` or `client` source code (`.ts`, `.tsx`, `package.json`, etc.), you must rebuild the containers:
```cmd
docker compose up -d --build
```
*Note: You do not need a rebuild if you are only modifying `.env` files, but you DO need to restart the container using `docker compose restart server`.*

## 12. Stopping the Application
To stop and remove the containers, networks, and images created by `up`:
```cmd
docker compose down
```
*(This gracefully stops the application but keeps your database data intact.)*

## 13. Database Persistence
The `pgdata` volume ensures your PostgreSQL data outlives the container lifecycle.
- `docker compose down` : Removes containers. Data is **KEPT**.
- `docker compose down -v` : Removes containers **AND VOLUMES**. Your database is **DESTROYED**. Use this only when you want to wipe the local database clean.

## 14. pgAdmin 4
Because PostgreSQL maps port 5432 to the host, you can easily connect GUI tools like pgAdmin or DBeaver:

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `syncwrite`
- **Username**: `user`
- **Password**: `password`

**Port Conflicts**: If you already have PostgreSQL installed directly on your Windows/macOS machine running on port 5432, Docker will throw a "Port already in use" or "bind" error. 
*Resolution*: Stop your local host PostgreSQL service, or change the exposed port in `docker-compose.yml` from `"5432:5432"` to `"5433:5432"`, and connect pgAdmin to 5433.

## 15. Manual Database Management
To open a `psql` shell directly inside the database container:
```cmd
docker compose exec db psql -U user -d syncwrite
```
Inside `psql`:
- List tables: `\dt`
- Select users: `SELECT id, email, "emailVerified" FROM users;`
- Update a record: `UPDATE users SET "emailVerified" = true WHERE email = 'test@example.com';`
- Quit: `\q`

*WARNING*: Manual `UPDATE` and `DELETE` operations affect the live application database immediately.

## 16. Useful Docker Commands

- **Start in background**: `docker compose up -d`
- **Force rebuild & start**: `docker compose up -d --build`
- **Stop**: `docker compose down`
- **Stop & Wipe Database**: `docker compose down -v`
- **Check Status**: `docker compose ps`
- **Tail All Logs**: `docker compose logs -f`
- **Tail Specific Logs**: `docker compose logs --tail=200 server`
- **Restart Backend**: `docker compose restart server`
- **Open Backend Shell**: `docker compose exec server sh`
- **Validate Compose File**: `docker compose config`

## 17. Troubleshooting

### npm ci / package-lock mismatch
- **Identification**: Client or Server container fails to build with an `npm ci` error stating `package-lock.json` is not in sync.
- **Command**: `docker compose logs server` (or client)
- **Fix**: Run `npm install` locally on your host in the respective directory to regenerate a clean `package-lock.json`, commit it, and rebuild.

### Port 5432 Already in Use
- **Identification**: `Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use`
- **Fix**: Stop the local PostgreSQL service running on your machine. On Windows: Open `services.msc`, find PostgreSQL, and click Stop.

### Backend API Not Responding / Frontend Cannot Reach Backend
- **Identification**: Network errors in the browser console.
- **Fix**: Ensure `docker compose ps` shows `server` as `Up`. Run `docker compose logs server` to check for runtime crashes.

### Database Schema Mismatch (Prisma)
- **Identification**: Server logs show "Column not found" or `Invalid prisma invocation`.
- **Fix**: Run `docker compose exec server npx prisma migrate dev --name sync_schema` to detect changes and generate a migration, then let it apply.

### Google OAuth Configuration Problems
- **Identification**: Login fails with Google OAuth.
- **Fix**: Ensure your `server/.env` has a valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 18. Environment Variables and Secrets
The backend relies on `server/.env`. A new developer should copy `.env.example` to `.env` and fill out:

```env
# Required for database access
DATABASE_URL=postgresql://user:password@db:5432/syncwrite
BETTER_AUTH_URL=http://localhost:5000

# Required for Authentication
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
BETTER_AUTH_SECRET=<generate-a-random-secure-string>

# Required for Emails (Optional for local testing without email verification)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-username>
SMTP_PASS=<your-smtp-password>
EMAIL_FROM="SyncWrite <noreply@syncwrite.com>"
```
**CRITICAL**: Never commit `.env` containing real credentials to Git.

## 19. Production/Security Notes
The current `docker-compose.yml` is engineered for **Local Development and Demos**. If deploying to production:
- **Never commit secrets**: Use a secure secret manager.
- **Database Passwords**: Change the `POSTGRES_PASSWORD` to a highly secure string in both `docker-compose.yml` and `.env`.
- **Network Exposure**: Remove the `ports: - "5432:5432"` binding from the `db` service to prevent the database from being accessible from the public internet.
- **HTTPS & Proxies**: Configure a reverse proxy (Nginx/Traefik) with SSL/TLS certificates for the frontend and backend.
- **OAuth Callbacks**: Ensure Google OAuth callback URLs match your production domain.

## 20. Verification Checklist
- [ ] Docker Desktop installed and running.
- [ ] `server/.env` configured with placeholders or real development credentials.
- [ ] Run `docker compose up -d --build`.
- [ ] `docker compose ps` shows `client`, `server`, and `db` as `Up`.
- [ ] `db` service shows `(healthy)`.
- [ ] Navigate to `http://localhost:5173` and see the login page.
- [ ] Connect to `localhost:5432` via pgAdmin successfully.
- [ ] Register a test account and create a document to verify full stack functionality.
