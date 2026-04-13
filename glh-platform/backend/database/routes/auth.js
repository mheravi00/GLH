const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

// Register
router.post('/register', async (req, res) => {
  try {
    let { email, password, first_name, last_name, role, farm_name, description, location } = req.body

    // Sanitize inputs
    email = email?.toString().toLowerCase().trim()
    password = password?.toString()
    first_name = first_name?.toString().trim()
    last_name = last_name?.toString().trim()
    farm_name = farm_name?.toString().trim()
    description = description?.toString().trim()
    location = location?.toString().trim()

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate lengths
    if (first_name.length > 50 || last_name.length > 50 || email.length > 100) {
      return res.status(400).json({ error: 'Input too long' })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must include an uppercase letter' })
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must include a number' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const validRoles = ['customer', 'producer']
    const assignedRole = validRoles.includes(role) ? role : 'customer'

    if (assignedRole === 'producer' && !farm_name) {
      return res.status(400).json({ error: 'Farm name is required for producer accounts' })
    }

    if (assignedRole === 'producer' && farm_name.length > 100) {
      return res.status(400).json({ error: 'Farm name too long' })
    }

    const existing = await db.getAsync('SELECT user_id FROM users WHERE email = ?', [email])
    if (existing) {
      return res.status(400).json({ error: 'An account already exists with this email' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await db.runAsync(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, first_name, last_name, assignedRole]
    )

    const userId = result.lastInsertRowid

    if (assignedRole === 'producer') {
      await db.runAsync(
        'INSERT INTO producers (user_id, farm_name, description, location) VALUES (?, ?, ?, ?)',
        [userId, farm_name, description || '', location || '']
      )
    } else {
      await db.runAsync('INSERT INTO loyalty_accounts (user_id) VALUES (?)', [userId])
    }

    res.status(201).json({ message: 'Account created successfully' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body

    // Sanitize inputs
    email = email?.toString().toLowerCase().trim()
    password = password?.toString()

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email])
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is suspended' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.first_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, role: user.role, name: user.first_name })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

module.exports = router

