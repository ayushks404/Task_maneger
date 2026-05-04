import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const requireProjectAccess = (minRole: 'MEMBER' | 'ADMIN') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id: projectId } = req.params;
    const userId = req.user!.id;

    try {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } }
      });

      if (!membership) {
        res.status(403).json({ message: 'Not a project member' });
        return;
      }

      if (minRole === 'ADMIN' && membership.role !== 'ADMIN') {
        res.status(403).json({ message: 'Admin access required' });
        return;
      }

      req.membership = membership;
      next();
    } catch {
      res.status(500).json({ message: 'Server error checking access' });
    }
  };
