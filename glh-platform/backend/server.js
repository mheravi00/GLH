const express = require('express')
const cors = require('cors')
const path = require('path')
const { execFileSync } = require('child_process')
require('dotenv').config()

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'glh-local-dev-secret'
  console.warn('JWT_SECRET not set; using local development fallback secret')
}

require('./database/schema')

const authRoutes    = require('./database/routes/auth')
const productRoutes = require('./database/routes/products')
const orderRoutes   = require('./database/routes/orders')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/backend-tools/readable-tables.html', (_req, res) => {
  try {
    execFileSync('bash', [path.join(__dirname, 'database', 'export-tables.sh')], { stdio: 'ignore' })
  } catch (err) {
    console.error('Failed to refresh readable tables:', err)
  }

  res.sendFile(path.join(__dirname, 'database', 'readable-tables.html'))
})

app.use('/backend-tools', express.static(path.join(__dirname, 'database')))

app.use('/api/auth',     authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders',   orderRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'GLH API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
