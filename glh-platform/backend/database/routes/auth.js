const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const JWT_SECRET = process.env.JWT_SECRET || 'glh-local-dev-secret'

const router = express.Router()
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[0-9+()\-\s]{7,20}$/

function normalizeText(value) {
  return value?.toString().trim()
}

function normalizeEmail(value) {
  return value?.toString().toLowerCase().trim()
}

function normalizePhone(value) {
  const trimmed = normalizeText(value)
  return trimmed || null
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include a number'
  }
  // Reject suspicious SQL/script patterns
  if (/['";\\()[\]{}*?+|&^%$#@!~`]/.test(password.slice(0, 3))) {
    return 'Password cannot start with special characters'
  }
  return null
}

async function getAccountRow(userId) {
  return db.getAsync(
    `SELECT u.user_id, u.email, u.first_name, u.last_name, u.phone_number, u.role, u.is_active, u.created_at,
            p.producer_id, p.farm_name, p.description, p.location, p.contact_email, p.contact_phone, p.logo_url
     FROM users u
     LEFT JOIN producers p ON p.user_id = u.user_id
     WHERE u.user_id = ?`,
    [userId]
  )
}

function formatAccount(row) {
  if (!row) return null

  return {
    user_id: row.user_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone_number: row.phone_number || '',
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    producer: row.producer_id
      ? {
          producer_id: row.producer_id,
          farm_name: row.farm_name || '',
          description: row.description || '',
          location: row.location || '',
          contact_email: row.contact_email || '',
          contact_phone: row.contact_phone || '',
          logo_url: row.logo_url || '',
        }
      : null,
  }
}

async function deleteUserData(userId) {
  const account = await getAccountRow(userId)
  if (!account) return false

  await db.execAsync('BEGIN TRANSACTION')
  try {
    const customerOrders = await db.allAsync('SELECT order_id FROM orders WHERE customer_id = ?', [userId])
    for (const order of customerOrders) {
      await db.runAsync('DELETE FROM order_items WHERE order_id = ?', [order.order_id])
    }
    await db.runAsync('DELETE FROM orders WHERE customer_id = ?', [userId])

    if (account.producer_id) {
      const producerProducts = await db.allAsync(
        'SELECT product_id FROM products WHERE producer_id = ?',
        [account.producer_id]
      )

      for (const product of producerProducts) {
        const linkedOrders = await db.allAsync('SELECT DISTINCT order_id FROM order_items WHERE product_id = ?', [product.product_id])
        await db.runAsync('DELETE FROM order_items WHERE product_id = ?', [product.product_id])
        await db.runAsync('DELETE FROM product_allergens WHERE product_id = ?', [product.product_id])
        await db.runAsync('DELETE FROM products WHERE product_id = ?', [product.product_id])

        for (const order of linkedOrders) {
          const remaining = await db.getAsync('SELECT COUNT(*) AS count FROM order_items WHERE order_id = ?', [order.order_id])
          if (!remaining?.count) {
            await db.runAsync('DELETE FROM orders WHERE order_id = ?', [order.order_id])
          }
        }
      }

      await db.runAsync('DELETE FROM producers WHERE user_id = ?', [userId])
    }

    await db.runAsync('DELETE FROM loyalty_accounts WHERE user_id = ?', [userId])
    await db.runAsync('DELETE FROM users WHERE user_id = ?', [userId])
    await db.execAsync('COMMIT')
    return true
  } catch (err) {
    await db.execAsync('ROLLBACK').catch(() => {})
    throw err
  }
}

