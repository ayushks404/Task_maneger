import { Request, Response } from 'express';
import { prisma } from '../config/db';

const projectWithMembers = {
  members: { include: { user: { select: { id: true, name: true, email: true } } } },
  _count: { select: { tasks: true } }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.user!.id } } },
      include: projectWithMembers,
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ message: 'Project name is required' });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        members: { create: { userId: req.user!.id, role: 'ADMIN' } }
      },
      include: projectWithMembers
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.json(project);
  } catch {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
  const { email, role = 'MEMBER' } = req.body;
  if (!email?.trim()) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const userToAdd = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (!userToAdd) {
      res.status(404).json({ message: 'User with that email not found' });
      return;
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: userToAdd.id } }
    });
    if (existing) {
      res.status(409).json({ message: 'User is already a member' });
      return;
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: userToAdd.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(member);
  } catch {
    res.status(500).json({ message: 'Failed to add member' });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (userId === req.user!.id) {
    res.status(400).json({ message: 'Cannot remove yourself' });
    return;
  }

  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId } }
    });
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Failed to remove member' });
  }
};