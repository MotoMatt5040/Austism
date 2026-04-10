import db from './database.js';

export function insertMessage(messageId, content, recDate, hasAttachment, embed, isEdit = 0, channelId = null) {
  return db.prepare(`
    INSERT INTO messages (message_id, content, rec_date, has_attachment, embed, is_edit, channel_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(messageId, content, recDate, hasAttachment, embed, isEdit, channelId);
}

export function messageExists(messageId) {
  return !!db.prepare('SELECT 1 FROM messages WHERE message_id = ?').get(messageId);
}

export function setThumbnail(messageId, thumbnail) {
  return db.prepare('UPDATE messages SET thumbnail = ? WHERE message_id = ?').run(thumbnail, messageId);
}

export function getMessageById(messageId) {
  return db.prepare('SELECT * FROM messages WHERE message_id = ? LIMIT 1').get(messageId);
}

export function getRandomMessage() {
  return db.prepare(
    "SELECT * FROM messages WHERE content IS NOT NULL AND content != '' ORDER BY RANDOM() LIMIT 1"
  ).get();
}

export function getMessages(page = 1, pageSize = 50, order = 'desc') {
  const offset = (page - 1) * pageSize;
  if (order === 'random') {
    return db.prepare('SELECT * FROM messages ORDER BY RANDOM() LIMIT ?').all(pageSize);
  }
  return db.prepare(
    `SELECT * FROM messages ORDER BY rec_date ${order === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`
  ).all(pageSize, offset);
}

export function getMessageCount() {
  return db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
}

export function getHourlyDistribution() {
  return db.prepare(`
    SELECT CAST(strftime('%H', rec_date) AS INTEGER) as hour, COUNT(*) as count
    FROM messages GROUP BY hour ORDER BY hour
  `).all();
}

export function getWordFrequencies(limit = 100) {
  const rows = db.prepare(
    "SELECT content FROM messages WHERE content IS NOT NULL AND content != ''"
  ).all();

  const freq = {};
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'is', 'it', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'me',
    'do', 'did', 'was', 'be', 'am', 'are', 'has', 'have', 'had', 'that',
    'this', 'with', 'not', 'so', 'if', 'just', 'im', "i'm", 'its', "it's",
    'like', 'what', 'no', 'yeah', 'got', 'can', 'get', 'dont', "don't",
  ]);

  for (const row of rows) {
    // Strip URLs and spoiler tags before counting words
    const cleaned = row.content
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\|\|/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, '');
    const words = cleaned.split(/\s+/);
    for (const word of words) {
      if (word.length > 1 && !stopWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, value]) => ({ text, value }));
}

export function getStats() {
  const overview = db.prepare(`
    SELECT
      COUNT(*) as totalMessages,
      MIN(rec_date) as firstMessage,
      MAX(rec_date) as lastMessage
    FROM messages
  `).get();

  return overview;
}

export function getDailyStreak() {
  const days = db.prepare(`
    SELECT DISTINCT DATE(rec_date) as day FROM messages ORDER BY day
  `).all();

  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1].day);
    const curr = new Date(days[i].day);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);
  return { longestStreak: maxStreak, totalDays: days.length };
}
