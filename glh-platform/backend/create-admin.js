const db = require('./database/db')
const bcrypt = require('bcryptjs')

const adminEmail = 'mohammedtestadmin@gmail.com'
const adminPassword = 'AdminPassword123' // Strong password meeting requirements

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await db.getAsync('SELECT user_id FROM users WHERE email = ?', [adminEmail])
    if (existing) {
      console.log('✓ Admin account already exists:', adminEmail)
      process.exit(0)
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminEmail, passwordHash, 'Mohammed', 'Test', 'admin', 1]
    )

    console.log('✓ Admin account created successfully!')
    console.log('  Email:', adminEmail)
    console.log('  Password:', adminPassword)
    console.log('  User ID:', result.lastInsertRowid)
    
    process.exit(0)
  } catch (err) {
    console.error('✗ Error creating admin account:', err.message)
    process.exit(1)
  }
}

createAdmin()
