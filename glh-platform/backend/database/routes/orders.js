const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const DELIVERY_FEE = 5.0
const VALID_ORDER_TYPES = new Set(['collection', 'delivery'])
const VALID_ORDER_STATUSES = new Set(['placed', 'confirmed', 'ready', 'collected', 'delivered', 'cancelled'])

function parseSnapshot(snapshot) {
  try {
    return JSON.parse(snapshot)
  } catch {
    return null
  }
}

function safeRound(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

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

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await db.allAsync(
          `SELECT item_id, product_id, product_snapshot, quantity, unit_price, line_total
           FROM order_items
           WHERE order_id = ?`,
          [order.order_id]
        )

        const normalizedItems = items.map((item) => {
          const snapshot = parseSnapshot(item.product_snapshot)
          return {
            item_id: item.item_id,
            product_id: item.product_id,
            name: snapshot?.name || 'Product',
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
          }
        })

        return { ...order, items: normalizedItems }
      })
    )

    res.json(enrichedOrders)
  } catch (err) {
    console.error('GET / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId
    const { items, order_type, contact_phone, contact_email, collection_time, notes } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' })
    }

    if (!VALID_ORDER_TYPES.has(order_type)) {
      return res.status(400).json({ error: 'Invalid order type' })
    }

    await db.execAsync('BEGIN TRANSACTION')

    const checkedItems = []

    for (const raw of items) {
      const productId = Number(raw.product_id)
      const quantity = Number(raw.quantity)

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        await db.execAsync('ROLLBACK')
        return res.status(400).json({ error: 'Invalid item payload' })
      }

      const product = await db.getAsync(
        `SELECT p.product_id, p.name, p.price, p.stock_quantity, p.is_active,
                p.producer_id, pr.farm_name, p.batch_number
         FROM products p
         JOIN producers pr ON p.producer_id = pr.producer_id
         WHERE p.product_id = ?`,
        [productId]
      )

      if (!product || !product.is_active) {
        await db.execAsync('ROLLBACK')
        return res.status(400).json({ error: 'One or more products are unavailable' })
      }

      if (quantity > product.stock_quantity) {
        await db.execAsync('ROLLBACK')
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` })
      }

      checkedItems.push({
        product_id: product.product_id,
        quantity,
        unit_price: Number(product.price),
        name: product.name,
        producer_id: product.producer_id,
        farm_name: product.farm_name,
        batch_number: product.batch_number,
      })
    }

    const subtotal = safeRound(
      checkedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    )
    const deliveryFee = order_type === 'delivery' ? DELIVERY_FEE : 0
    const loyaltyDiscount = 0
    const total = safeRound(subtotal + deliveryFee - loyaltyDiscount)

    if (total <= 0) {
      await db.execAsync('ROLLBACK')
      return res.status(400).json({ error: 'Invalid order total' })
    }

    const orderRef = `GLH-${Date.now().toString(36).toUpperCase()}`
    const orderResult = await db.runAsync(
      `INSERT INTO orders
         (order_ref, customer_id, order_type, status, subtotal, delivery_fee, loyalty_discount, total_amount,
          contact_phone, contact_email, collection_time, notes)
       VALUES (?, ?, ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderRef, userId, order_type, subtotal, deliveryFee, loyaltyDiscount, total,
       contact_phone || null, contact_email || null, collection_time || null, notes || null]
    )

    const orderId = orderResult.lastInsertRowid

    for (const item of checkedItems) {
      const lineTotal = safeRound(item.unit_price * item.quantity)

      await db.runAsync(
        `INSERT INTO order_items
           (order_id, product_id, product_snapshot, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          JSON.stringify({
            product_id: item.product_id,
            name: item.name,
            producer_id: item.producer_id,
            farm_name: item.farm_name,
            batch_number: item.batch_number,
          }),
          item.quantity,
          item.unit_price,
          lineTotal,
        ]
      )

      await db.runAsync(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      )
    }

    await db.execAsync('COMMIT')
    res.status(201).json({ order_id: orderId, order_ref: orderRef, total_amount: total })
  } catch (err) {
    await db.execAsync('ROLLBACK').catch(() => {})
    console.error('POST / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/producer', requireAuth, requireRole('producer'), async (req, res) => {
  try {
    const producer = await db.getAsync(
      'SELECT producer_id FROM producers WHERE user_id = ?',
      [req.user.userId]
    )

    if (!producer) return res.status(400).json({ error: 'Producer profile not found' })

    const rows = await db.allAsync(
      `SELECT DISTINCT o.order_id, o.order_ref, o.status, o.order_type, o.total_amount, o.created_at,
              u.first_name || ' ' || u.last_name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON o.customer_id = u.user_id
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE p.producer_id = ?
       ORDER BY o.created_at DESC`,
      [producer.producer_id]
    )

    const orders = await Promise.all(
      rows.map(async (order) => {
        const items = await db.allAsync(
          `SELECT oi.item_id, oi.product_id, oi.quantity, oi.unit_price, oi.line_total,
                  p.name AS product_name, p.batch_number
           FROM order_items oi
           JOIN products p ON oi.product_id = p.product_id
           WHERE oi.order_id = ? AND p.producer_id = ?`,
          [order.order_id, producer.producer_id]
        )

        return { ...order, items }
      })
    )

    res.json(orders)
  } catch (err) {
    console.error('GET /producer error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/producer/:orderId/status', requireAuth, requireRole('producer'), async (req, res) => {
  try {
    const orderId = Number(req.params.orderId)
    const status = String(req.body.status || '').trim().toLowerCase()

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    if (!VALID_ORDER_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid order status' })
    }

    const producer = await db.getAsync(
      'SELECT producer_id FROM producers WHERE user_id = ?',
      [req.user.userId]
    )

    if (!producer) return res.status(400).json({ error: 'Producer profile not found' })

    const linked = await db.getAsync(
      `SELECT o.order_id
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE o.order_id = ? AND p.producer_id = ?`,
      [orderId, producer.producer_id]
    )

    if (!linked) return res.status(404).json({ error: 'Order not found' })

    await db.runAsync('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId])
    res.json({ message: 'Order status updated' })
  } catch (err) {
    console.error('PATCH /producer/:orderId/status error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/admin/all', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const orders = await db.allAsync(
      `SELECT o.order_id, o.order_ref, o.status, o.order_type, o.subtotal,
              o.delivery_fee, o.total_amount, o.created_at,
              u.first_name || ' ' || u.last_name AS customer_name, u.email
       FROM orders o
       JOIN users u ON o.customer_id = u.user_id
       ORDER BY o.created_at DESC`
    )
    res.json(orders)
  } catch (err) {
    console.error('GET /admin/all error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/admin/traceability', async (req, res) => {
  try {
    const batch = req.query.batch?.trim()
    if (!batch) return res.status(400).json({ error: 'batch parameter is required' })

    const products = await db.allAsync(
      `SELECT p.product_id, p.name, p.batch_number, p.stock_quantity,
              pr.farm_name AS producer_name
       FROM products p
       JOIN producers pr ON p.producer_id = pr.producer_id
       WHERE p.batch_number = ?`,
      [batch]
    )

    const productIds = products.map(p => p.product_id)
    let orders = []

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',')
      orders = await db.allAsync(
        `SELECT DISTINCT o.order_id, o.order_ref, o.status, o.created_at,
                u.first_name || ' ' || u.last_name AS customer_name,
                oi.product_id
         FROM orders o
         JOIN users u ON o.customer_id = u.user_id
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE oi.product_id IN (${placeholders})
         ORDER BY o.created_at DESC`,
        productIds
      )
    }

    res.json({ batch, products, orders })
  } catch (err) {
    console.error('GET /admin/traceability error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
