const db = require('./db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS producers (
    producer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    description TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS allergens (
    allergen_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    producer_id INTEGER NOT NULL REFERENCES producers(producer_id),
    category_id INTEGER REFERENCES categories(category_id),
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK(price > 0),
    unit TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    batch_number TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_allergens (
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    allergen_id INTEGER NOT NULL REFERENCES allergens(allergen_id),
    PRIMARY KEY (product_id, allergen_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES users(user_id),
    order_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'placed',
    subtotal REAL NOT NULL,
    delivery_fee REAL NOT NULL DEFAULT 0.00,
    loyalty_discount REAL NOT NULL DEFAULT 0.00,
    total_amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    product_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS loyalty_accounts (
    loyalty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id),
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK(points_balance >= 0),
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'standard'
  );
`)

console.log('Database tables created successfully')
```

---


node database/schema.js