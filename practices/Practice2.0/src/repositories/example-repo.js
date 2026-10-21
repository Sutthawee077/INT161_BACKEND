import db from '../configs/db-config.js'

const TABLE_NAME = "subjects"
const ENTITY_NAME = "Subject"

const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE id = ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE id = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`

export async function findAll() {
    const [datas] = await db.query(FIND_ALL_SQL)
    return datas
}

export async function findOne(id) {
    const [data] = await db.query(FIND_ONE_SQL, [id])
    if (data.length === 0) {
        const err = new Error(`${ENTITY_NAME} not found for id = ${id}`)
        err.statusCode = 404
        err.code = "NOT FOUND"
        throw err
    }
    return data[0]
}

export async function update(id, data) {
    await findOne(id)
    await db.query(UPDATE_SQL, [data, id])
    return findOne(id)
}

export async function remove(id) {
    await findOne(id)
    const [data] = await db.query(REMOVE_SQL, [id])
    return data
}

export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])
    return findOne(result.insertId)
}