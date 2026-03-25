import { useState, useEffect } from 'react'
import { BasketContext } from './basket-context'

export function BasketProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('glh_basket') || '[]') }
    catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('glh_basket', JSON.stringify(items))
  }, [items])

  function addItem(product, qty = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.product_id)
      if (existing) {
        return prev.map(i =>
          i.product_id === product.product_id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock_quantity) }
            : i
        )
      }
      return [...prev, { ...product, quantity: qty }]
    })
    setOpen(true)
  }

  function removeItem(productId) {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  function updateQty(productId, qty) {
    if (qty <= 0) { removeItem(productId); return }
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i))
  }

  function clearBasket() { setItems([]) }

  const count   = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <BasketContext.Provider value={{ items, count, subtotal, open, setOpen, addItem, removeItem, updateQty, clearBasket }}>
      {children}
    </BasketContext.Provider>
  )
}
