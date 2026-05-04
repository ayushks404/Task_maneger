import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const now = new Date();

  try {
    const [myTasks, overdueCount, projects] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } }
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 20
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: now },
          status: { not: 'DONE' }
        }
      }),
      prisma.project.findMany({
        where: { members: { some: { userId } } },
        include: {
          _count: { select: { tasks: true } },
          members: { select: { role: true, userId: true } },
          tasks: {
            where: { status: { not: 'DONE' } },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const projectSummaries = projects.map((p) => ({
      id: p.id,
      name: p.name,
      totalTasks: p._count.tasks,
      openTasks: p.tasks.length,
      myRole: p.members.find((m) => m.userId === userId)?.role || 'MEMBER'
    }));

    res.json({ myTasks, overdueCount, projects: projectSummaries });
  } catch {
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};