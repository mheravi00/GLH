const express = require('express')
const cors = require('cors')
const path = require('path')
const { execFileSync } = require('child_process')
const stripe = require('stripe')('sk_test_51TM4CoRo0TG0ZJmSmOp2iYM19FImzOUJg9KpJTtxW9OodfLbq8qa2XOsg03qngDn4hbnJDuWdMd53gXjBYVuYYdc00uM0XNgnV')
console.log('Stripe initialized:', !!stripe)
require('dotenv').config()

console.log('Server.js starting...')

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

app.post('/test', async (req, res) => {
  console.log('Test endpoint called')
  res.json({ message: 'Test endpoint works' })
})

app.post('/api/create-payment-intent', async (req, res) => {
  console.log('Payment intent endpoint called')
  try {
    const { amount } = req.body
    console.log('Creating payment intent for amount:', amount)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
    })
    console.log('Payment intent created:', paymentIntent.id)
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment intent' })
  }
})
console.log('Payment intent route registered')

app.get('/backend-tools/readable-tables.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'database', 'readable-tables.html'))
})

app.use('/backend-tools', express.static(path.join(__dirname, 'database')))

app.use('/api/auth',     authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders',   orderRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'GLH API is running' })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
