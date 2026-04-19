import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

const db = Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id    TEXT NOT NULL,
    content       TEXT,
    rec_date      TEXT NOT NULL,
    has_attachment INTEGER DEFAULT 0,
    embed         TEXT,
    is_edit       INTEGER DEFAULT 0,
    channel_id    TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_rec_date ON messages(rec_date);
  CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
`);

// Add channel_id column if upgrading from old schema
try {
  db.exec('ALTER TABLE messages ADD COLUMN channel_id TEXT');
} catch (e) { /* column already exists */ }

// Rename attachment to has_attachment if upgrading
try {
  db.exec('ALTER TABLE messages RENAME COLUMN attachment TO has_attachment');
} catch (e) { /* already renamed or doesn't exist */ }

// Remove duplicate messages
try {
  // Remove is_edit=1 rows where a is_edit=0 row exists for the same message
  const editDupes = db.prepare(`
    DELETE FROM messages WHERE is_edit = 1
    AND message_id IN (SELECT message_id FROM messages WHERE is_edit = 0)
  `).run();
  if (editDupes.changes > 0) console.log(`Removed ${editDupes.changes} edit duplicates`);

  // Remove any remaining exact duplicates (keep lowest id)
  const dupes = db.prepare(`
    DELETE FROM messages WHERE id NOT IN (
      SELECT MIN(id) FROM messages GROUP BY message_id
    )
  `).run();
  if (dupes.changes > 0) console.log(`Removed ${dupes.changes} duplicate messages`);
} catch (e) { console.warn('Dedup skipped:', e.message); }

// Add thumbnail column for video previews
try {
  db.exec('ALTER TABLE messages ADD COLUMN thumbnail TEXT');
} catch (e) { /* column already exists */ }

// Migrate legacy data from tblSkin_Walkers if it exists and messages table is empty
try {
  const hasLegacy = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='tblSkin_Walkers'"
  ).get();
  const count = db.prepare('SELECT COUNT(*) as c FROM messages').get();

  if (hasLegacy && count.c === 0) {
    console.log('Migrating legacy data from tblSkin_Walkers...');
    const rows = db.prepare('SELECT * FROM tblSkin_Walkers').all();
    const insert = db.prepare(`
      INSERT INTO messages (message_id, content, rec_date, attachment, embed)
      VALUES (?, ?, ?, ?, ?)
    `);

    const migrate = db.transaction(() => {
      for (const row of rows) {
        insert.run(
          String(row.message_id),
          row.content,
          row.rec_date,
          row.attachment === 'None' ? null : row.attachment,
          row.embed === 'None' ? null : String(row.embed).startsWith('<') ? null : row.embed,
        );
      }
    });
    migrate();
    console.log(`Migrated ${rows.length} messages.`);
  }
} catch (e) {
  console.warn('Legacy migration skipped:', e.message);
}

export default db;
