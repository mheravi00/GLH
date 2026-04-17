const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

router.get('/', async (_req, res) => {
  try {
    const rows = await db.allAsync(
      'SELECT allergen_id, name FROM allergens ORDER BY name'
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /allergens error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const name = req.body.name?.toString().trim()
    if (!name) return res.status(400).json({ error: 'Allergen name is required' })
    if (name.length > 50) return res.status(400).json({ error: 'Name too long (max 50 chars)' })

    const existing = await db.getAsync(
      'SELECT allergen_id FROM allergens WHERE lower(name) = lower(?)',
      [name]
    )
    if (existing) return res.status(400).json({ error: 'Allergen already exists' })

    const result = await db.runAsync('INSERT INTO allergens (name) VALUES (?)', [name])
    res.status(201).json({ allergen_id: result.lastInsertRowid, name, message: 'Allergen created' })
  } catch (err) {
    console.error('POST /allergens error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid allergen id' })

    const name = req.body.name?.toString().trim()
    if (!name) return res.status(400).json({ error: 'Allergen name is required' })
    if (name.length > 50) return res.status(400).json({ error: 'Name too long (max 50 chars)' })

    const existing = await db.getAsync('SELECT allergen_id FROM allergens WHERE allergen_id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'Allergen not found' })

    const conflict = await db.getAsync(
      'SELECT allergen_id FROM allergens WHERE lower(name) = lower(?) AND allergen_id != ?',
      [name, id]
    )
    if (conflict) return res.status(400).json({ error: 'Allergen name already exists' })

    await db.runAsync('UPDATE allergens SET name = ? WHERE allergen_id = ?', [name, id])
    res.json({ message: 'Allergen updated', allergen_id: id, name })
  } catch (err) {
    console.error('PATCH /allergens/:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid allergen id' })

    const existing = await db.getAsync('SELECT allergen_id FROM allergens WHERE allergen_id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'Allergen not found' })

    await db.runAsync('DELETE FROM product_allergens WHERE allergen_id = ?', [id])
    await db.runAsync('DELETE FROM allergens WHERE allergen_id = ?', [id])
    res.json({ message: 'Allergen deleted' })
  } catch (err) {
    console.error('DELETE /allergens/:id error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
