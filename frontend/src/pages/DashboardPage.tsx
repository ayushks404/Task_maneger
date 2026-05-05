import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { DashboardData, TaskStatus, Priority } from '../types';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-500/20 text-slate-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  IN_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  DONE: 'bg-green-500/20 text-green-400'
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400'
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await api.get('/dashboard');
      setData(res);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!projectName.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await api.post('/projects', { name: projectName.trim(), description: projectDesc.trim() || undefined });
      toast.success('Project created!');
      setShowCreateProject(false);
      setProjectName('');
      setProjectDesc('');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-slate-500 text-sm">Loading dashboard…</div>
      </div>
    );
  }

  const activeTasks = data?.myTasks.filter((t) => t.status !== 'DONE') ?? [];
  const doneTasks = data?.myTasks.filter((t) => t.status === 'DONE') ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your tasks and projects at a glance</p>
        </div>
        <button onClick={() => setShowCreateProject(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Tasks</p>
          <p className="text-3xl font-semibold text-white">{activeTasks.length}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className={`text-3xl font-semibold ${(data?.overdueCount ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
            {data?.overdueCount ?? 0}
          </p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Projects</p>
          <p className="text-3xl font-semibold text-white">{data?.projects.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">My Tasks</h2>
          {activeTasks.length === 0 ? (
            <div className="card px-5 py-8 text-center text-slate-500 text-sm">
              No active tasks assigned to you
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => {
                const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'DONE';
                return (
                  <div
                    key={task.id}
                    className="card px-4 py-3 cursor-pointer hover:border-white/10 transition-colors"
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        <span className={`badge ${STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {task.dueDate && (
                      <p className={`text-xs mt-2 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                        {isOverdue ? '⚠ Overdue · ' : 'Due '}
                        {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                );
              })}
              {doneTasks.length > 0 && (
                <p className="text-xs text-slate-500 pt-1 pl-1">
                  +{doneTasks.length} completed task{doneTasks.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Projects</h2>
          {data?.projects.length === 0 ? (
            <div className="card px-5 py-8 text-center text-slate-500 text-sm">
              No projects yet.{' '}
              <button onClick={() => setShowCreateProject(true)} className="text-brand-400 hover:text-brand-300">
                Create one →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="card px-4 py-3 cursor-pointer hover:border-white/10 transition-colors"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{proj.name}</p>
                    <span className={`badge text-xs ${proj.myRole === 'ADMIN' ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-400'}`}>
                      {proj.myRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{proj.openTasks} open</span>
                    <span className="text-slate-700">·</span>
                    <span>{proj.totalTasks} total</span>
                  </div>
                  {proj.totalTasks > 0 && (
                    <div className="mt-2 h-1 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${((proj.totalTasks - proj.openTasks) / proj.totalTasks) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">Create Project</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Marketing Campaign"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input resize-none h-20"
                  placeholder="What is this project about?"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateProject(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={createProject} disabled={creating} className="btn-primary flex-1">
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
