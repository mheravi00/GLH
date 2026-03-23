const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/db')

// Register
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) {
    return res.status(400).json({ error: 'An account already exists with this email' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const result = db.prepare(
    'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)'
  ).run(email.toLowerCase(), passwordHash, first_name, last_name)

  db.prepare('INSERT INTO loyalty_accounts (user_id) VALUES (?)').run(result.lastInsertRowid)

  res.status(201).json({ message: 'Account created successfully' })
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({ token, role: user.role, name: user.first_name })
})

module.exports = router

