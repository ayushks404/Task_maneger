import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';
import { verifyToken } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/rbac';

const router = Router({ mergeParams: true });
router.use(verifyToken);

router.get('/',  requireProjectAccess('MEMBER'), getTasks);
router.post('/', requireProjectAccess('ADMIN'),  createTask);

router.patch('/:taskId',  requireProjectAccess('MEMBER'), updateTask);
router.delete('/:taskId', requireProjectAccess('ADMIN'),  deleteTask);

export default router;