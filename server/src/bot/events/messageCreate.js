import { ChannelType } from 'discord.js';
import client from '../client.js';
import { insertMessage, getRandomMessage, messageExists } from '../../db/queries.js';
import { config } from '../../config.js';

const TARGET_USER = 'sagginswaggin';
let respondCounter = 0;

const SNARKY_REPLIES = [
  'bro shutup',
  'i do not care.',
  'you type a lot',
  'i was trying to ignore you',
  "You're so funny!",
  'please stop talking.',
  'bruh why do you always have something to say',
  'n',
  'please send more shit that i do not care about',
  'you done yet?',
  'AND THE CROWD GOES WILD!!!',
  'Do it again',
  'Keep it up and see how many more you can post before someone else replies',
  'thanks',
  'Stealing that',
  'Yup, those are all going in the database.',
  'Keep em coming',
  "Don't worry I got all night",
  'yup, tucking away for future use.',
  'good job',
  'good boy',
  'yeah post another one for me',
];

async function sendRandomMessage(channel) {
  const msg = getRandomMessage();
  if (!msg) return;

  if (msg.attachment) {
    await channel.send(msg.attachment);
  } else if (msg.content) {
    await channel.send(msg.content);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const author = message.author.username;

  // Handle commands from non-Austin users
  if (message.content.startsWith('!') && author !== TARGET_USER) {
    if (message.content === '!r') {
      await sendRandomMessage(message.channel);
    } else if (message.content === '!backfill') {
      console.log('Backfill started via command');
      backfill(message.guild).then((count) => {
        console.log(`Backfill complete. Added ${count} messages.`);
      }).catch((err) => {
        console.error(`Backfill failed: ${err.message}`);
      });
    }
    await message.delete().catch(() => {});
    return;
  }

  if (author !== TARGET_USER) {
    respondCounter = 0;
    return;
  }

  // Austin sent a message
  respondCounter++;
  if (respondCounter >= 3) {
    const reply = SNARKY_REPLIES[Math.floor(Math.random() * SNARKY_REPLIES.length)];
    await message.channel.send(reply);
  }

  // Store message
  const hasAttachment = message.attachments.size > 0 ? 1 : 0;
  const embed = message.embeds[0]?.url || null;

  insertMessage(
    String(message.id),
    message.content || null,
    message.createdAt.toISOString(),
    hasAttachment,
    embed,
    0,
    String(message.channel.id),
  );
});

async function backfill(guild) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 4);
  let totalAdded = 0;

  const channels = guild.channels.cache.filter(
    (ch) => ch.type === ChannelType.GuildText
  );

  for (const [, channel] of channels) {
    try {
      let lastId = null;
      let done = false;

      while (!done) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;

        for (const [, msg] of batch) {
          // Stop if we've gone past a year
          if (msg.createdAt < cutoff) {
            done = true;
            break;
          }

          if (msg.author.username !== TARGET_USER) continue;
          if (messageExists(String(msg.id))) continue;

          const hasAttachment = msg.attachments.size > 0 ? 1 : 0;
          const embed = msg.embeds[0]?.url || null;

          insertMessage(
            String(msg.id),
            msg.content || null,
            msg.createdAt.toISOString(),
            hasAttachment,
            embed,
            0,
            String(channel.id),
          );
          totalAdded++;
        }

        lastId = batch.last()?.id;
      }
    } catch (e) {
      console.warn(`Backfill skipped channel ${channel.name}: ${e.message}`);
    }
  }

  console.log(`Backfill complete: ${totalAdded} messages added`);
  return totalAdded;
}

export { sendRandomMessage };
