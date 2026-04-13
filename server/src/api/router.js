import { Router } from 'express';
import messagesRouter from './routes/messages.js';
import statsRouter from './routes/stats.js';

const router = Router();

router.use('/messages', messagesRouter);
router.use('/stats', statsRouter);

// Proxy Discord CDN URLs through the server to avoid CORS/expiry issues
router.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.match(/^https:\/\/(cdn|media)\.discordapp\.(com|net)\//)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).end();

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).end();
  }
});

export default router;
