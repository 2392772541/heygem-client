import { connect } from '../db/index.js'

export function list() {
  const db = connect()
  const groups = db
    .prepare(
      `SELECT g.id, g.name, g.sort_order, g.created_at, COUNT(m.id) as model_count
       FROM model_group g
       LEFT JOIN f2f_model m ON g.id = m.group_id
       GROUP BY g.id
       ORDER BY g.sort_order ASC, g.created_at ASC`
    )
    .all()

  const ungroupedRow = db
    .prepare(`SELECT COUNT(*) as count FROM f2f_model WHERE group_id IS NULL`)
    .get()

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM f2f_model`).get()

  return {
    groups,
    ungroupedCount: ungroupedRow ? ungroupedRow.count : 0,
    totalCount: totalRow ? totalRow.count : 0
  }
}

export function insert(name) {
  const db = connect()
  const trimmed = (name || '').trim()
  if (!trimmed) {
    throw new Error('分组名称不能为空')
  }
  const existing = db
    .prepare(`SELECT id FROM model_group WHERE name = ? COLLATE NOCASE`)
    .get(trimmed)
  if (existing) {
    throw new Error('该分组名称已存在')
  }
  const stmt = db.prepare(
    `INSERT INTO model_group (name, sort_order, created_at) VALUES (?, 0, ?)`
  )
  const info = stmt.run(trimmed, Date.now())
  return {
    id: info.lastInsertRowid,
    name: trimmed
  }
}

export function rename(id, name) {
  const db = connect()
  const trimmed = (name || '').trim()
  if (!trimmed) {
    throw new Error('分组名称不能为空')
  }
  const existing = db
    .prepare(`SELECT id FROM model_group WHERE name = ? COLLATE NOCASE AND id != ?`)
    .get(trimmed, id)
  if (existing) {
    throw new Error('该分组名称已存在')
  }
  db.prepare(`UPDATE model_group SET name = ? WHERE id = ?`).run(trimmed, id)
  return { id, name: trimmed }
}

export function remove(id) {
  const db = connect()
  const deleteTx = db.transaction(() => {
    // 1. 将关联模特置为空（未分组），绝不删除模特资产
    db.prepare(`UPDATE f2f_model SET group_id = NULL WHERE group_id = ?`).run(id)
    // 2. 删除分组记录
    db.prepare(`DELETE FROM model_group WHERE id = ?`).run(id)
  })
  deleteTx()
  return true
}

export function selectById(id) {
  const db = connect()
  return db.prepare(`SELECT * FROM model_group WHERE id = ?`).get(id)
}
