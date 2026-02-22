import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('habits.db');
const db = new Database(dbPath);

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Habits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#10B981',
      frequency TEXT DEFAULT 'daily',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Habit Entries table (tracks daily completion)
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD format
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    )
  `);
  
  // Attempt to add frequency column if it doesn't exist (migration for existing dev db)
  try {
    db.exec("ALTER TABLE habits ADD COLUMN frequency TEXT DEFAULT 'daily'");
  } catch (error) {
    // Column likely already exists, ignore
  }

  // Attempt to add notes column if it doesn't exist (migration for existing dev db)
  try {
    db.exec("ALTER TABLE habits ADD COLUMN notes TEXT");
  } catch (error) {
    // Column likely already exists, ignore
  }

  console.log('Database initialized successfully');
}

export default db;
