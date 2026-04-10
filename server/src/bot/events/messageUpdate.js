import client from '../client.js';
import { insertMessage } from '../../db/queries.js';

const TARGET_USER = 'sagginswaggin';

client.on('messageUpdate', async (_before, after) => {
  if (!after.author || after.author.bot) return;
  if (after.author.username !== TARGET_USER) return;

  const hasAttachment = after.attachments.size > 0 ? 1 : 0;
  const embed = after.embeds[0]?.url || null;

  insertMessage(
    String(after.id),
    after.content || null,
    after.createdAt.toISOString(),
    hasAttachment,
    embed,
    1,
    String(after.channel.id),
  );
});
