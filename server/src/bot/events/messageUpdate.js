import client from '../client.js';
import { updateMessage, messageExists } from '../../db/queries.js';

const TARGET_USER = 'sagginswaggin';

client.on('messageUpdate', async (_before, after) => {
  if (!after.author || after.author.bot) return;
  if (after.author.username !== TARGET_USER) return;

  // Only update if we already have this message — ignore embed-load events for unknown messages
  if (!messageExists(String(after.id))) return;

  const hasAttachment = after.attachments.size > 0 ? 1 : 0;
  const embed = after.embeds[0]?.url || null;

  updateMessage(
    String(after.id),
    after.content || null,
    hasAttachment,
    embed,
    String(after.channel.id),
  );
});
