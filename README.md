 <div align="center">

<img src="frontend/public/teamforge-logo.svg" width="120" alt="TeamForge Logo" />

# TEAMFORGE

### ✦ Plan together. Build together. Deliver together. ✦

A workspace where teams turn ideas into execution.

[![Live Demo](https://img.shields.io/badge/🌐_LIVE_DEMO-Visit_TeamForge-6366f1?style=for-the-badge)](https://team-forge-rouge.vercel.app/)
[![Latest Release](https://img.shields.io/github/v/release/Shubham07jee/TeamForge?style=for-the-badge&color=8b5cf6)](https://github.com/Shubham07jee/TeamForge/releases/latest)
[![License](https://img.shields.io/github/license/Shubham07jee/TeamForge?style=for-the-badge)](LICENSE)

[Explore the App](https://team-forge-rouge.vercel.app/) · [Android Download](https://github.com/Shubham07jee/TeamForge/releases/latest) · [Report an Issue](https://github.com/Shubham07jee/TeamForge/issues)

</div>

---

## ⚡ One workspace. Every moving part.

TeamForge brings project organization, task management, and team collaboration into one place.

No scattered workflows. No unnecessary complexity. Just a clearer way to move work forward.

## ✨ What you can do

| | Feature | Description |
|---|---|---|
| 🔐 | **Authentication** | Secure registration, login and JWT-based sessions |
| 👥 | **Team Workspace** | Organize projects and manage team members |
| 📁 | **Projects** | Create projects and coordinate ownership |
| ✅ | **Task Management** | Create, update, prioritize and track tasks |
| 🗂️ | **Kanban Board** | Visualize tasks through workflow stages |
| 📊 | **Dashboard** | Get an overview of project and task progress |
| 🖼️ | **Profiles** | Manage profiles and upload avatars |
| 📱 | **Android App** | Take TeamForge with you using Capacitor |

---

## 🖥️ See TeamForge in action

**Live application:** [team-forge-rouge.vercel.app](https://team-forge-rouge.vercel.app/)

> Screenshots of the actual application will be added here.

---

## 📲 Android application

<div align="center">

### Your workspace, on the move.

[![Download APK](https://img.shields.io/badge/⬇_DOWNLOAD-TEAMFORGE_v1.0.0-6366f1?style=for-the-badge)](https://github.com/Shubham07jee/TeamForge/releases/tag/v1.0.0)

**Android package:** `com.teamforge.app`  
**Version:** `1.0.0`

</div>

1. Visit the [v1.0.0 release page](https://github.com/Shubham07jee/TeamForge/releases/tag/v1.0.0).
2. Download `TeamForge-Release.apk`.
3. Open the APK on your Android device.
4. Allow installation from the source if prompted.
5. Install and launch TeamForge.

---

## 🛠️ Built with

<div align="center">

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)

</div>

| Layer | Technology |
|---|---|
| Frontend | React 19, JavaScript, Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| Charts | Recharts |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 |
| Authentication | JWT, bcryptjs |
| Image storage | Cloudinary |
| Android | Capacitor |

---

## 🏗️ How it works

```text
          ┌─────────────────────────┐
          │      TEAMFORGE UI       │
          │       React + Vite      │
          └────────────┬────────────┘
                       │
                    HTTP API
                       │
          ┌────────────▼────────────┐
          │      EXPRESS API        │
          │  Authentication        │
          │  Projects & Tasks       │
          └────────────┬────────────┘
                       │
                   Prisma ORM
                       │
          ┌────────────▼────────────┐
          │      POSTGRESQL         │
          │        Database         │
          └─────────────────────────┘

          Android → Capacitor
          Images  → Cloudinary
```

---

## 🚀 Run locally

### Prerequisites

- Node.js and npm
- PostgreSQL 17, or Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Shubham07jee/TeamForge.git
cd TeamForge
```

### 2. Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configure the backend environment variables in `backend/.env`, including your database connection and authentication settings.

Start the backend:

```bash
npm run dev
```

Backend: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

### 3. Configure the frontend

Open a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Configure `VITE_API_URL` if your backend uses a different address.

Start the frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

---

## ⚙️ Environment variables

| File | Purpose |
|---|---|
| `backend/.env.example` | Backend configuration template |
| `frontend/.env.example` | Frontend configuration template |

Never commit real credentials, database passwords, JWT secrets or Cloudinary secrets.

Frontend variables are exposed to the browser. Never put private credentials in them.

---

## 🔌 API overview

All API routes are served under `/api`.

| Area | Endpoints |
|---|---|
| Health | `/health`, `/db-check` |
| Authentication | `/auth/register`, `/auth/login`, `/auth/me` |
| Profile | `/profile`, `/profile/avatar` |
| Projects | `/projects`, `/team` |
| Project members | `/projects/:projectId/members` |
| Tasks | `/tasks`, `/tasks/:id` |

Protected endpoints require a valid JWT access token.

---

## 🗄️ Database

TeamForge uses PostgreSQL with Prisma ORM.

Core models:

- `User`
- `Project`
- `ProjectMember`
- `Task`

Task statuses: `TODO`, `IN_PROGRESS`, `DONE`

Task priorities: `LOW`, `MEDIUM`, `HIGH`

Migrations are maintained in `backend/prisma/migrations/`.

---

## 🧑‍💻 Development commands

**Frontend**

```bash
cd frontend
npm run dev
npm run lint
npm run build
npm run preview
```

**Backend**

```bash
cd backend
npm run dev
npm start
npm run db:migrate
npm run db:generate
npm run db:studio
```

---

## 🔒 Security

- Password hashing with bcryptjs.
- JWT-based authentication.
- Protected API routes.
- Helmet security headers.
- Configurable CORS.
- Prisma-based database access.
- Environment-based production secrets.

For security vulnerabilities, contact the repository maintainer privately rather than publishing exploitable details in public issues.

---

## 🗺️ What's next?

TeamForge is actively evolving.

- [ ] Expanded project lifecycle management
- [ ] Task comments and activity history
- [ ] More advanced team permissions
- [ ] Expanded notifications
- [ ] Workload and collaboration improvements
- [ ] Automated backend integration testing

---

## 🤝 Contributing

Contributions, ideas and bug reports are welcome!

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

- [Report a bug](https://github.com/Shubham07jee/TeamForge/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/Shubham07jee/TeamForge/issues/new?template=feature_request.yml)

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

### Made with focus. Built for teams. 🚀

**[⭐ Star TeamForge](https://github.com/Shubham07jee/TeamForge)** if you like the project.

[Website](https://team-forge-rouge.vercel.app/) · [GitHub](https://github.com/Shubham07jee) · [Releases](https://github.com/Shubham07jee/TeamForge/releases)

<sub>TeamForge — Plan together. Build together. Deliver together.</sub>

</div>
