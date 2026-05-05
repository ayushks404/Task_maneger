export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null;
  createdById: string;
  createdBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  members: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface ProjectSummary {
  id: string;
  name: string;
  totalTasks: number;
  openTasks: number;
  myRole: Role;
}

export interface DashboardData {
  myTasks: Task[];
  overdueCount: number;
  projects: ProjectSummary[];
}
