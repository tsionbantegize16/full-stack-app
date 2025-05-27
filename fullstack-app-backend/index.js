require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test DB connection on startup
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('Database connection error:', err));

// Routes

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a task
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const { rows } = await pool.query(
      'UPDATE tasks SET title = $1 WHERE id = $2 RETURNING *',
      [title, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
