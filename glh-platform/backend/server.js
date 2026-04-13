const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./database/schema')

const authRoutes    = require('./database/routes/auth')
const productRoutes = require('./database/routes/products')
const orderRoutes   = require('./database/routes/orders')

const app = express()
app.use(cors())
app.use(express.json())

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
