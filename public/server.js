const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'foods.db');

const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    fiber DECIMAL(5,2),
    sugar DECIMAL(5,2),
    serving_size TEXT,
    notes TEXT
  )`);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/foods/search', (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT * FROM foods WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (name LIKE ? OR notes LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  sql += ' ORDER BY name ASC LIMIT 20';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/foods/:id', (req, res) => {
  db.get('SELECT * FROM foods WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/foods', (req, res) => {
  const { name, calories, category, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const stmt = db.prepare('INSERT INTO foods (name, calories, category, notes) VALUES (?, ?, ?, ?)');
  stmt.run(name, calories || null, category || null, notes || null, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM foods WHERE id = ?', [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json(row);
    });
  });
  stmt.finalize();
});

app.put('/api/foods/:id', (req, res) => {
  const { name, calories, category, notes } = req.body;
  db.run(
    'UPDATE foods SET name = ?, calories = ?, category = ?, notes = ? WHERE id = ?',
    [name, calories || null, category || null, notes || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

app.delete('/api/foods/:id', (req, res) => {
  db.run('DELETE FROM foods WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));