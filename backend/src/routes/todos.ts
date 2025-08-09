import { Router } from 'express';
import { prisma } from '@/index';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require auth
router.use(authenticate);

// Projects
router.get('/projects', async (req, res) => {
  const userId = req.user!.id;
  const projects = await prisma.todoProject.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' }
  });
  res.json({ success: true, projects });
});

router.post('/projects', async (req, res) => {
  const userId = req.user!.id;
  const { name, color, isFavorite } = req.body || {};
  const sortOrder = await prisma.todoProject.count({ where: { userId } });
  const project = await prisma.todoProject.create({
    data: { userId, name, color, isFavorite: !!isFavorite, sortOrder }
  });
  res.json({ success: true, project });
});

router.patch('/projects/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const { name, color, isFavorite, sortOrder } = req.body || {};
  const project = await prisma.todoProject.update({
    where: { id },
    data: { name, color, isFavorite, sortOrder }
  });
  if (project.userId !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });
  res.json({ success: true, project });
});

router.delete('/projects/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const project = await prisma.todoProject.findUnique({ where: { id } });
  if (!project || project.userId !== userId) return res.status(404).json({ success: false });
  await prisma.todoProject.delete({ where: { id } });
  res.json({ success: true });
});

// Sections
router.get('/projects/:projectId/sections', async (req, res) => {
  const userId = req.user!.id;
  const projectId = parseInt(req.params.projectId);
  const project = await prisma.todoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ success: false });
  const sections = await prisma.todoSection.findMany({ where: { projectId }, orderBy: { sortOrder: 'asc' } });
  res.json({ success: true, sections });
});

router.post('/projects/:projectId/sections', async (req, res) => {
  const userId = req.user!.id;
  const projectId = parseInt(req.params.projectId);
  const project = await prisma.todoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ success: false });
  const { name } = req.body || {};
  const sortOrder = await prisma.todoSection.count({ where: { projectId } });
  const section = await prisma.todoSection.create({ data: { projectId, name, sortOrder } });
  res.json({ success: true, section });
});

router.patch('/sections/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const { name, sortOrder } = req.body || {};
  const section = await prisma.todoSection.update({ where: { id }, data: { name, sortOrder } });
  const project = await prisma.todoProject.findUnique({ where: { id: section.projectId } });
  if (!project || project.userId !== userId) return res.status(403).json({ success: false });
  res.json({ success: true, section });
});

router.delete('/sections/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const section = await prisma.todoSection.findUnique({ where: { id } });
  if (!section) return res.status(404).json({ success: false });
  const project = await prisma.todoProject.findUnique({ where: { id: section.projectId } });
  if (!project || project.userId !== userId) return res.status(403).json({ success: false });
  await prisma.todoSection.delete({ where: { id } });
  res.json({ success: true });
});

// Tasks
router.get('/tasks', async (req, res) => {
  const userId = req.user!.id;
  const { view } = req.query as { view?: string };
  if (view === 'today') {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const tasks = await prisma.todoTask.findMany({
      where: { userId, isCompleted: false, dueDate: { gte: start, lte: end } },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }]
    });
    return res.json({ success: true, tasks });
  }
  if (view === 'upcoming') {
    const now = new Date();
    const tasks = await prisma.todoTask.findMany({
      where: { userId, isCompleted: false, dueDate: { gte: now } },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }]
    });
    return res.json({ success: true, tasks });
  }
  const tasks = await prisma.todoTask.findMany({ where: { userId }, orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }, { sortOrder: 'asc' }] });
  res.json({ success: true, tasks });
});

router.get('/projects/:projectId/tasks', async (req, res) => {
  const userId = req.user!.id;
  const projectId = parseInt(req.params.projectId);
  const project = await prisma.todoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return res.status(404).json({ success: false });
  const tasks = await prisma.todoTask.findMany({
    where: { userId, projectId },
    orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }, { sortOrder: 'asc' }]
  });
  res.json({ success: true, tasks });
});

router.post('/tasks', async (req, res) => {
  const userId = req.user!.id;
  const { content, description, priority, dueDate, dueString, projectId, sectionId } = req.body || {};
  const sortOrder = await prisma.todoTask.count({ where: { userId, projectId: projectId ?? undefined, sectionId: sectionId ?? undefined } });
  const task = await prisma.todoTask.create({
    data: {
      userId,
      content,
      description,
      priority: Math.min(Math.max(parseInt(priority) || 1, 1), 4),
      dueDate: dueDate ? new Date(dueDate) : null,
      dueString,
      projectId,
      sectionId,
      sortOrder
    }
  });
  res.json({ success: true, task });
});

router.patch('/tasks/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const data: any = {};
  const allowed = ['content','description','priority','dueDate','dueString','isCompleted','projectId','sectionId','sortOrder'];
  for (const key of allowed) if (key in (req.body || {})) data[key] = (key === 'dueDate' && req.body[key]) ? new Date(req.body[key]) : req.body[key];
  const task = await prisma.todoTask.update({ where: { id }, data });
  if (task.userId !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });
  if (data.isCompleted === true) {
    await prisma.todoTask.update({ where: { id }, data: { completedAt: new Date() } });
  }
  res.json({ success: true, task: await prisma.todoTask.findUnique({ where: { id } }) });
});

router.delete('/tasks/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const task = await prisma.todoTask.findUnique({ where: { id } });
  if (!task || task.userId !== userId) return res.status(404).json({ success: false });
  await prisma.todoTask.delete({ where: { id } });
  res.json({ success: true });
});

// Labels
router.get('/labels', async (req, res) => {
  const userId = req.user!.id;
  const labels = await prisma.todoLabel.findMany({ where: { userId } });
  res.json({ success: true, labels });
});

router.post('/labels', async (req, res) => {
  const userId = req.user!.id;
  const { name, color } = req.body || {};
  const label = await prisma.todoLabel.create({ data: { userId, name, color } });
  res.json({ success: true, label });
});

router.post('/tasks/:id/labels/:labelId', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const labelId = parseInt(req.params.labelId);
  const task = await prisma.todoTask.findUnique({ where: { id } });
  const label = await prisma.todoLabel.findUnique({ where: { id: labelId } });
  if (!task || task.userId !== userId || !label || label.userId !== userId) return res.status(404).json({ success: false });
  await prisma.todoTaskLabel.create({ data: { taskId: id, labelId } });
  res.json({ success: true });
});

router.delete('/tasks/:id/labels/:labelId', async (req, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id);
  const labelId = parseInt(req.params.labelId);
  const task = await prisma.todoTask.findUnique({ where: { id } });
  const label = await prisma.todoLabel.findUnique({ where: { id: labelId } });
  if (!task || task.userId !== userId || !label || label.userId !== userId) return res.status(404).json({ success: false });
  await prisma.todoTaskLabel.delete({ where: { taskId_labelId: { taskId: id, labelId } } });
  res.json({ success: true });
});

export default router;


