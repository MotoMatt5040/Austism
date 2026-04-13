import { Router } from 'express';
import messagesRouter from './routes/messages.js';
import statsRouter from './routes/stats.js';
import client from '../bot/client.js';

const router = Router();

router.use('/messages', messagesRouter);
router.use('/stats', statsRouter);

// Proxy Discord CDN videos — tries to find the fresh URL via the bot
router.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.match(/^https:\/\/(cdn|media)\.discordapp\.(com|net)\//)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // First try fetching directly — works if URL hasn't expired
  try {
    const direct = await fetch(url);
    if (direct.ok) {
      const contentType = direct.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const buffer = await direct.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch {}

  // URL expired — use Discord's attachment refresh API
  try {
    const baseUrl = url.split('?')[0];
    console.log('Proxy: refreshing URL', baseUrl);
    const refreshed = await client.rest.post('/attachments/refresh-urls', {
      body: { attachment_urls: [baseUrl] },
    });
    console.log('Proxy: refresh response', JSON.stringify(refreshed));
    if (refreshed.refreshed_urls?.[0]?.refreshed) {
      const freshUrl = refreshed.refreshed_urls[0].refreshed;
      const fresh = await fetch(freshUrl);
      if (fresh.ok) {
        const contentType = fresh.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const buffer = await fresh.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    }
  } catch (e) {
    console.error('Proxy: refresh failed', e.message);
  }

  res.status(404).end();
});

export default router;