router.post('/register', async (req, res) => {
  try {
    await db.execAsync('BEGIN TRANSACTION')

    let {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      role,
      farm_name,
      description,
      location,
      contact_email,
      contact_phone,
    } = req.body

    email = normalizeEmail(email)
    password = password?.toString()
    first_name = normalizeText(first_name)
    last_name = normalizeText(last_name)
    phone_number = normalizePhone(phone_number)
    farm_name = normalizeText(farm_name)
    description = normalizeText(description)
    location = normalizeText(location)
    contact_email = normalizeEmail(contact_email)
    contact_phone = normalizePhone(contact_phone)

    if (!email || !password || !first_name || !last_name) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'All fields are required' })
    }
    if (first_name.length > 50 || last_name.length > 50 || email.length > 100) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Input too long' })
    }
    if (!emailRegex.test(email)) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Invalid email format' })
    }
    if (phone_number && !phoneRegex.test(phone_number)) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: passwordError })
    }

    const assignedRole = role === 'producer' ? 'producer' : 'customer'
    if (assignedRole === 'producer' && !farm_name) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Farm name is required for producer accounts' })
    }
    if (assignedRole === 'producer' && farm_name.length > 100) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Farm name too long' })
    }
    if (contact_email && !emailRegex.test(contact_email)) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Invalid producer contact email format' })
    }
    if (contact_phone && !phoneRegex.test(contact_phone)) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Invalid producer contact phone format' })
    }

    const existing = await db.getAsync('SELECT user_id FROM users WHERE email = ?', [email])
    if (existing) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'An account already exists with this email' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, first_name, last_name, phone_number, assignedRole]
    )

    const userId = result.lastInsertRowid

    if (assignedRole === 'producer') {
      await db.runAsync(
        `INSERT INTO producers (user_id, farm_name, description, location, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, farm_name, description || '', location || '', contact_email || email, contact_phone || phone_number]
      )
    } else {
      await db.runAsync('INSERT INTO loyalty_accounts (user_id) VALUES (?)', [userId])
    }

    await db.execAsync('COMMIT')
    res.status(201).json({ message: 'Account created successfully' })
  } catch (err) {
    await db.execAsync('ROLLBACK').catch(() => {})
    console.error('Register error:', err)
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('users.email')) {
      return res.status(400).json({ error: 'An account already exists with this email' })
    }
    return res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body
    email = normalizeEmail(email)
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
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, role: user.role, name: user.first_name })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const account = await getAccountRow(req.user.userId)
    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }
    res.json(formatAccount(account))
  } catch (err) {
    console.error('GET /me error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const existing = await getAccountRow(req.user.userId)
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' })
    }

    let { first_name, last_name, email, phone_number, farm_name, description, location, contact_email, contact_phone, logo_url } = req.body
    first_name = normalizeText(first_name)
    last_name = normalizeText(last_name)
    email = normalizeEmail(email)
    phone_number = normalizePhone(phone_number)
    farm_name = normalizeText(farm_name)
    description = normalizeText(description)
    location = normalizeText(location)
    contact_email = normalizeEmail(contact_email)
    contact_phone = normalizePhone(contact_phone)
    logo_url = normalizeText(logo_url)

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name and email are required' })
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    if (phone_number && !phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }
    if (contact_email && !emailRegex.test(contact_email)) {
      return res.status(400).json({ error: 'Invalid producer contact email format' })
    }
    if (contact_phone && !phoneRegex.test(contact_phone)) {
      return res.status(400).json({ error: 'Invalid producer contact phone format' })
    }

    const conflict = await db.getAsync(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [email, req.user.userId]
    )
    if (conflict) {
      return res.status(400).json({ error: 'Email already in use by another account' })
    }

    await db.runAsync(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?',
      [first_name, last_name, email, phone_number, req.user.userId]
    )

    if (existing.role === 'producer') {
      if (!farm_name) {
        return res.status(400).json({ error: 'Farm name is required for producer accounts' })
      }
      await db.runAsync(
        `UPDATE producers
         SET farm_name = ?, description = ?, location = ?, contact_email = ?, contact_phone = ?, logo_url = ?
         WHERE user_id = ?`,
        [farm_name, description || '', location || '', contact_email || email, contact_phone || phone_number, logo_url || null, req.user.userId]
      )
    }

    const updated = await getAccountRow(req.user.userId)
    res.json({ message: 'Account updated', account: formatAccount(updated) })
  } catch (err) {
    console.error('PATCH /me error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/me/password', requireAuth, async (req, res) => {
  try {
    const currentPassword = req.body.current_password?.toString()
    const newPassword = req.body.new_password?.toString()
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'current_password and new_password are required' })
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }

    const user = await db.getAsync('SELECT password_hash FROM users WHERE user_id = ?', [req.user.userId])
    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const nextHash = await bcrypt.hash(newPassword, 12)
    await db.runAsync('UPDATE users SET password_hash = ? WHERE user_id = ?', [nextHash, req.user.userId])
    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error('PATCH /me/password error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/me', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteUserData(req.user.userId)
    if (!deleted) {
      return res.status(404).json({ error: 'Account not found' })
    }
    res.json({ message: 'Account deleted' })
  } catch (err) {
    console.error('DELETE /me error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/manage/accounts', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    let {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      role,
      farm_name,
      description,
      location,
      contact_email,
      contact_phone,
    } = req.body

    email = normalizeEmail(email)
    password = password?.toString()
    first_name = normalizeText(first_name)
    last_name = normalizeText(last_name)
    phone_number = normalizePhone(phone_number)
    farm_name = normalizeText(farm_name)
    description = normalizeText(description)
    location = normalizeText(location)
    contact_email = normalizeEmail(contact_email)
    contact_phone = normalizePhone(contact_phone)

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    if (first_name.length > 50 || last_name.length > 50 || email.length > 100) {
      return res.status(400).json({ error: 'Input too long' })
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    if (phone_number && !phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }

    const assignedRole = ['customer', 'producer', 'admin'].includes(role) ? role : 'customer'
    if (assignedRole === 'producer' && !farm_name) {
      return res.status(400).json({ error: 'Farm name is required for producer accounts' })
    }
    if (assignedRole === 'producer' && farm_name.length > 100) {
      return res.status(400).json({ error: 'Farm name too long' })
    }
    if (contact_email && !emailRegex.test(contact_email)) {
      return res.status(400).json({ error: 'Invalid producer contact email format' })
    }
    if (contact_phone && !phoneRegex.test(contact_phone)) {
      return res.status(400).json({ error: 'Invalid producer contact phone format' })
    }

    const existing = await db.getAsync('SELECT user_id FROM users WHERE email = ?', [email])
    if (existing) {
      return res.status(400).json({ error: 'An account already exists with this email' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, first_name, last_name, phone_number, assignedRole]
    )

    const userId = result.lastInsertRowid

    if (assignedRole === 'producer') {
      await db.runAsync(
        `INSERT INTO producers (user_id, farm_name, description, location, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, farm_name, description || '', location || '', contact_email || email, contact_phone || phone_number]
      )
    }

    res.status(201).json({ message: 'Account created successfully' })
  } catch (err) {
    console.error('POST /manage/accounts error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/manage/accounts', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.phone_number, u.role, u.is_active, u.created_at,
              p.producer_id, p.farm_name, p.description, p.location, p.contact_email, p.contact_phone
       FROM users u
       LEFT JOIN producers p ON p.user_id = u.user_id
       ORDER BY u.created_at DESC`
    )
    res.json(rows.map(formatAccount))
  } catch (err) {
    console.error('GET /manage/accounts error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/manage/accounts/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const isActive = Number(req.body.is_active)
    if (!Number.isInteger(userId) || ![0, 1].includes(isActive)) {
      return res.status(400).json({ error: 'Invalid payload' })
    }
    await db.runAsync('UPDATE users SET is_active = ? WHERE user_id = ?', [isActive, userId])
    res.json({ message: 'Account status updated' })
  } catch (err) {
    console.error('PATCH /manage/accounts/:id/status error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/manage/accounts/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const existing = await getAccountRow(userId)
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' })
    }

    let { first_name, last_name, email, phone_number, farm_name, description, location, contact_email, contact_phone, logo_url } = req.body
    first_name = normalizeText(first_name)
    last_name = normalizeText(last_name)
    email = normalizeEmail(email)
    phone_number = normalizePhone(phone_number)
    farm_name = normalizeText(farm_name)
    description = normalizeText(description)
    location = normalizeText(location)
    contact_email = normalizeEmail(contact_email)
    contact_phone = normalizePhone(contact_phone)
    logo_url = normalizeText(logo_url)

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name and email are required' })
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    if (phone_number && !phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }
    if (contact_email && !emailRegex.test(contact_email)) {
      return res.status(400).json({ error: 'Invalid producer contact email format' })
    }
    if (contact_phone && !phoneRegex.test(contact_phone)) {
      return res.status(400).json({ error: 'Invalid producer contact phone format' })
    }

    const conflict = await db.getAsync('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, userId])
    if (conflict) {
      return res.status(400).json({ error: 'Email already in use by another account' })
    }

    await db.runAsync(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?',
      [first_name, last_name, email, phone_number, userId]
    )

    if (existing.role === 'producer') {
      if (!farm_name) {
        return res.status(400).json({ error: 'Farm name is required for producer accounts' })
      }
      await db.runAsync(
        `UPDATE producers
         SET farm_name = ?, description = ?, location = ?, contact_email = ?, contact_phone = ?, logo_url = ?
         WHERE user_id = ?`,
        [farm_name, description || '', location || '', contact_email || email, contact_phone || phone_number, logo_url || null, userId]
      )
    }

    res.json({ message: 'Account updated', account: formatAccount(await getAccountRow(userId)) })
  } catch (err) {
    console.error('PATCH /manage/accounts/:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/manage/accounts/:id/password', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const newPassword = req.body.new_password?.toString()
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }

    const nextHash = await bcrypt.hash(newPassword, 12)
    await db.runAsync('UPDATE users SET password_hash = ? WHERE user_id = ?', [nextHash, userId])
    res.json({ message: 'Password reset' })
  } catch (err) {
    console.error('PATCH /manage/accounts/:id/password error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/manage/accounts/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const deleted = await deleteUserData(userId)
    if (!deleted) {
      return res.status(404).json({ error: 'Account not found' })
    }

    res.json({ message: 'Account deleted' })
  } catch (err) {
    console.error('DELETE /manage/accounts/:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
