import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Project, Task, TaskStatus, Priority, ProjectMember } from '../types';
import { useAuthStore } from '../store/auth';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  IN_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  DONE: 'bg-green-500/20 text-green-400 border-green-500/20'
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400'
};

function TaskCard({
  task,
  isAdmin,
  onStatusChange,
  onEdit,
  onDelete
}: {
  task: Task;
  isAdmin: boolean;
  members: ProjectMember[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'DONE';

  return (
    <div className={`card px-4 py-3 ${task.status === 'DONE' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.title}
          </p>
          {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className={`text-xs px-2 py-0.5 rounded-md border font-medium bg-transparent cursor-pointer focus:outline-none ${STATUS_COLORS[task.status]}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-surface-900 text-slate-200">
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        {task.assignee && <span className="badge bg-white/5 text-slate-400">{task.assignee.name}</span>}
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            {isOverdue ? '⚠ ' : ''}
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('TODO');
  const [submitting, setSubmitting] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviting, setInviting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch {
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const myMembership = project?.members.find((m) => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskStatus('TODO');
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigneeId || '');
    setTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setTaskStatus(task.status);
    setShowTaskModal(true);
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) return toast.error('Title is required');
    setSubmitting(true);
    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        assigneeId: taskAssignee || undefined,
        dueDate: taskDueDate || undefined,
        status: taskStatus
      };

      if (editingTask) {
        await api.patch(`/projects/${id}/tasks/${editingTask.id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
        toast.success('Task created');
      }

      setShowTaskModal(false);
      fetchProject();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await api.patch(`/projects/${id}/tasks/${taskId}`, { status });
      setProject((prev) =>
        prev
          ? { ...prev, tasks: prev.tasks?.map((t) => (t.id === taskId ? { ...t, status } : t)) }
          : prev
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchProject();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return toast.error('Email required');
    setInviting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail.trim(), role: inviteRole });
      toast.success('Member added!');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchProject();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      toast.success('Member removed');
      fetchProject();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  const deleteProject = async () => {
    if (!confirm(`Delete project "${project?.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-sm">Loading project…</div>
      </div>
    );
  }

  if (!project) return null;

  const tasks = project.tasks ?? [];
  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter((t) => t.status === filterStatus);
  const tasksByStatus: Record<TaskStatus, number> = {
    TODO: tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW').length,
    DONE: tasks.filter((t) => t.status === 'DONE').length
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-3 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
            {project.description && <p className="text-slate-500 text-sm mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button onClick={() => setShowInviteModal(true)} className="btn-secondary text-sm flex items-center gap-2">
                  Invite
                </button>
                <button onClick={openCreateTask} className="btn-primary text-sm flex items-center gap-2">
                  Add Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'ALL' : s)}
            className={`card px-4 py-3 text-left transition-colors ${filterStatus === s ? 'border-brand-500/40' : 'hover:border-white/10'}`}
          >
            <p className="text-xs text-slate-500 mb-1">{s.replace('_', ' ')}</p>
            <p className="text-2xl font-semibold text-white">{tasksByStatus[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-5">
        {(['tasks', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
            {tab === 'tasks' && <span className="ml-1.5 text-xs text-slate-600">({tasks.length})</span>}
            {tab === 'members' && <span className="ml-1.5 text-xs text-slate-600">({project.members.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div>
          {filterStatus !== 'ALL' && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500">Filtering by</span>
              <span className={`badge ${STATUS_COLORS[filterStatus]}`}>{filterStatus.replace('_', ' ')}</span>
              <button onClick={() => setFilterStatus('ALL')} className="text-xs text-slate-500 hover:text-slate-300">clear ×</button>
            </div>
          )}
          {filteredTasks.length === 0 ? (
            <div className="card px-5 py-10 text-center">
              <p className="text-slate-500 text-sm">
                {filterStatus === 'ALL' ? (isAdmin ? 'No tasks yet. Create the first one!' : 'No tasks yet.') : `No ${filterStatus.replace('_', ' ').toLowerCase()} tasks.`}
              </p>
              {isAdmin && filterStatus === 'ALL' && (
                <button onClick={openCreateTask} className="btn-primary mt-3 text-sm">
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} isAdmin={!!isAdmin} members={project.members} onStatusChange={updateTaskStatus} onEdit={openEditTask} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-2">
          {project.members.map((m) => (
            <div key={m.id} className="card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold">
                  {m.user.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{m.user.name}</p>
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${m.role === 'ADMIN' ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-400'}`}>
                  {m.role}
                </span>
                {isAdmin && m.userId !== user?.id && (
                  <button onClick={() => removeMember(m.userId)} className="btn-danger text-xs py-1 px-2">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div className="pt-4 border-t border-white/5">
              <button onClick={deleteProject} className="btn-danger text-sm flex items-center gap-2">
                Delete Project
              </button>
            </div>
          )}
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Title *</label>
                <input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none h-24" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assignee</label>
                <select className="input" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" className="input" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitTask} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Member</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}>
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInviteModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={inviteMember} disabled={inviting} className="btn-primary flex-1">
                {inviting ? 'Inviting…' : 'Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
