import { config } from './config.js';

// Initialize database (runs migration if needed)
import './db/database.js';

// Express setup
import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api/router.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// In production, serve the built React app
const clientDist = resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(resolve(clientDist, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`);
});

// Discord bot setup
import client from './bot/client.js';
import './bot/events/ready.js';
import './bot/events/messageCreate.js';
import './bot/events/messageUpdate.js';

client.login(config.discordToken);
