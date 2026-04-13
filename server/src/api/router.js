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

  // URL expired — try to find the original message and get a fresh attachment URL
  // CDN URL format: /attachments/{channel_id}/{attachment_id}/{filename}
  const match = url.match(/attachments\/(\d+)\/(\d+)\//);
  if (match) {
    const sourceChannelId = match[1];
    try {
      const channel = await client.channels.fetch(sourceChannelId);
      // Search recent messages for the attachment
      const messages = await channel.messages.fetch({ limit: 100 });
      for (const [, msg] of messages) {
        for (const [, att] of msg.attachments) {
          if (att.url.includes(match[2])) {
            // Found the attachment — proxy the fresh URL
            const fresh = await fetch(att.url);
            if (fresh.ok) {
              const contentType = fresh.headers.get('content-type');
              if (contentType) res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              const buffer = await fresh.arrayBuffer();
              return res.send(Buffer.from(buffer));
            }
          }
        }
      }
    } catch {}
  }

  res.status(404).end();
});

export default router;
