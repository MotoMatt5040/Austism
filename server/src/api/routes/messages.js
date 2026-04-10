import { Router } from 'express';
import { getMessages, getRandomMessage, getMessageCount } from '../../db/queries.js';
import client from '../../bot/client.js';

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  const order = ['asc', 'desc', 'random'].includes(req.query.order) ? req.query.order : 'desc';

  const messages = getMessages(page, pageSize, order);
  const total = getMessageCount();

  const enriched = await Promise.all(messages.map(enrichWithAttachments));

  res.json({
    messages: enriched,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get('/random', async (_req, res) => {
  const message = getRandomMessage();
  if (!message) return res.status(404).json({ error: 'No messages found' });
  res.json(await enrichWithAttachments(message));
});

router.get('/count', (_req, res) => {
  res.json({ count: getMessageCount() });
});

async function enrichWithAttachments(msg) {
  if (!msg.has_attachment || !msg.channel_id) return { ...msg, attachments: [] };

  try {
    const channel = await client.channels.fetch(msg.channel_id);
    const discordMsg = await channel.messages.fetch(msg.message_id);
    const attachments = discordMsg.attachments.map((a) => ({
      url: a.url,
      name: a.name,
      contentType: a.contentType,
    }));
    return { ...msg, attachments };
  } catch {
    return { ...msg, attachments: [] };
  }
}

export default router;
