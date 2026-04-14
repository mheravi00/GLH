const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbFile = process.env.DB_FILE || 'glh.local.db'
const db = new sqlite3.Database(path.join(__dirname, dbFile))

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA journal_mode = DELETE')
})

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  )

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  )

db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes })
    })
  )

db.execAsync = (sql) =>
  new Promise((resolve, reject) =>
    db.exec(sql, (err) => (err ? reject(err) : resolve()))
  )

module.exports = db