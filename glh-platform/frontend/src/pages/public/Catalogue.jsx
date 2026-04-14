import { useState, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import api from '../../utils/api'
import styles from './Catalogue.module.css'

const CATEGORIES = [
  'Honey & Preserves',
  'Dairy & Eggs',
  'Vegetables',
  'Bread & Bakes',
  'Drinks',
  'Fish & Meat',
]

const ALLERGENS = [
  { name: 'Nuts',   emoji: '🌰' },
  { name: 'Gluten', emoji: '🌾' },
  { name: 'Dairy',  emoji: '🥛' },
  { name: 'Eggs',   emoji: '🥚' },
  { name: 'Fish',   emoji: '🐟' },
  { name: 'Soya',   emoji: '🫘' },
]

const MAX_PRICE = 30

const ITEMS_PER_PAGE = 9

const SORT_OPTIONS = [
  { value: 'name_az',    label: 'Name A–Z' },
  { value: 'name_za',    label: 'Name Z–A' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function Catalogue() {
  const [products, setProducts]            = useState([])
  const [loading, setLoading]              = useState(true)
  const [selectedCategories, setCategories] = useState([])
  const [excludeAllergens, setExclude]      = useState([])
  const [maxPrice, setMaxPrice]             = useState(MAX_PRICE)
  const [inStockOnly, setInStock]           = useState(false)
  const [search, setSearch]                 = useState('')
  const [sort, setSort]                     = useState('name_az')
  const [page, setPage]                     = useState(1)
  const [mobileFilterOpen, setMobile]       = useState(false)

  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    api.get('/products')
      .then(res => {
        if (!active) return
        const rows = Array.isArray(res.data) ? res.data : []
        setProducts(rows)
        setLoadError('')
      })
      .catch(() => {
        if (!active) return
        setProducts([])
        setLoadError('Could not load catalogue from backend. Make sure backend is running on port 5000.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const categoryOptions = useMemo(() => {
    const dynamic = Array.from(new Set(products.map(p => p.category_name).filter(Boolean)))
    return dynamic.length > 0 ? dynamic : CATEGORIES
  }, [products])

  function toggleCategory(c) {
    setPage(1)
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }
  function toggleAllergen(a) {
    setPage(1)
    setExclude(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }
  function clearAll() {
    setCategories([]); setExclude([]); setMaxPrice(MAX_PRICE); setInStock(false); setSearch(''); setPage(1)
  }

  const hasFilters = selectedCategories.length > 0 || excludeAllergens.length > 0 || maxPrice < MAX_PRICE || inStockOnly

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category_name)) return false
      if (excludeAllergens.some(a => p.allergens?.includes(a))) return false
      if (p.price > maxPrice) return false
      if (inStockOnly && p.stock_quantity === 0) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name_za':    return b.name.localeCompare(a.name)
        case 'price_asc':  return a.price - b.price
        case 'price_desc': return b.price - a.price
        default:           return a.name.localeCompare(b.name)
      }
    })
    return list
  }, [products, search, selectedCategories, excludeAllergens, maxPrice, inStockOnly, sort])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged      = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const chips = [
    ...selectedCategories.map(c => ({ key: `cat-${c}`, label: c, onRemove: () => toggleCategory(c) })),
    ...excludeAllergens.map(a => {
      const al = ALLERGENS.find(x => x.name === a)
      return { key: `al-${a}`, label: `Exclude ${a}`, emoji: al?.emoji, onRemove: () => toggleAllergen(a) }
    }),
    ...(inStockOnly  ? [{ key: 'stock', label: 'In Stock',        onRemove: () => setInStock(false) }] : []),
    ...(maxPrice < MAX_PRICE ? [{ key: 'price', label: `Up to £${maxPrice}`, onRemove: () => setMaxPrice(MAX_PRICE) }] : []),
  ]

  const sidebar = (
    <div className={styles.filterPanel}>
      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Category</h3>
        <ul className={styles.filterList} role="list">
          {categoryOptions.map(c => (
            <li key={c}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={selectedCategories.includes(c)} onChange={() => toggleCategory(c)} className={styles.checkbox} />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Exclude Allergens</h3>
        <ul className={styles.filterList} role="list">
          {ALLERGENS.map(a => (
            <li key={a.name}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={excludeAllergens.includes(a.name)} onChange={() => toggleAllergen(a.name)} className={styles.checkbox} />
                <span aria-hidden="true">{a.emoji}</span> {a.name}
              </label>
            </li>
          ))}
        </ul>
        <p className={styles.filterHint}>Tick allergens to exclude. Products containing these will be hidden.</p>
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Max Price</h3>
        <input
          type="range" min={1} max={MAX_PRICE} step={1}
          value={maxPrice}
          onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1) }}
          className={styles.slider}
          aria-label={`Maximum price £${maxPrice}`}
        />
        <p className={styles.sliderValue}>Up to £{maxPrice}.00</p>
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Stock</h3>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={inStockOnly} onChange={e => { setInStock(e.target.checked); setPage(1) }} className={styles.checkbox} />
          In stock only
        </label>
      </div>

      {hasFilters && (
        <button className={styles.clearAll} onClick={clearAll}>× Clear all filters</button>
      )}
    </div>
  )

  return (
    <main className={styles.page}>
      {mobileFilterOpen && (
        <>
          <div className="overlay" onClick={() => setMobile(false)} aria-hidden="true" />
          <div className={styles.filterSheet} role="dialog" aria-label="Filters" aria-modal="true">
            <div className={styles.sheetHeader}>
              <h2>Filters</h2>
              <button onClick={() => setMobile(false)} aria-label="Close filters"><X size={20} /></button>
            </div>
            {sidebar}
          </div>
        </>
      )}

      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebar} aria-label="Product filters">{sidebar}</aside>

          <div className={styles.main}>
            <div className={styles.topRow}>
              <input
                type="search"
                className={`form-input ${styles.searchInput}`}
                placeholder="Search local produce..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search products"
              />
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1) }}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>Sort: {o.label}</option>
                ))}
              </select>
              <button className={`btn btn-outline btn-sm ${styles.mobileFilterBtn}`} onClick={() => setMobile(true)}>
                Filters {chips.length > 0 && <span className="badge badge-green">{chips.length}</span>}
              </button>
            </div>

            {chips.length > 0 && (
              <div className={styles.chipRow} role="list" aria-label="Active filters">
                {chips.map(chip => (
                  <span key={chip.key} className={styles.chip} role="listitem">
                    {chip.emoji && <span aria-hidden="true">{chip.emoji}</span>}
                    {chip.label}
                    <button className={styles.chipRemove} onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
                      <X size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className={styles.count}>
              Showing {paged.length} of {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>

            {loading && (
              <div className={styles.empty}>
                <p>Loading products...</p>
              </div>
            )}

            {!loading && loadError ? (
              <div className={styles.empty}>
                <p>{loadError}</p>
              </div>
            ) : !loading && filtered.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔍</span>
                <p>No products match your filters.</p>
                <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all filters</button>
              </div>
            ) : !loading ? (
              <ul className={styles.grid} role="list">
                {paged.map(p => <li key={p.product_id}><ProductCard product={p} /></li>)}
              </ul>
            ) : null}

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Page navigation">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ''}`}
                    onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ))}
                {page < totalPages && (
                  <button
                    className={styles.pageBtn}
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


