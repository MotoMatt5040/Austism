import client from '../client.js';
import { insertMessage } from '../../db/queries.js';

const TARGET_USER = 'sagginswaggin';

client.on('messageUpdate', async (_before, after) => {
  if (!after.author || after.author.bot) return;
  if (after.author.username !== TARGET_USER) return;

  const attachment = after.attachments.first()?.url || null;
  const embed = after.embeds[0]?.url || null;

  insertMessage(
    String(after.id),
    after.content || null,
    after.createdAt.toISOString(),
    attachment,
    embed,
    1, // is_edit
  );
});
