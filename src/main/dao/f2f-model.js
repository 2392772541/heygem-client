import { connect } from '../db/index.js'

export function insert({ modelName, videoPath, audioPath, voiceId, groupId = null }) {
  const db = connect()
  const stmt = db.prepare(
    'INSERT INTO f2f_model (name, video_path, audio_path, voice_id, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const info = stmt.run(modelName, videoPath, audioPath, voiceId, groupId || null, Date.now())
  return info.lastInsertRowid
}

export function selectPage({ page, pageSize, name = '', groupId = undefined }) {
  const db = connect()
  const offset = (page - 1) * pageSize

  const safeName = (name || '').replace(/'/g, "''")
  let whereClause = `WHERE m.name like '%${safeName}%'`

  if (groupId === 'ungrouped' || groupId === null || groupId === 'null') {
    whereClause += ' AND m.group_id IS NULL'
  } else if (groupId !== undefined && groupId !== '' && groupId !== 'all') {
    whereClause += ` AND m.group_id = ${Number(groupId)}`
  }

  const rows = db
    .prepare(
      `SELECT m.*, g.name as group_name
       FROM f2f_model m
       LEFT JOIN model_group g ON m.group_id = g.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`
    )
    .all()
  return rows
}

export function count(param = '') {
  const db = connect()
  let searchName = ''
  let targetGroup = undefined

  if (typeof param === 'string') {
    searchName = param
  } else if (typeof param === 'object' && param !== null) {
    searchName = param.name || ''
    targetGroup = param.groupId
  }

  const safeName = (searchName || '').replace(/'/g, "''")
  let whereClause = `WHERE name like '%${safeName}%'`

  if (targetGroup === 'ungrouped' || targetGroup === null || targetGroup === 'null') {
    whereClause += ' AND group_id IS NULL'
  } else if (targetGroup !== undefined && targetGroup !== '' && targetGroup !== 'all') {
    whereClause += ` AND group_id = ${Number(targetGroup)}`
  }

  const rows = db
    .prepare(`SELECT COUNT(*) as total FROM f2f_model ${whereClause}`)
    .get()
  return rows ? rows.total : 0
}

export function selectByID(id) {
  const db = connect()
  const stmt = db.prepare(
    `SELECT m.*, g.name as group_name
     FROM f2f_model m
     LEFT JOIN model_group g ON m.group_id = g.id
     WHERE m.id = ?`
  )
  const row = stmt.get(id)
  return row
}

export function updateGroup(modelId, groupId) {
  const db = connect()
  const gId =
    groupId === 'ungrouped' || groupId === null || groupId === '' || groupId === 'all'
      ? null
      : Number(groupId)
  db.prepare('UPDATE f2f_model SET group_id = ? WHERE id = ?').run(gId, modelId)
  return true
}

export function batchUpdateGroup(modelIds, groupId) {
  const db = connect()
  const gId =
    groupId === 'ungrouped' || groupId === null || groupId === '' || groupId === 'all'
      ? null
      : Number(groupId)
  const stmt = db.prepare('UPDATE f2f_model SET group_id = ? WHERE id = ?')
  const tx = db.transaction((ids) => {
    for (const id of ids) {
      stmt.run(gId, id)
    }
  })
  tx(modelIds)
  return true
}

export function remove(id) {
  const db = connect()
  db.prepare(`DELETE FROM f2f_model WHERE id = ?`).run(id)
}
