import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const adapter = new PrismaPg({
connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });
const app = express();
app.use(helmet());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));
function createToken(user) {
return jwt.sign(
{ id: user.id, email: user.email },
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);
}
async function authenticate(req, res, next) {
const header = req.headers.authorization;
const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
if (!token) {
return res.status(401).json({ success: false, message: "Please log in." });
}
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = await prisma.user.findUnique({
where: { id: payload.id },
select: { id: true, name: true, email: true }
});
if (!req.user) {
return res.status(401).json({ success: false, message: "User not found." });
}
next();
} catch {
return res.status(401).json({ success: false, message: "Invalid or expired session." });
}
}
async function canAccessProject(projectId, userId) {
return prisma.project.findFirst({
where: {
id: projectId,
OR: [
{ ownerId: userId },
{ members: { some: { userId } } }
]
}
});
}
app.get("/api/health", (req, res) => {
res.json({ success: true, message: "TeamForge backend is running!" });
});
app.get("/api/db-check", async (req, res) => {
const totalUsers = await prisma.user.count();
res.json({
success: true,
message: "Database connected successfully!",
totalUsers
});
});
// Authentication
app.post("/api/auth/register", async (req, res) => {
try {
const { name, email, password } = req.body;
if (!name?.trim() || !email?.trim() || !password) {
return res.status(400).json({
success: false,
message: "Name, email and password are required."
});
}
if (password.length < 8) {
return res.status(400).json({
success: false,
message: "Password must contain at least 8 characters."
});
}
const normalizedEmail = email.trim().toLowerCase();
const existing = await prisma.user.findUnique({
where: { email: normalizedEmail }
});
if (existing) {
return res.status(409).json({
success: false,
message: "An account with this email already exists."
});
}
const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
data: {
name: name.trim(),
email: normalizedEmail,
passwordHash
},
select: { id: true, name: true, email: true }
});
res.status(201).json({
success: true,
message: "Account created successfully.",
token: createToken(user),
user
});
} catch (error) {
console.error("Registration error:", error);
res.status(500).json({ success: false, message: "Registration failed." });
}
});
app.post("/api/auth/login", async (req, res) => {
try {
const { email, password } = req.body;
if (!email || !password) {
return res.status(400).json({
success: false,
message: "Email and password are required."
});
}
const user = await prisma.user.findUnique({
where: { email: email.trim().toLowerCase() }
});
if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
return res.status(401).json({
success: false,
message: "Invalid email or password."
});
}
const safeUser = { id: user.id, name: user.name, email: user.email };
res.json({
success: true,
message: "Login successful.",
token: createToken(safeUser),
user: safeUser
});
} catch (error) {
console.error("Login error:", error);
res.status(500).json({ success: false, message: "Login failed." });
}
});
app.get("/api/auth/me", authenticate, (req, res) => {
res.json({ success: true, user: req.user });
});
// Projects
app.get("/api/projects", authenticate, async (req, res) => {
const projects = await prisma.project.findMany({
where: {
OR: [
{ ownerId: req.user.id },
{ members: { some: { userId: req.user.id } } }
]
},
include: {
_count: { select: { tasks: true } }
},
orderBy: { updatedAt: "desc" }
});
res.json({ success: true, data: projects });
});
app.post("/api/projects", authenticate, async (req, res) => {
const { name, description } = req.body;
if (!name?.trim()) {
return res.status(400).json({
success: false,
message: "Project name is required."
});
}
const project = await prisma.project.create({
data: {
name: name.trim(),
description: description?.trim() || null,
ownerId: req.user.id,
members: {
create: { userId: req.user.id, role: "OWNER" }
}
},
include: { _count: { select: { tasks: true } } }
});
res.status(201).json({ success: true, data: project });
});
// Team
app.get("/api/team", authenticate, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } }
      ]
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { joinedAt: "asc" }
      },
      _count: { select: { tasks: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ success: true, data: projects });
});
app.post("/api/projects/:projectId/members", authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId }
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found."
      });
    }
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can add members."
      });
    }
    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter the member's email address."
      });
    }
    const member = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true }
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "No registered TeamForge account exists with that email."
      });
    }
    if (member.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You are already the project owner."
      });
    }
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: member.id
        }
      }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This user is already a project member."
      });
    }
    const membership = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: member.id,
        role: "MEMBER"
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.status(201).json({
      success: true,
      message: "Team member added successfully.",
      data: membership
    });
  } catch (error) {
    console.error("Add team member error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to add team member."
    });
  }
});
app.delete("/api/projects/:projectId/members/:memberId", authenticate, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId }
  });
  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found."
    });
  }
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Only the project owner can remove members."
    });
  }
  const membership = await prisma.projectMember.findFirst({
    where: {
      id: req.params.memberId,
      projectId: project.id
    }
  });
  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Team membership not found."
    });
  }
  if (membership.userId === project.ownerId || membership.role === "OWNER") {
    return res.status(400).json({
      success: false,
      message: "The project owner cannot be removed."
    });
  }
  await prisma.projectMember.delete({
    where: { id: membership.id }
  });
  res.json({
    success: true,
    message: "Team member removed successfully."
  });
});
// Tasks
app.get("/api/tasks", authenticate, async (req, res) => {
const projectFilter = req.query.projectId
? { id: req.query.projectId }
: {};
const tasks = await prisma.task.findMany({
where: {
project: {
...projectFilter,
OR: [
{ ownerId: req.user.id },
{ members: { some: { userId: req.user.id } } }
]
}
},
include: {
project: { select: { id: true, name: true } },
assignee: { select: { id: true, name: true, email: true } }
},
orderBy: { createdAt: "desc" }
});
res.json({ success: true, data: tasks });
});
app.post("/api/tasks", authenticate, async (req, res) => {
const { title, description, projectId, priority, dueDate } = req.body;
if (!title?.trim() || !projectId) {
return res.status(400).json({
success: false,
message: "Task title and project are required."
});
}
if (!(await canAccessProject(projectId, req.user.id))) {
return res.status(404).json({
success: false,
message: "Project not found."
});
}
const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
const task = await prisma.task.create({
data: {
title: title.trim(),
description: description?.trim() || null,
projectId,
creatorId: req.user.id,
priority: allowedPriorities.includes(priority) ? priority : "MEDIUM",
dueDate: dueDate ? new Date(dueDate) : null
},
include: { project: { select: { id: true, name: true } } }
});
res.status(201).json({ success: true, data: task });
});
app.patch("/api/tasks/:id", authenticate, async (req, res) => {
const existing = await prisma.task.findFirst({
where: {
id: req.params.id,
project: {
OR: [
{ ownerId: req.user.id },
{ members: { some: { userId: req.user.id } } }
]
}
}
});
if (!existing) {
return res.status(404).json({
success: false,
message: "Task not found."
});
}
const data = {};
const { title, description, status, priority, dueDate } = req.body;
if (typeof title === "string" && title.trim()) data.title = title.trim();
if (typeof description === "string") data.description = description.trim();
if (["TODO", "IN_PROGRESS", "DONE"].includes(status)) data.status = status;
if (["LOW", "MEDIUM", "HIGH"].includes(priority)) data.priority = priority;
  if (dueDate === null || dueDate === "") {
    data.dueDate = null;
  } else if (typeof dueDate === "string" && !Number.isNaN(Date.parse(dueDate))) {
    data.dueDate = new Date(dueDate);
  }
const task = await prisma.task.update({
where: { id: existing.id },
data
});
res.json({ success: true, data: task });
});
app.delete("/api/tasks/:id", authenticate, async (req, res) => {
const existing = await prisma.task.findFirst({
where: {
id: req.params.id,
project: {
OR: [
{ ownerId: req.user.id },
{ members: { some: { userId: req.user.id } } }
]
}
}
});
if (!existing) {
return res.status(404).json({
success: false,
message: "Task not found."
});
}
await prisma.task.delete({ where: { id: existing.id } });
res.json({ success: true, message: "Task deleted successfully." });
});
const PORT = process.env.PORT || 5000;
async function startServer() {
try {
await prisma.$connect();
console.log("PostgreSQL connected successfully!");
app.listen(PORT, () => {
      console.log("TeamForge API running at http://localhost:" + PORT);
});
} catch (error) {
console.error("Server startup failed:", error);
process.exit(1);
}
}
startServer();