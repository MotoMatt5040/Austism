import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  skinwalkersGeneral: process.env.SKINWALKERS_GENERAL,
  dbPath: process.env.DB_PATH || resolve(__dirname, '../../data/skin_walkers.db'),
  port: parseInt(process.env.PORT || '3001', 10),
};
