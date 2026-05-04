import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects/:id/tasks', taskRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`yooo Server running on port ${PORT}`);
});

export default app;
