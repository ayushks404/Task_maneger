import { Request, Response } from 'express';
import { prisma } from '../config/db';

const taskWithRelations = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.id },
      include: taskWithRelations,
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const { title, description, assigneeId, priority, dueDate, status } = req.body;
  if (!title?.trim()) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }

  try {
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.id, userId: assigneeId } }
      });
      if (!isMember) {
        res.status(400).json({ message: 'Assignee is not a project member' });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: req.params.id,
        createdById: req.user!.id,
        assigneeId: assigneeId || null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: taskWithRelations
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const isAdmin = req.membership!.role === 'ADMIN';
  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== req.params.id) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;

    if (isAdmin) {
      if (title !== undefined) updateData.title = String(title).trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: taskWithRelations
    });

    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete task' });
  }
};