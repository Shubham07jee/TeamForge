import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Menu, ChevronDown, AlertCircle, Check, CheckSquare,
  CircleCheck, FolderKanban, LayoutDashboard,
  LogOut, Plus, Search, Settings, Users, Zap, X
} from "lucide-react";
const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
async function api(path, options = {}, token = null) {
  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Request failed. Please try again.");
  }
  return result;
}
function statusLabel(status) {
  return ({
    TODO: "Todo",
    IN_PROGRESS: "In progress",
    DONE: "Done"
  })[status] || status;
}
function priorityLabel(priority) {
  return priority ? priority.charAt(0) + priority.slice(1).toLowerCase() : "Medium";
}
function formatDate(date) {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}
function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("teamforge_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("teamforge_user") || "null");
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [active, setActive] = useState("Overview");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamProjects, setTeamProjects] = useState([]);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [selectedTeamProjectId, setSelectedTeamProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [taskView, setTaskView] = useState("list");
  const [editingTask, setEditingTask] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: ""
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "MEDIUM",
    dueDate: ""
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const headerActionsRef = useRef(null);
  useEffect(() => {
    if (!openMenu) return;
    function handleOutsideClick(event) {
      if (!headerActionsRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenu]);
  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "My Tasks", icon: CheckSquare },
    { label: "Projects", icon: FolderKanban },
    { label: "Team", icon: Users }
  ];
  async function loadWorkspace(currentToken = token) {
    if (!currentToken) return;
    setLoading(true);
    setError("");
    try {
      const [projectResult, taskResult, teamResult] = await Promise.all([
        api("/projects", {}, currentToken),
        api("/tasks", {}, currentToken),
        api("/team", {}, currentToken)
      ]);
      setProjects(Array.isArray(projectResult.data) ? projectResult.data : []);
      setTasks(Array.isArray(taskResult.data) ? taskResult.data : []);
      const loadedTeamProjects = Array.isArray(teamResult.data)
        ? teamResult.data
        : [];
      setTeamProjects(loadedTeamProjects);
      setSelectedTeamProjectId(previous =>
        loadedTeamProjects.some(project => project.id === previous)
          ? previous
          : loadedTeamProjects[0]?.id || ""
      );
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes("token") ||
          err.message.toLowerCase().includes("unauthorized")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) loadWorkspace(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  async function handleAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const result = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      sessionStorage.setItem("teamforge_token", result.token);
      sessionStorage.setItem("teamforge_user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setNotice("Welcome to TeamForge!");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }
  function logout() {
    sessionStorage.removeItem("teamforge_token");
    sessionStorage.removeItem("teamforge_user");
    setToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setError("");
    setNotice("");
  }
  const selectedTeamProject =
    teamProjects.find(project => project.id === selectedTeamProjectId) ||
    teamProjects[0] ||
    null;
  async function addTeamMember(event) {
    event.preventDefault();
    if (!selectedTeamProject || !teamEmail.trim()) {
      setError("Select a project and enter a member email.");
      return;
    }
    setTeamSaving(true);
    setError("");
    try {
      const result = await api(
        "/projects/" + selectedTeamProject.id + "/members",
        {
          method: "POST",
          body: JSON.stringify({ email: teamEmail.trim() })
        },
        token
      );
      setTeamEmail("");
      setNotice(result.message || "Member added successfully.");
      await loadWorkspace(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setTeamSaving(false);
    }
  }
  async function removeTeamMember(member) {
    if (!selectedTeamProject || !member) return;
    if (!window.confirm("Remove " + member.user.name + " from this project?")) {
      return;
    }
    setError("");
    try {
      const result = await api(
        "/projects/" + selectedTeamProject.id + "/members/" + member.id,
        { method: "DELETE" },
        token
      );
      setNotice(result.message || "Member removed successfully.");
      await loadWorkspace(token);
    } catch (err) {
      setError(err.message);
    }
  }
  const visibleTasks = useMemo(() => tasks.filter(task => {
    const status = statusLabel(task.status);
    const matchesFilter = filter === "All" || status === filter;
    const projectName = task.project?.name || "";
    const matchesSearch = (task.title + " " + projectName)
      .toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [tasks, filter, search]);
  async function addTask(event) {
    event.preventDefault();
    if (!newTask.title.trim() || !newTask.projectId) {
      setError("Enter a task name and select a project.");
      return;
    }
    try {
      const result = await api("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          projectId: newTask.projectId,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null
        })
      }, token);
      setTasks(previous => [result.data, ...previous]);
      setNewTask({
        title: "",
        description: "",
        projectId: "",
        priority: "MEDIUM",
        dueDate: ""
      });
      setShowAdd(false);
      setError("");
      setNotice("Task created successfully.");
    } catch (err) {
      setError(err.message);
    }
  }
  async function createProject(event) {
    event.preventDefault();
    if (!newProject.name.trim()) {
      setError("Enter a project name.");
      return;
    }
    setProjectSaving(true);
    setError("");
    try {
      const result = await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: newProject.name.trim(),
          description: newProject.description.trim()
        })
      }, token);
      if (!result.data?.id) {
        throw new Error("Project was not returned by the server.");
      }
      setProjects(previous => [result.data, ...previous]);
      setNewProject({ name: "", description: "" });
      setShowProjectForm(false);
      setActive("Projects");
      setNotice("Project created and saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setProjectSaving(false);
    }
  }
  async function toggleTask(task) {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      const result = await api("/tasks/" + task.id, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      }, token);
      setTasks(previous => previous.map(item =>
        item.id === task.id ? result.data : item
      ));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  async function updateTask(taskId, changes) {
    try {
      const result = await api("/tasks/" + taskId, {
        method: "PATCH",
        body: JSON.stringify(changes)
      }, token);
      setTasks(previous => previous.map(task =>
        task.id === taskId ? result.data : task
      ));
      setError("");
      setNotice("Task updated successfully.");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }
  function openTaskEditor(task) {
    setEditingTask({
      ...task,
      description: task.description || "",
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : ""
    });
  }
  async function saveTaskEdit(event) {
    event.preventDefault();
    if (!editingTask?.title?.trim()) {
      setError("Enter a task name.");
      return;
    }
    const saved = await updateTask(editingTask.id, {
      title: editingTask.title.trim(),
      description: editingTask.description || "",
      status: editingTask.status,
      priority: editingTask.priority,
      dueDate: editingTask.dueDate || null
    });
    if (saved) setEditingTask(null);
  }
  async function removeTask(task) {
    if (!window.confirm('Delete "' + task.title + '"? This cannot be undone.')) {
      return;
    }
    try {
      await api("/tasks/" + task.id, { method: "DELETE" }, token);
      setTasks(previous => previous.filter(item => item.id !== task.id));
      setError("");
      setNotice("Task deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  }
  const completedCount = tasks.filter(task => task.status === "DONE").length;
  const activeCount = tasks.filter(task => task.status !== "DONE").length;
  const notificationItems = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return tasks
      .filter(task => task.status !== "DONE")
      .map(task => {
        const dueDate = task.dueDate
          ? new Date(String(task.dueDate).slice(0, 10) + "T00:00:00")
          : null;
        if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < today) {
          return {
            id: task.id,
            title: task.title,
            message: "Overdue task",
            detail: "Due " + formatDate(task.dueDate),
            icon: AlertCircle,
            color: "text-rose-600 bg-rose-50",
            rank: 0
          };
        }
        if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() === today.getTime()) {
          return {
            id: task.id,
            title: task.title,
            message: "Due today",
            detail: task.project?.name || "Your workspace",
            icon: CalendarDays,
            color: "text-amber-600 bg-amber-50",
            rank: 1
          };
        }
        if (task.priority === "HIGH") {
          return {
            id: task.id,
            title: task.title,
            message: "High priority",
            detail: task.project?.name || "Your workspace",
            icon: Zap,
            color: "text-violet-600 bg-violet-50",
            rank: 2
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);
  }, [tasks]);
  const firstName = user?.name?.split(" ")[0] || "there";
  const initials = (user?.name || "TF")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <img src="/teamforge-logo.svg" alt="TeamForge" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">TeamForge</div>
              <div className="text-[11px] font-medium tracking-widest text-slate-400">YOUR WORKSPACE</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {authMode === "login"
              ? "Sign in to continue to your workspace."
              : "Get started with your TeamForge workspace."}
          </p>
          {error && <div className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {authMode === "register" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Full name</label>
                <input required value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  placeholder="Your name"/>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Email address</label>
              <input required type="email" value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                placeholder="you@example.com"/>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Password</label>
              <input required type="password" minLength={8} value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                placeholder="Enter your password"/>
            </div>
            <button disabled={authLoading} className="tf-primary-button w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {authMode === "login" ? "New to TeamForge?" : "Already have an account?"}
            <button onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setError("");
            }} className="ml-1 font-semibold text-violet-600 hover:text-violet-800">
              {authMode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="teamforge-app min-h-screen bg-[#f7f8fc] text-slate-800">
      <aside className="tf-sidebar fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 shadow-sm shadow-violet-100"><img src="/teamforge-logo.svg" alt="TeamForge" className="h-7 w-7 object-contain" /></div>
          <div><div className="text-lg font-bold tracking-tight text-slate-900">TeamForge</div><div className="text-[11px] font-medium text-slate-400">WORKSPACE</div></div>
        </div>
        <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => setActive(item.label)}
              className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (active === item.label ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50")}>
              <Icon size={18}/>{item.label}
              {item.label === "My Tasks" && <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-xs">{activeCount}</span>}
            </button>;
          })}
        </nav>
        <div className="mb-3 mt-9 flex items-center justify-between px-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your projects</span>
          <button onClick={() => setActive("Projects")} className="text-slate-400 hover:text-violet-600"><Plus size={16}/></button>
        </div>
        <div className="space-y-1">
          {projects.map(project => <button key={project.id} onClick={() => setActive("Projects")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FolderKanban size={15}/></span>
            <span className="truncate">{project.name}</span>
          </button>)}
          {projects.length === 0 && <p className="px-3 text-xs text-slate-400">No projects yet</p>}
        </div>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Zap size={16}/> TeamForge</div>
            <p className="text-xs leading-relaxed text-violet-100">Bring your team's work together in one place.</p>
          </div>
          <button onClick={() => setActive("Settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50"><Settings size={18}/> Settings</button>
          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{user?.name}</div><div className="text-xs text-slate-400">Workspace member</div></div>
            <button onClick={logout} title="Sign out" className="text-slate-400 hover:text-rose-600"><LogOut size={17}/></button>
          </div>
        </div>
      </aside>
      {/* TEAMFORGE_MOBILE_DRAWER */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={"tf-mobile-sidebar fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden " +
        (mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-9 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 shadow-sm shadow-violet-100"><img src="/teamforge-logo.svg" alt="TeamForge" className="h-7 w-7 object-contain" /></div>
            <span className="text-lg font-bold tracking-tight text-slate-900">TeamForge</span>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={20}/>
          </button>
        </div>
        <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setActive(item.label);
                  setMobileMenuOpen(false);
                }}
                className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition " +
                  (active === item.label ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50")}
              >
                <Icon size={19}/>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mb-3 mt-8 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</div>
        <button type="button" onClick={() => { setActive("Settings"); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
          <Settings size={19}/> Settings
        </button>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Zap size={16}/> TeamForge</div>
            <p className="text-xs leading-relaxed text-violet-100">Bring your team's work together in one place.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{user?.name}</div><div className="text-xs text-slate-400">Workspace member</div></div>
            <button type="button" onClick={logout} title="Sign out" className="text-slate-400 hover:text-rose-600"><LogOut size={17}/></button>
          </div>
        </div>
      </aside>
      <main className="min-h-screen lg:ml-[248px]">
        <header className="tf-topbar sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={21}/>
            </button>
            <div className="text-sm text-slate-400">Workspace <span className="mx-2">/</span><span className="font-semibold text-slate-800">{active}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <Search size={15} className="text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything..." className="w-36 bg-transparent text-xs outline-none md:w-48"/>
            </div>
            <div ref={headerActionsRef} className="relative flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(current => current === "notifications" ? null : "notifications")}
                  aria-label="Notifications"
                  aria-expanded={openMenu === "notifications"}
                  className={"relative rounded-xl p-2.5 transition " + (openMenu === "notifications" ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-100")}
                >
                  <Bell size={19}/>
                  {notificationItems.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {notificationItems.length > 9 ? "9+" : notificationItems.length}
                    </span>
                  )}
                </button>
                {openMenu === "notifications" && (
                  <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                        <p className="mt-0.5 text-xs text-slate-400">Updates from your tasks</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadWorkspace()}
                        title="Refresh workspace"
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50"
                      >
                        Refresh
                      </button>
                    </div>
                    {notificationItems.length > 0 ? (
                      <div className="max-h-[360px] overflow-y-auto p-2">
                        {notificationItems.map(item => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => {
                                setActive("My Tasks");
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                            >
                              <span className={"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + item.color}>
                                <ItemIcon size={16}/>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-slate-800">{item.title}</span>
                                <span className="mt-1 block text-[11px] font-medium text-slate-500">{item.message}</span>
                                <span className="mt-1 block truncate text-[10px] text-slate-400">{item.detail}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-5 py-9 text-center">
                        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
                          <CircleCheck size={21}/>
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-700">You're all caught up</p>
                        <p className="mt-1 text-xs text-slate-400">No task reminders right now.</p>
                      </div>
                    )}
                    <div className="border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActive("My Tasks");
                          setOpenMenu(null);
                        }}
                        className="w-full text-center text-xs font-semibold text-violet-600 hover:text-violet-700"
                      >
                        View all tasks
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(current => current === "profile" ? null : "profile")}
                  aria-label="Open profile menu"
                  aria-expanded={openMenu === "profile"}
                  className={"flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 " + (openMenu === "profile" ? "bg-violet-50" : "")}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-pink-100 text-xs font-bold text-violet-700 ring-1 ring-violet-200/70">
                    {initials}
                  </span>
                  <ChevronDown size={14} className="hidden text-slate-400 sm:block"/>
                </button>
                {openMenu === "profile" && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-violet-50/80 to-pink-50/60 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-pink-100 text-xs font-bold text-violet-700">
                          {initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">{user?.name || "TeamForge member"}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{user?.email || ""}</span>
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActive("Settings");
                          setOpenMenu(null);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Settings size={17}/> Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut size={17}/> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="tf-content mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-10">{/* TEAMFORGE_NAV_V3 */}
          {active === "Overview" && (<div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-sm font-medium text-violet-600">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[34px]">Good afternoon, {firstName}</h1>
              <p className="mt-2 text-sm text-slate-500">Here's what's happening with your workspace today.</p>
            </div>
            <button onClick={() => {
              if (!projects.length) {
                setError("Create a project before adding tasks.");
                return;
              }
              setNewTask({ title: "", projectId: projects[0].id, priority: "MEDIUM" });
              setShowAdd(true);
              setError("");
            }} className="tf-primary-button flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><Plus size={17}/> Create task</button>
          </div>)}
          {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
          {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
          {loading && <div className="mb-5 text-sm text-slate-400">Loading your workspace...</div>}
          {active === "Overview" && (<>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total projects", value: projects.length, change: "From your workspace", icon: FolderKanban, color: "bg-violet-50 text-violet-600" },
              { label: "Active tasks", value: activeCount, change: "Not yet completed", icon: Activity, color: "bg-blue-50 text-blue-600" },
              { label: "Completed tasks", value: completedCount, change: "Saved in database", icon: CircleCheck, color: "bg-emerald-50 text-emerald-600" },
              { label: "Team members", value: teamProjects.reduce((total, project) => total + (project.members?.length || 0), 0), change: "Across your projects", icon: Users, color: "bg-amber-50 text-amber-600" }
            ].map(stat => {
              const Icon = stat.icon;
              return <div key={stat.label} className="tf-stat-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-100/70">
                <div className="mb-4 flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{stat.label}</span><span className={"rounded-xl p-2.5 " + stat.color}><Icon size={19}/></span></div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</div>
                <div className="mt-2 text-xs font-medium text-slate-400">{stat.change}</div>
              </div>;
            })}
          </div>
          <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6"><h2 className="font-bold text-slate-900">Workspace overview</h2><p className="mt-1 text-xs text-slate-400">Live task distribution from your database</p></div>
              <div className="flex h-[190px] items-end justify-around gap-4 border-b border-slate-100 pb-2">
                {[
                  { label: "To do", count: tasks.filter(t => t.status === "TODO").length, color: "bg-slate-300" },
                  { label: "In progress", count: tasks.filter(t => t.status === "IN_PROGRESS").length, color: "bg-blue-500" },
                  { label: "Done", count: completedCount, color: "bg-violet-500" }
                ].map(item => <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-sm font-semibold text-slate-700">{item.count}</span>
                  <div className="flex w-full max-w-20 items-end justify-center" style={{ height: "125px" }}>
                    <div className={"w-10 rounded-t-lg " + item.color} style={{ height: (tasks.length ? Math.max(8, item.count / tasks.length * 100) : 8) + "%" }}/>
                  </div>
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>)}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Project progress</h2><p className="mt-1 text-xs text-slate-400">Based on saved tasks</p></div><button onClick={() => setActive("Projects")} className="text-xs font-semibold text-violet-600">View all</button></div>
              <div className="space-y-6">
                {projects.map(project => {
                  const projectTasks = tasks.filter(task => task.projectId === project.id);
                  const done = projectTasks.filter(task => task.status === "DONE").length;
                  const progress = projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0;
                  return <div key={project.id}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><FolderKanban size={17}/></span>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{project.name}</div><div className="text-[11px] text-slate-400">{project.description || "Project"}</div></div>
                      <span className="text-sm font-bold text-slate-700">{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: progress + "%" }}/></div>
                    <div className="mt-1.5 text-right text-[10px] text-slate-400">{done}/{projectTasks.length} tasks completed</div>
                  </div>;
                })}
                {projects.length === 0 && <p className="text-sm text-slate-400">No projects found.</p>}
              </div>
            </section>
          </div>
          </>)}
          {active === "Projects" && (
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">Your projects</h2>
                  <p className="mt-1 text-xs text-slate-400">Manage projects in your workspace</p>
                </div>
                <button
                  onClick={() => {
                    setNewProject({ name: "", description: "" });
                    setShowProjectForm(true);
                    setError("");
                  }}
                  className="tf-primary-button flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <Plus size={16}/> New project
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map(project => <div key={project.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3"><FolderKanban className="text-violet-600"/><div className="font-semibold">{project.name}</div></div>
                  <p className="mt-2 text-sm text-slate-500">{project.description || "No description"}</p>
                  <p className="mt-3 text-xs text-slate-400">{tasks.filter(t => t.projectId === project.id).length} tasks</p>
                </div>)}
              </div>
            </section>
          )}
          {(active === "My Tasks" || active === "Projects") && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 md:px-6">
              <div><h2 className="font-bold text-slate-900">{active === "Projects" ? "Project tasks" : "My tasks"}</h2><p className="mt-1 text-xs text-slate-400">Tasks retrieved from your TeamForge database</p></div>
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                {["All", "Todo", "In progress", "Done"].map(value => <button key={value} onClick={() => setFilter(value)} className={"rounded-lg px-3 py-2 text-xs font-medium transition " + (filter === value ? "bg-white text-violet-700 shadow-sm" : "text-slate-500")}>{value}</button>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button onClick={() => setTaskView("list")} className={"rounded-lg px-3 py-2 text-xs font-medium " + (taskView === "list" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500")}>List</button>
                <button onClick={() => setTaskView("kanban")} className={"rounded-lg px-3 py-2 text-xs font-medium " + (taskView === "kanban" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500")}>Kanban</button>
              </div>
            </div>
            {taskView === "list" ? (
              <div className="divide-y divide-slate-100">
                {visibleTasks.map(task => {
                  const priority = priorityLabel(task.priority);
                  return <div key={task.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50/70 md:px-6">
                    <button onClick={() => toggleTask(task)} title="Toggle completion" className={"flex h-5 w-5 shrink-0 items-center justify-center rounded-md border " + (task.status === "DONE" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500")}><Check size={13}/></button>
                    <div className="min-w-[160px] flex-1">
                      <div className={"text-sm font-medium " + (task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800")}>{task.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{task.project?.name || "Project"}</div>
                      {task.description && <p className="mt-1 max-w-xl text-xs text-slate-500">{task.description}</p>}
                    </div>
                    <span className={"rounded-md px-2.5 py-1 text-[11px] font-semibold " + (priority === "High" ? "bg-rose-50 text-rose-600" : priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{priority}</span>
                    <span className="flex w-24 items-center gap-1.5 text-xs text-slate-400"><CalendarDays size={13}/>{formatDate(task.dueDate)}</span>
                    <select aria-label="Task status" value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    <button onClick={() => openTaskEditor(task)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50">Edit</button>
                    <button onClick={() => removeTask(task)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
                  </div>;
                })}
                {visibleTasks.length === 0 && <div className="p-10 text-center text-sm text-slate-400">{loading ? "Loading tasks..." : "No tasks found. Create a task to get started."}</div>}
              </div>
            ) : (
              <div className="grid gap-4 p-4 md:grid-cols-3">
                {[
                  { status: "TODO", label: "Todo" },
                  { status: "IN_PROGRESS", label: "In progress" },
                  { status: "DONE", label: "Done" }
                ].map(column => {
                  const columnTasks = visibleTasks.filter(task => task.status === column.status);
                  return <div key={column.status} className="min-w-0 rounded-xl bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700">{column.label}</h3>
                      <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{columnTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {columnTasks.map(task => <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{task.title}</h4>
                          <span className={"rounded-md px-2 py-1 text-[10px] font-semibold " + (task.priority === "HIGH" ? "bg-rose-50 text-rose-600" : task.priority === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{priorityLabel(task.priority)}</span>
                        </div>
                        {task.description && <p className="mt-2 text-xs leading-relaxed text-slate-500">{task.description}</p>}
                        <p className="mt-2 text-xs text-slate-400">{task.project?.name || "Project"}{"\u00B7"}{formatDate(task.dueDate)}</p>
                        <select aria-label="Move task" value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">
                          <option value="TODO">Todo</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                        <div className="mt-3 flex justify-end gap-2">
                          <button onClick={() => openTaskEditor(task)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50">Edit</button>
                          <button onClick={() => removeTask(task)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
                        </div>
                      </article>)}
                      {columnTasks.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">No tasks</p>}
                    </div>
                  </div>;
                })}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 md:px-6">
              <span className="text-xs text-slate-400">Showing {visibleTasks.length} of {tasks.length} tasks</span>
              <button onClick={() => loadWorkspace()} className="text-xs font-semibold text-violet-600 hover:text-violet-800">Refresh data <ArrowUpRight className="ml-1 inline" size={13}/></button>
            </div>
          </section>
          )}
          {active === "Team" && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Your team</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage people working across your projects.
                  </p>
                </div>
                <button
                  onClick={() => loadWorkspace()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowUpRight size={15}/> Refresh team
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Your projects</span>
                    <FolderKanban size={18} className="text-violet-500"/>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{teamProjects.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Projects you can access</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Project members</span>
                    <Users size={18} className="text-violet-500"/>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {teamProjects.reduce((total, project) => total + project.members.length, 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Memberships across projects</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Selected project</span>
                    <Activity size={18} className="text-emerald-500"/>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {selectedTeamProject?.members.length || 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">People assigned to this project</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">Project members</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Select a project to see its members and their roles.
                      </p>
                    </div>
                    <select
                      value={selectedTeamProject?.id || ""}
                      onChange={event => setSelectedTeamProjectId(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 sm:w-64"
                    >
                      {teamProjects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!selectedTeamProject ? (
                  <div className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <FolderKanban size={22}/>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">No projects yet</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a project before adding team members.
                    </p>
                    <button
                      onClick={() => {
                        setActive("Projects");
                        setShowProjectForm(true);
                      }}
                      className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                      Create a project
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{selectedTeamProject.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {selectedTeamProject.description || "Project team"}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        {selectedTeamProject.members.length} members
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left">
                        <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Member</th>
                            <th className="px-6 py-3 font-semibold">Role</th>
                            <th className="px-6 py-3 font-semibold">Joined</th>
                            <th className="px-6 py-3 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedTeamProject.members.map(member => (
                            <tr key={member.id} className="transition hover:bg-slate-50/70">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                                    {(member.user.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {member.user.name}
                                      {member.user.id === user?.id && (
                                        <span className="ml-2 text-xs font-normal text-slate-400">You</span>
                                      )}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (member.role === "OWNER" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600")}>
                                  {member.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">
                                {formatDate(member.joinedAt)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {selectedTeamProject.ownerId === user?.id && member.role !== "OWNER" && (
                                  <button
                                    onClick={() => removeTeamMember(member)}
                                    className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                  >
                                    Remove
                                  </button>
                                )}
                                {member.role === "OWNER" && (
                                  <span className="text-xs text-slate-400">Project owner</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedTeamProject.members.length === 0 && (
                      <p className="p-8 text-center text-sm text-slate-500">No members found.</p>
                    )}
                  </>
                )}
              </div>
              {selectedTeamProject?.ownerId === user?.id && (
                <form onSubmit={addTeamMember} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Plus size={19}/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Add a team member</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Add an existing TeamForge account to {selectedTeamProject.name}.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={teamEmail}
                      onChange={event => setTeamEmail(event.target.value)}
                      placeholder="Enter registered user's email"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                    />
                    <button
                      type="submit"
                      disabled={teamSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      <Plus size={16}/> {teamSaving ? "Adding..." : "Add member"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Only the project owner can manage members. New users must register before they can be added.
                  </p>
                </form>
              )}
            </section>
          )}
          {active === "Settings" && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Settings</h2>
              <p className="mt-1 text-sm text-slate-500">Workspace settings</p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Account</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your TeamForge account is connected and your workspace data is synced with the API.
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Workspace preferences</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Additional workspace preferences will be available here.
                </p>
              </div>
            </section>
          )}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>&copy; 2026 TeamForge. Built for teams that do great work.</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Connected to TeamForge API</span>
          </footer>
        </div>
      </main>
      {showProjectForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
        <form onSubmit={createProject} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create a project</h3>
              <p className="mt-1 text-xs text-slate-400">Add a new project to your workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowProjectForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={18}/>
            </button>
          </div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Project name</label>
          <input
            autoFocus
            required
            maxLength={100}
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="e.g. Website redesign"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Description</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={newProject.description}
            onChange={e => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="What is this project about?"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowProjectForm(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={projectSaving}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {projectSaving ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>}
      {showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
        <form onSubmit={addTask} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">Create a task</h3><button type="button" onClick={() => setShowAdd(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Task name</label>
          <input autoFocus required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="What needs to be done?" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"/>
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Description</label>
          <textarea
            rows={3}
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Add task details..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Due date</label>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Project</label>
          <select required value={newTask.projectId} onChange={e => setNewTask({ ...newTask, projectId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500">
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Priority</label>
          <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Create task</button>
          </div>
        </form>
      </div>}
      {editingTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
        <form onSubmit={saveTaskEdit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Edit task</h3>
            <button type="button" onClick={() => setEditingTask(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
          </div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Task name</label>
          <input required value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"/>
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Description</label>
          <textarea rows={3} value={editingTask.description} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"/>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Priority</label>
              <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Status</label>
              <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <label className="mb-2 mt-4 block text-sm font-medium text-slate-600">Due date</label>
          <input type="date" value={editingTask.dueDate} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setEditingTask(null)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Save changes</button>
          </div>
        </form>
      </div>}
    </div>
  );
}
export default App;




