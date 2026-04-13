const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/orders — get current user's orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId
    const orders = await db.allAsync(
      `SELECT order_id, order_ref, status, order_type, subtotal, delivery_fee, 
              loyalty_discount, total_amount, created_at
       FROM orders
       WHERE customer_id = ?
       ORDER BY created_at DESC`,
      [userId]
    )

    // Fetch items for each order
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await db.allAsync(
          `SELECT item_id, product_id, product_snapshot, quantity, unit_price
           FROM order_items
           WHERE order_id = ?`,
          [order.order_id]
        )
        return { ...order, items }
      })
    )

    res.json(enrichedOrders)
  } catch (err) {
    console.error('GET / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/orders — create a new order
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId
    const { items, order_type, subtotal, delivery_fee, loyalty_discount, total_amount } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' })
    }
    if (!order_type || !['collection', 'delivery'].includes(order_type)) {
      return res.status(400).json({ error: 'Invalid order type' })
    }
    if (typeof total_amount !== 'number' || total_amount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' })
    }

    const orderRef = `GLH-${Date.now().toString(36).toUpperCase()}`
    const orderResult = await db.runAsync(
      `INSERT INTO orders 
         (order_ref, customer_id, order_type, status, subtotal, delivery_fee, loyalty_discount, total_amount)
       VALUES (?, ?, ?, 'placed', ?, ?, ?, ?)`,
      [orderRef, userId, order_type, subtotal, delivery_fee || 0, loyalty_discount || 0, total_amount]
    )

    const orderId = orderResult.lastInsertRowid

    // Insert order items
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO order_items 
           (order_id, product_id, product_snapshot, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id || null,
          JSON.stringify(item),
          item.quantity,
          item.unit_price,
          item.unit_price * item.quantity,
        ]
      )
    }

    res.status(201).json({ order_id: orderId, order_ref: orderRef })
  } catch (err) {
    console.error('POST / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
