import cron from 'node-cron';
import client from '../client.js';
import { sendRandomMessage } from '../events/messageCreate.js';
import { config } from '../../config.js';

export function startMotd() {
  // Run daily at 2:00 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('MOTD triggered');
    try {
      const channel = await client.channels.fetch(config.skinwalkersGeneral);
      if (!channel) {
        console.error('MOTD: channel not found');
        return;
      }
      await sendRandomMessage(channel);
      console.log('MOTD sent');
    } catch (e) {
      console.error('MOTD failed:', e.message);
    }
  }, { timezone: 'UTC' });

  console.log('MOTD scheduled for 2:00 AM UTC daily');
}
