import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { generateToken, authenticateToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== AUTH ROUTES =====

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(
    id,
    username,
    hashedPassword
  );

  const user = { id, username };
  const token = generateToken(user);

  res.status(201).json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken({ id: user.id, username: user.username });

  res.json({ token, user: { id: user.id, username: user.username } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db
    .prepare('SELECT id, username FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// ===== WORKFLOW ROUTES =====

app.get('/api/workflows', authenticateToken, (req, res) => {
  const workflows = db
    .prepare(
      'SELECT id, name, nodes, edges, created_by, updated_by, created_at, updated_at FROM workflows ORDER BY updated_at DESC'
    )
    .all();

  res.json(workflows);
});

app.get('/api/workflows/:id', authenticateToken, (req, res) => {
  const workflow = db
    .prepare('SELECT * FROM workflows WHERE id = ?')
    .get(req.params.id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  res.json(workflow);
});

app.post('/api/workflows', authenticateToken, (req, res) => {
  const { name, nodes, edges } = req.body;
  const id = uuidv4();

  db.prepare(
    'INSERT INTO workflows (id, name, nodes, edges, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name || 'Untitled Workflow', nodes || '[]', edges || '[]', req.user.id, req.user.id);

  res.status(201).json({ id, name });
});

app.put('/api/workflows/:id', authenticateToken, (req, res) => {
  const { name, nodes, edges } = req.body;

  const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  db.prepare(
    "UPDATE workflows SET name = ?, nodes = ?, edges = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, nodes, edges, req.user.id, req.params.id);

  res.json({ id: req.params.id, name });
});

app.delete('/api/workflows/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== START =====

app.listen(PORT, () => {
  console.log(`wowflow server running on http://localhost:${PORT}`);
});
