# Team Task Manager

A full-stack web application for managing projects and tasks with role-based access control. Teams can create projects, invite members, assign tasks, and track progress — all in one place.

## Live Demo

- **Frontend:** https://task-maneger-frontend.vercel.app
- **Backend API:** https://taskmaneger-production-e880.up.railway.app

---

## Features

- **Authentication** — Signup and login with JWT sessions (7-day expiry)
- **Project Management** — Create projects, invite members by email, remove members
- **Task Management** — Create tasks with title, description, priority, due date, and assignee
- **Role-Based Access Control** — Admins have full control; Members can only update task status
- **Dashboard** — Active tasks, overdue count, and project progress bars
- **Status Tracking** — TODO → IN_PROGRESS → IN_REVIEW → DONE
- **Overdue Detection** — Tasks past due date highlighted in red automatically

---

## Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** via Railway
- **Prisma ORM** — schema, migrations, queries
- **JWT** — authentication tokens
- **bcryptjs** — password hashing

### Frontend
- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Zustand** — global state management
- **Axios** — HTTP client with interceptors
- **React Router v6** — client-side routing
- **React Hot Toast** — notifications

### Deployment
- **Backend** → Railway (with auto Prisma migrations on startup)
- **Frontend** → Vercel

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       └── 20260505090443_init/
│   │           └── migration.sql
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── taskController.ts
│   │   │   └── dashboardController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts         ← JWT verification
│   │   │   └── rbac.ts         ← role-based access
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── tasks.ts
│   │   │   └── dashboard.ts
│   │   └── index.ts
│   ├── railway.json
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts         ← base URL + auth interceptor
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── SignupPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   └── ProjectPage.tsx
    │   ├── store/
    │   │   └── auth.ts          ← Zustand auth store
    │   ├── types.ts
    │   └── App.tsx
    ├── vercel.json
    └── package.json
```

---

## Database Schema

```
User ──────────────── ProjectMember ──── Project
 │                                          │
 │ (createdById)                            │
 │ (assigneeId)                             │
 └──────────────── Task ───────────────────┘
```

### Tables

| Table | Description |
|---|---|
| `User` | Anyone who signs up. Stores name, email, hashed password. |
| `Project` | A workspace with a name and description. |
| `ProjectMember` | Junction table linking users to projects with a role (ADMIN/MEMBER). |
| `Task` | Work item inside a project with status, priority, due date, assignee. |

### Enums

```
Role:        ADMIN | MEMBER
TaskStatus:  TODO | IN_PROGRESS | IN_REVIEW | DONE
Priority:    LOW | MEDIUM | HIGH | URGENT
```

### Key Design Decisions

- **Junction table for RBAC** — `ProjectMember` stores the role per project, so one user can be Admin in Project A and Member in Project B
- **Unique constraint** on `(projectId, userId)` — prevents duplicate membership
- **Cascade deletes** — deleting a project removes all its tasks and members automatically
- **Two user FKs on Task** — `createdById` (who made it) and `assigneeId` (who does it) are separate

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register new user |
| POST | `/auth/login` | Public | Login and get JWT |
| GET | `/auth/me` | Auth | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/projects` | Auth | List user's projects |
| POST | `/projects` | Auth | Create project |
| GET | `/projects/:id` | Member | Get project with tasks and members |
| DELETE | `/projects/:id` | Admin | Delete project |
| POST | `/projects/:id/members` | Admin | Invite member by email |
| DELETE | `/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/projects/:id/tasks` | Member | List tasks |
| POST | `/projects/:id/tasks` | Admin | Create task |
| PATCH | `/projects/:id/tasks/:taskId` | Member | Update task (Members: status only) |
| DELETE | `/projects/:id/tasks/:taskId` | Admin | Delete task |

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/dashboard` | Auth | My tasks, overdue count, project summaries |

---

## Role-Based Access

| Action | Admin | Member |
|---|---|---|
| View project and tasks | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Create tasks | ✅ | ❌ |
| Edit tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Delete project | ✅ | ❌ |

> RBAC is enforced at the middleware level on the backend — not just the UI. Direct API calls from Members return `403 Forbidden`.

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Run migrations and start:
```bash
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_API_URL="http://localhost:3001"
```

Start:
```bash
npm run dev
```

Open `http://localhost:5173`

---

## Deployment

### Backend — Railway

1. Connect GitHub repo → set **Root Directory** to `backend`
2. Add **PostgreSQL** plugin
3. Set environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Add Reference → Postgres plugin |
| `JWT_SECRET` | any long random string |
| `PORT` | `3001` |
| `FRONTEND_URL` | your Vercel URL (no trailing slash) |

Start command is auto-detected from `railway.json`:
```
npx prisma migrate deploy && node dist/index.js
```

### Frontend — Vercel

1. Connect GitHub repo → set **Root Directory** to `frontend`
2. Set environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | your Railway backend URL (no trailing slash) |

---
