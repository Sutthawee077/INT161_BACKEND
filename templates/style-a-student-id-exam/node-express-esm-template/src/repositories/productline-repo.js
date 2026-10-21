import db from '../configs/db-config.js'
import {AppError} from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const TABLE_NAME = "productlines"
const ENTITY_NAME = "ProductLine"

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE productLine = ?`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE productLine = ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE productLine = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`

async function count() {
    const [[{ total }]] = await db.query(COUNT_ALL);
    return total;
}

export async function findAll(pagination) {

    if (!pagination) {
        const [datas] = await db.query(FIND_ALL_SQL)
        return datas
    }
    const SQL = FIND_ALL_SQL + ' LIMIT ? OFFSET ?';
    const {limit, offset} = pagination
    const [datas] = await db.query(SQL, [limit, offset])
    datas.totalItems = await count()
    return datas
}

export async function findOne(id) {
    const [data] = await db.query(FIND_ONE_SQL, [id])
    if (data.length === 0) {
        throw new AppError(
            `${ENTITY_NAME} with code '${id}' was not found`,
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
    const key = data.productLine
    const [existingItem] = await db.query(FIND_ONE_SQL, [key])
    if (existingItem.length != 0) {
        throw new AppError(`Product line '${key}' already exists`,
            httpStatus.CONFLICT)
    }
    const [result] = await db.query(CREATE_SQL, [data])
    // console.log(result)
    return findOne(key)
}