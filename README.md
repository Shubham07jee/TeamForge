# TeamForge
**Plan together. Build together. Deliver together.**
TeamForge is a full-stack project and task collaboration platform designed to help teams organize projects, coordinate responsibilities, and track work from a centralized workspace.
The application combines a React frontend with an Express API, PostgreSQL database, and Prisma ORM.
## Features
### Authentication and accounts
- User registration and login
- JWT-based authentication
- Protected API endpoints
- Profile viewing and editing
- Profile picture upload and removal using Cloudinary
### Projects and teams
- Create and view projects
- Project ownership
- Add team members by email
- Remove project members
- Project membership-based access checks
### Task management
- Create, update, and delete tasks
- Task descriptions and due dates
- Task priorities and statuses
- Project-associated tasks
- List and Kanban task views
### Workspace
- Dashboard overview and task progress information
- Responsive interface for desktop and mobile devices
## Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, JavaScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| Charts | Recharts |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 |
| Authentication | JSON Web Tokens |
| Password hashing | bcryptjs |
| Image storage | Cloudinary |
| Database driver | node-postgres (`pg`) |
| Local database | Docker Compose |
## Project Structure
```text
TeamForge/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backups/
├── docker-compose.yml
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```
## Getting Started
### Prerequisites
Install:
- Node.js (22 LTS recommended)
- npm
- Docker Desktop with Docker Compose
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
Check the database container:
```bash
docker compose ps
```
The current local Compose configuration uses:
- Database: `teamforge_db`
- User: `teamforge_user`
- Port: `5432`
**Important:** The credentials currently present in the Compose file are for local development only. Replace them before using this configuration in any shared or production environment.
### 3. Configure the backend
```bash
cd backend
npm install
```
Create your environment file:
**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```
Configure the variables in `backend/.env`:
| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `FRONTEND_URL` | Frontend origin allowed by CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
For the default local Docker Compose configuration, the database URL is:
```env
DATABASE_URL="postgresql://teamforge_user:teamforge_local_2026@localhost:5432/teamforge_db?schema=public"
```
Use a strong, unique JWT secret. Cloudinary credentials are required for profile picture uploads and removal; other application functionality can be developed without configuring image uploads.
### 4. Apply database migrations
From the `backend` directory:
```bash
npx prisma migrate deploy
```
Generate the Prisma client:
```bash
npm run db:generate
```
### 5. Start the backend
```bash
npm run dev
```
The API runs on:
```text
http://localhost:5000
```
The health endpoint is:
```text
http://localhost:5000/api/health
```
### 6. Configure and start the frontend
Open a second terminal:
```bash
cd frontend
npm install
```
Create the frontend environment file:
**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```
The example configures the local API address. Update `VITE_API_URL` if your backend uses a different address.
Start Vite:
```bash
npm run dev
```
Open the local URL printed by Vite, usually:
```text
http://localhost:5173
```
## Environment Configuration
### Backend
See [`backend/.env.example`](backend/.env.example).
Never commit real credentials, database passwords, JWT secrets, or Cloudinary secrets.
### Frontend
See [`frontend/.env.example`](frontend/.env.example).
`VITE_API_URL` must point to the backend API base URL, including `/api`, when the frontend and backend are deployed separately.
Frontend environment variables are exposed to the browser. Never put private credentials in frontend variables.
## API Reference
All API routes are served under `/api`.
### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | API health check |
| GET | `/api/db-check` | Database connectivity check |
### Authentication
| Method | Endpoint | Authentication |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Required |
### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Retrieve profile |
| PATCH | `/api/profile` | Update profile |
| POST | `/api/profile/avatar` | Upload profile picture |
| DELETE | `/api/profile/avatar` | Remove profile picture |
### Projects and teams
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create project |
| GET | `/api/team` | Retrieve team information |
| POST | `/api/projects/:projectId/members` | Add a project member |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove a project member |
### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List accessible tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
Protected endpoints require a valid JWT access token in the `Authorization` header:
```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```
The avatar upload endpoint accepts an image in the multipart form field named `avatar`.
## Database
TeamForge uses PostgreSQL with Prisma ORM.
Current core models:
- `User`
- `Project`
- `ProjectMember`
- `Task`
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
Useful database commands, run from `backend/`:
```bash
npm run db:migrate
npm run db:generate
npm run db:studio
```
## Development Commands
### Frontend
```bash
cd frontend
npm run dev
npm run lint
npm run build
npm run preview
```
### Backend
```bash
cd backend
npm run dev
npm start
npm run db:generate
npm run db:studio
```
Check backend JavaScript syntax:
```bash
node --check src/server.js
```
## Deployment
TeamForge supports separate frontend and backend deployments.
Configure the frontend's `VITE_API_URL` to point to the deployed backend API, and configure the backend's `FRONTEND_URL` to match the deployed frontend origin.
Set all database, authentication, and Cloudinary secrets through the deployment platform's environment-variable settings.
Do not use local development credentials in production.
## Security Notes
- Passwords are hashed with bcryptjs.
- Authentication uses JWT.
- Protected API routes use authentication middleware.
- Helmet provides HTTP security headers.
- CORS is configured for allowed frontend origins.
- Database access is handled through Prisma.
- Production secrets must be stored in environment variables.
Report security vulnerabilities privately to the repository maintainer rather than posting exploitable details in public issues.
## Roadmap
TeamForge is under active development. Future improvements may include:
- Expanded project editing and lifecycle management
- Task comments and activity history
- More advanced team permissions
- Expanded notifications
- Workload and collaboration improvements
- Automated backend integration testing
## Contributing
Contributions, suggestions, and bug reports are welcome.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.
## License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
## Author
**Shubham Chaudhari**
- GitHub: [@Shubham07jee](https://github.com/Shubham07jee)
- Repository: [TeamForge](https://github.com/Shubham07jee/TeamForge)
---
**TeamForge — Plan together. Build together. Deliver together.**
