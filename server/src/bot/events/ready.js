import client from '../client.js';
import { startMotd } from '../tasks/motd.js';

client.once('ready', () => {
  console.log(`Bot online as ${client.user.tag}`);
  console.log('--------------------');
  startMotd();
});
