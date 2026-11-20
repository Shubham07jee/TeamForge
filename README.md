# TeamForge
**A modern project and task collaboration platform for teams.**
TeamForge is a full-stack project management application designed to help teams organize projects, manage tasks, track progress, and collaborate through a centralized workspace.
The project is built with React, Node.js, Express, PostgreSQL, and Prisma.
---
## Features
### Implemented
- User registration and login
- JWT-based authentication
- Protected API endpoints
- PostgreSQL database integration
- Project creation and listing
- Task creation, editing, and deletion
- Task descriptions and due dates
- Task priority management
- Task status management
- List and Kanban board views
- Persistent task data through the backend API
### Planned
- Project editing and deletion
- Project-specific task filtering
- Team member invitations and role management
- Task comments and activity history
- Notifications
- Dashboard analytics
- Workload management
- Real-time collaboration
- Automated testing and expanded security checks
---
## Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| API | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT |
| Password Security | bcryptjs |
| Database Runtime | Docker |
---
## Project Structure
```text
TeamForge/
|
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |-- src/
|   |   |-- config/
|   |   |-- server.js
|   |-- .env.example
|   |-- package.json
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- index.css
|   |   |-- main.jsx
|   |-- package.json
|
|-- backups/
|-- docker-compose.yml
|-- README.md
```
---
## Getting Started
### Prerequisites
Install the following:
- Node.js (LTS recommended)
- npm
- Docker Desktop
- Git
### 1. Clone the repository
```bash
git clone https://github.com/Shubham07jee/TeamForge.git
cd TeamForge
```
### 2. Start PostgreSQL
From the project root:
```bash
docker compose up -d
```
Verify the database container:
```bash
docker compose ps
```
### 3. Configure the backend
```bash
cd backend
npm install
```
Create your local environment file:
**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```
Open `backend/.env` and configure the database connection string, JWT secret, and any other required environment variables according to `backend/.env.example`.
Never commit `.env` files or production secrets.
### 4. Apply database migrations
From the backend directory:
```bash
npx prisma migrate deploy
```
### 5. Start the backend
```bash
npm run dev
```
The backend API is configured to run on:
```text
http://localhost:5000
```
### 6. Start the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the localhost URL printed by Vite in your terminal, usually:
```text
http://localhost:5173
```
---
## API Overview
The backend exposes REST API endpoints under `/api`.
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET | `/api/db-check` | Database connectivity check |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve authenticated user |
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/tasks` | Retrieve accessible tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
Protected endpoints require a valid JWT access token.
---
## Database
TeamForge uses PostgreSQL with Prisma ORM.
Current core data models include:
- User
- Project
- ProjectMember
- Task
Task statuses:
- `TODO`
- `IN_PROGRESS`
- `DONE`
Task priorities:
- `LOW`
- `MEDIUM`
- `HIGH`
Database migrations are maintained in:
```text
backend/prisma/migrations/
```
---
## Development
Frontend:
```bash
cd frontend
npm run dev
npm run lint
npm run build
```
Backend:
```bash
cd backend
npm run dev
```
Check backend JavaScript syntax:
```bash
node --check src/server.js
```
---
## Security
- Authentication uses JWT.
- Passwords are protected using bcryptjs.
- Protected API routes require authentication.
- Environment variables are used for sensitive configuration.
- Database access is handled through Prisma.
For local development, use your own environment secrets. Never publish production credentials.
---
## Roadmap
TeamForge is under active development.
| Feature | Status |
|---|---|
| Authentication | Implemented |
| Database integration | Implemented |
| Project creation | Implemented |
| Task management | Implemented |
| Kanban board | Implemented |
| Project management CRUD | In progress |
| Team collaboration | Planned |
| Comments and activity feed | Planned |
| Notifications | Planned |
| Analytics | Planned |
| Real-time collaboration | Planned |
---
## Contributing
Contributions, suggestions, and bug reports are welcome.
1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Test your changes.
5. Submit a pull request.
---
## Author
**Shubham Chaudhari**
GitHub: [@Shubham07jee](https://github.com/Shubham07jee)
Project: [TeamForge](https://github.com/Shubham07jee/TeamForge)
---
*TeamForge — Plan together. Build together. Deliver together.*
