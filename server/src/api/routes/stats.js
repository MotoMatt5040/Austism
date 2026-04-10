import { Router } from 'express';
import { getStats, getHourlyDistribution, getWordFrequencies, getDailyStreak } from '../../db/queries.js';

const router = Router();

router.get('/overview', (_req, res) => {
  const overview = getStats();
  const streak = getDailyStreak();
  res.json({ ...overview, ...streak });
});

router.get('/hourly', (_req, res) => {
  const data = getHourlyDistribution();
  // Fill in missing hours with 0
  const filled = Array.from({ length: 24 }, (_, i) => {
    const found = data.find((d) => d.hour === i);
    return { hour: i, count: found ? found.count : 0 };
  });
  res.json(filled);
});

router.get('/words', (req, res) => {
  const limit = Math.min(200, Math.max(10, parseInt(req.query.limit) || 100));
  res.json(getWordFrequencies(limit));
});

router.get('/streak', (_req, res) => {
  res.json(getDailyStreak());
});

export default router;
