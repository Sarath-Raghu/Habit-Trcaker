import express from 'express';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all habits for user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const habitsStmt = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC');
    const habits = habitsStmt.all(req.user?.id);

    // Get entries for these habits
    const entriesStmt = db.prepare(`
      SELECT * FROM habit_entries 
      WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)
    `);
    const entries = entriesStmt.all(req.user?.id);

    // Combine habits with their entries
    const habitsWithEntries = habits.map((habit: any) => ({
      ...habit,
      entries: entries.filter((entry: any) => entry.habit_id === habit.id),
    }));

    res.json(habitsWithEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create habit
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { title, description, color, frequency, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const stmt = db.prepare('INSERT INTO habits (user_id, title, description, color, frequency, notes) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.user?.id, title, description, color || '#10B981', frequency || 'daily', notes);
    
    res.status(201).json({ 
      id: info.lastInsertRowid, 
      user_id: req.user?.id, 
      title, 
      description, 
      color: color || '#10B981',
      frequency: frequency || 'daily',
      notes,
      entries: [] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Toggle habit completion for a date
router.post('/:id/toggle', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { date } = req.body; // YYYY-MM-DD

  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    // Check ownership
    const habitStmt = db.prepare('SELECT user_id FROM habits WHERE id = ?');
    const habit = habitStmt.get(id) as any;
    
    if (!habit || habit.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if entry exists
    const entryStmt = db.prepare('SELECT * FROM habit_entries WHERE habit_id = ? AND date = ?');
    const entry = entryStmt.get(id, date) as any;

    if (entry) {
      // Toggle off (delete)
      db.prepare('DELETE FROM habit_entries WHERE id = ?').run(entry.id);
      res.json({ completed: false });
    } else {
      // Toggle on (create)
      db.prepare('INSERT INTO habit_entries (habit_id, date, completed) VALUES (?, ?, ?)').run(id, date, 1);
      res.json({ completed: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

// Update habit
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, color, frequency, notes } = req.body;
  
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const stmt = db.prepare('UPDATE habits SET title = ?, description = ?, color = ?, frequency = ?, notes = ? WHERE id = ? AND user_id = ?');
    const info = stmt.run(title, description, color || '#10B981', frequency || 'daily', notes, id, req.user?.id);
    
    if (info.changes === 0) return res.status(404).json({ error: 'Habit not found' });
    
    res.json({ id: Number(id), title, description, color: color || '#10B981', frequency: frequency || 'daily', notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.user?.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
