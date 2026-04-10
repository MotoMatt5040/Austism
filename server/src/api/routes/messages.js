import { Router } from 'express';
import { getMessages, getRandomMessage, getMessageCount } from '../../db/queries.js';

const router = Router();

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  const order = ['asc', 'desc', 'random'].includes(req.query.order) ? req.query.order : 'desc';

  const messages = getMessages(page, pageSize, order);
  const total = getMessageCount();

  res.json({
    messages,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get('/random', (_req, res) => {
  const message = getRandomMessage();
  if (!message) return res.status(404).json({ error: 'No messages found' });
  res.json(message);
});

router.get('/count', (_req, res) => {
  res.json({ count: getMessageCount() });
});

export default router;
