import db from '../configs/db-config.js'
import {AppError} from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const TABLE_NAME = "offices"
const ENTITY_NAME = "Office"

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME}`
const FIND_ALL_WITH_PAGE = `SELECT * FROM ${TABLE_NAME} LIMIT ? OFFSET ?`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE officeCode = ?`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE officeCode = ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE officeCode = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`

async function count() {
    const [[{ total }]] = await db.query(COUNT_ALL);
    return total;
}
export async function findAll(pagination) {
    console.log(pagination)
    if (!pagination) {
        const [datas] = await db.query(FIND_ALL_SQL)
        return datas
    }
    const {limit, offset} = pagination
    const [datas] = await db.query(FIND_ALL_WITH_PAGE, [limit, offset])
    datas.totalItems = await count()
    return datas
}

export async function findOne(id) {
    const [data] = await db.query(FIND_ONE_SQL, [id])
    if (data.length === 0) {
        throw new AppError(
            `${ENTITY_NAME} with code '${id}' was not found `,
            httpStatus.NOT_FOUND
        )
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