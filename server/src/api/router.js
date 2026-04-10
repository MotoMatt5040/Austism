import { Router } from 'express';
import messagesRouter from './routes/messages.js';
import statsRouter from './routes/stats.js';

const router = Router();

router.use('/messages', messagesRouter);
router.use('/stats', statsRouter);

export default router;
