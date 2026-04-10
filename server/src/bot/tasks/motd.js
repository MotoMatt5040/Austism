import cron from 'node-cron';
import client from '../client.js';
import { getRandomMessage } from '../../db/queries.js';
import { config } from '../../config.js';

export function startMotd() {
  // Run daily at 2:00 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('MOTD triggered');
    const channel = client.channels.cache.get(config.skinwalkersGeneral);
    if (!channel) return;

    const msg = getRandomMessage();
    if (!msg) return;

    if (msg.attachment) {
      await channel.send(msg.attachment);
    } else if (msg.content) {
      await channel.send(msg.content);
    }
  }, { timezone: 'UTC' });

  console.log('MOTD scheduled for 2:00 AM UTC daily');
}
