const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const isProducer = [requireAuth, requireRole('producer')]

async function resolveCategoryId(categoryId, categoryName) {
  if (categoryId) return categoryId
  if (!categoryName?.trim()) return null

  const name = categoryName.trim()
  const existing = await db.getAsync('SELECT category_id FROM categories WHERE name = ?', [name])
  if (existing) return existing.category_id

  const created = await db.runAsync('INSERT INTO categories (name) VALUES (?)', [name])
  return created.lastInsertRowid
}

// Helper: verify product belongs to this producer
async function ownedProduct(productId, userId) {
  return db.getAsync(
    `SELECT p.product_id FROM products p
     JOIN producers pr ON p.producer_id = pr.producer_id
     WHERE p.product_id = ? AND pr.user_id = ?`,
    [productId, userId]
  )
}

// GET /api/producers — public list of all producers with product count
router.get('/producers', async (_req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT pr.producer_id, pr.user_id, pr.farm_name, pr.description, pr.location,
              COUNT(DISTINCT p.product_id) AS product_count
       FROM producers pr
       LEFT JOIN products p ON pr.producer_id = p.producer_id AND p.is_active = 1
       GROUP BY pr.producer_id
       ORDER BY pr.farm_name`
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /producers error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/products/mine — list this producer's products
router.get('/mine', ...isProducer, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT p.*, c.name AS category_name,
              GROUP_CONCAT(a.name) AS allergens
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       JOIN producers pr ON p.producer_id = pr.producer_id
       LEFT JOIN product_allergens pa ON p.product_id = pa.product_id
       LEFT JOIN allergens a ON pa.allergen_id = a.allergen_id
       WHERE pr.user_id = ?
       GROUP BY p.product_id
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    )
    res.json(rows.map(r => ({ ...r, allergens: r.allergens ? r.allergens.split(',') : [] })))
  } catch (err) {
    console.error('GET /mine error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/products — public catalogue list
router.get('/', async (_req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT p.*, c.name AS category_name, pr.farm_name,
              GROUP_CONCAT(a.name) AS allergens
       FROM products p
       JOIN producers pr ON p.producer_id = pr.producer_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN product_allergens pa ON p.product_id = pa.product_id
       LEFT JOIN allergens a ON pa.allergen_id = a.allergen_id
       WHERE p.is_active = 1
       GROUP BY p.product_id
       ORDER BY p.created_at DESC`
    )

    const products = rows.map(r => ({
      ...r,
      allergens: r.allergens ? r.allergens.split(',') : [],
    }))

    res.json(products)
  } catch (err) {
    console.error('GET / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/products — create a product
router.post('/', ...isProducer, async (req, res) => {
  try {
    const { name, description, price, unit, stock_quantity, low_stock_threshold,
            batch_number, ingredients, category_id, category_name, image_url, is_active } = req.body

    if (!name?.trim() || !price || !unit?.trim() || !batch_number?.trim() || !ingredients?.trim()) {
      return res.status(400).json({ error: 'name, price, unit, batch_number and ingredients are required' })
    }
    if (price <= 0) return res.status(400).json({ error: 'Price must be greater than 0' })

    const producer = await db.getAsync(
      'SELECT producer_id FROM producers WHERE user_id = ?', [req.user.userId]
    )
    if (!producer) return res.status(400).json({ error: 'Producer profile not found' })

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name)

    const result = await db.runAsync(
      `INSERT INTO products
         (producer_id, category_id, name, description, price, unit,
          stock_quantity, low_stock_threshold, batch_number, ingredients, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        producer.producer_id,
        resolvedCategoryId,
        name.trim(),
        description?.trim() || '',
        price,
        unit.trim(),
        stock_quantity ?? 0,
        low_stock_threshold ?? 5,
        batch_number.trim(),
        ingredients.trim(),
        image_url?.trim() || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
      ]
    )
    res.status(201).json({ product_id: result.lastInsertRowid, message: 'Product created' })
  } catch (err) {
    console.error('POST / error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/products/:id — update product details
router.put('/:id', ...isProducer, async (req, res) => {
  try {
    const product = await ownedProduct(req.params.id, req.user.userId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const { name, description, price, unit, low_stock_threshold,
            batch_number, ingredients, category_id, category_name, image_url, is_active } = req.body

    if (!name?.trim() || !price || !unit?.trim() || !batch_number?.trim() || !ingredients?.trim()) {
      return res.status(400).json({ error: 'name, price, unit, batch_number and ingredients are required' })
    }
    if (price <= 0) return res.status(400).json({ error: 'Price must be greater than 0' })

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name)

    await db.runAsync(
      `UPDATE products SET name=?, description=?, price=?, unit=?,
        low_stock_threshold=?, batch_number=?, ingredients=?, image_url=?, category_id=?, is_active=?
       WHERE product_id = ?`,
      [
        name.trim(), description?.trim() || '', price, unit.trim(),
        low_stock_threshold ?? 5, batch_number.trim(), ingredients.trim(), image_url?.trim() || null,
        resolvedCategoryId, is_active !== undefined ? (is_active ? 1 : 0) : 1,
        req.params.id,
      ]
    )
    res.json({ message: 'Product updated' })
  } catch (err) {
    console.error('PUT /:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/products/:id/stock — amend stock quantity
router.patch('/:id/stock', ...isProducer, async (req, res) => {
  try {
    const product = await ownedProduct(req.params.id, req.user.userId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const qty = parseInt(req.body.stock_quantity, 10)
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'stock_quantity must be a non-negative integer' })
    }

    await db.runAsync(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [qty, req.params.id]
    )
    res.json({ message: 'Stock updated' })
  } catch (err) {
    console.error('PATCH /:id/stock error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/products/:id
router.delete('/:id', ...isProducer, async (req, res) => {
  try {
    const product = await ownedProduct(req.params.id, req.user.userId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    await db.runAsync('DELETE FROM products WHERE product_id = ?', [req.params.id])
    res.json({ message: 'Product deleted' })
  } catch (err) {
    console.error('DELETE /:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/products/analytics
router.get('/analytics', ...isProducer, async (req, res) => {
  try {
    const producer = await db.getAsync(
      'SELECT producer_id FROM producers WHERE user_id = ?', [req.user.userId]
    )
    if (!producer) return res.status(400).json({ error: 'Producer profile not found' })

    const pid = producer.producer_id

    const [revenueRow, weekOrdersRow, topProducts, revenueTrend, stockStats] = await Promise.all([
      db.getAsync(
        `SELECT COALESCE(SUM(oi.line_total), 0) AS total_revenue
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE p.producer_id = ?`,
        [pid]
      ),
      db.getAsync(
        `SELECT COUNT(DISTINCT oi.order_id) AS order_count
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         JOIN orders o ON oi.order_id = o.order_id
         WHERE p.producer_id = ? AND o.created_at >= datetime('now', '-7 days')`,
        [pid]
      ),
      db.allAsync(
        `SELECT p.name,
                COALESCE(SUM(oi.line_total), 0) AS revenue,
                COALESCE(SUM(oi.quantity), 0) AS units_sold
         FROM products p
         LEFT JOIN order_items oi ON p.product_id = oi.product_id
         WHERE p.producer_id = ?
         GROUP BY p.product_id
         ORDER BY revenue DESC
         LIMIT 5`,
        [pid]
      ),
      db.allAsync(
        `SELECT date(o.created_at) AS day,
                COALESCE(SUM(oi.line_total), 0) AS revenue
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN products p ON oi.product_id = p.product_id
         WHERE p.producer_id = ? AND o.created_at >= datetime('now', '-7 days')
         GROUP BY day ORDER BY day`,
        [pid]
      ),
      db.getAsync(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
           SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock,
           SUM(CASE WHEN stock_quantity > low_stock_threshold THEN 1 ELSE 0 END) AS in_stock
         FROM products WHERE producer_id = ?`,
        [pid]
      ),
    ])

    res.json({
      totalRevenue: revenueRow.total_revenue,
      weeklyOrders: weekOrdersRow.order_count,
      topProducts,
      revenueTrend,
      stockStats,
    })
  } catch (err) {
    console.error('GET /analytics error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
