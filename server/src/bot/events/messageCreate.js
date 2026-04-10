import client from '../client.js';
import { insertMessage, getRandomMessage } from '../../db/queries.js';
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

  // Handle !r command from non-Austin users
  if (message.content === '!r' && author !== TARGET_USER) {
    await sendRandomMessage(message.channel);
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
  const attachment = message.attachments.first()?.url || null;
  const embed = message.embeds[0]?.url || null;

  insertMessage(
    String(message.id),
    message.content || null,
    message.createdAt.toISOString(),
    attachment,
    embed,
  );
});

export { sendRandomMessage };
