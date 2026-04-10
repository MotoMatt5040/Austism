import { Router } from 'express';
import { getMessages, getRandomMessage, getMessageCount, setThumbnail } from '../../db/queries.js';
import client from '../../bot/client.js';

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

// Fetch fresh attachment URLs on demand for a single message
router.get('/:messageId/attachments', async (req, res) => {
  const { messageId } = req.params;
  const channelId = req.query.channelId;

  if (!channelId) return res.json([]);

  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);
    const attachments = msg.attachments.map((a) => ({
      url: a.url,
      name: a.name,
      contentType: a.contentType,
    }));
    res.json(attachments);
  } catch {
    res.json([]);
  }
});

// Re-fetch a message from Discord to get fresh content/URLs
router.get('/:messageId/refresh', async (req, res) => {
  const { messageId } = req.params;
  const channelId = req.query.channelId;

  if (!channelId) return res.status(400).json({ error: 'channelId required' });

  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);
    res.json({
      content: msg.content || null,
      attachments: msg.attachments.map((a) => ({
        url: a.url,
        name: a.name,
        contentType: a.contentType,
      })),
      embeds: msg.embeds.map((e) => ({
        url: e.video?.url || e.image?.proxyURL || e.image?.url || e.thumbnail?.proxyURL || e.thumbnail?.url || null,
        thumbnail: e.thumbnail?.proxyURL || e.thumbnail?.url || null,
        type: e.video ? 'video' : e.image ? 'image' : 'rich',
        title: e.title || null,
        description: e.description?.slice(0, 200) || null,
      })).filter((e) => e.url || e.title),
    });
  } catch {
    res.status(404).json({ error: 'Message not found' });
  }
});

// Get or fetch thumbnail for a video message
router.get('/:messageId/thumbnail', async (req, res) => {
  const { messageId } = req.params;
  const channelId = req.query.channelId;

  if (!channelId) return res.json({ thumbnail: null });

  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);

    // Look for thumbnail in embeds
    let thumbnail = null;
    for (const embed of msg.embeds) {
      if (embed.thumbnail?.proxyURL) {
        thumbnail = embed.thumbnail.proxyURL;
        break;
      }
      if (embed.image?.proxyURL) {
        thumbnail = embed.image.proxyURL;
        break;
      }
    }

    // Cache it in the DB
    if (thumbnail) {
      setThumbnail(messageId, thumbnail);
    }

    res.json({ thumbnail });
  } catch {
    res.json({ thumbnail: null });
  }
});

export default router;
