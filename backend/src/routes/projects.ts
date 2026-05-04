import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  deleteProject,
  addMember,
  removeMember
} from '../controllers/projectController';
import { verifyToken } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/rbac';

const router = Router();
router.use(verifyToken);

router.get('/',    getProjects);
router.post('/',   createProject);

router.get('/:id',    requireProjectAccess('MEMBER'), getProjectById);
router.delete('/:id', requireProjectAccess('ADMIN'),  deleteProject);

router.post('/:id/members',         requireProjectAccess('ADMIN'), addMember);
router.delete('/:id/members/:userId', requireProjectAccess('ADMIN'), removeMember);

export default router;