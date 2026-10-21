/**
 * ==============================================================================================
 * 📁 File: Practice2.0/src/repositories/product-repo.js
 * 🏷️ Layer: Repository (Generic CRUD & Pagination Template สำหรับสินค้า)
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * ไฟล์นี้เป็น "เทมเพลตมาตรฐานชั้นดี" สำหรับการทำ CRUD และระบบแบ่งหน้า (Pagination)
 * โดยใช้หลักการกำหนดตัวแปรส่วนกลาง (TABLE_NAME, PRIMARY_KEY) เพื่อให้สามารถนำไปปรับใช้
 * กับตารางอื่นๆ ในข้อสอบได้อย่างรวดเร็ว
 * 
 * 💡 สิ่งที่ควรสังเกตและนำไปใช้ในห้องสอบ:
 * 1. ฟังก์ชัน `count()`: รัน SELECT COUNT(*) เพื่อหาจำนวนแถวทั้งหมด นำไปคำนวณ totalPages
 * 2. ฟังก์ชัน `findAll(pagination)`: รองรับทั้งแบบดึงทั้งหมด หรือส่ง { limit, offset } มาเพื่อแบ่งหน้า
 * 3. ไวยากรณ์ SQL: `LIMIT ? OFFSET ?` (limit = จำนวนรายการต่อหน้า, offset = จุดเริ่มต้น)
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

// กำหนดชื่อ Table และ Primary Key (สำหรับ classicmodels คือ products และ productCode)
const TABLE_NAME = "products";
const ENTITY_NAME = "Product";
const PRIMARY_KEY = "productCode";

// เตรียมคำสั่ง SQL พื้นฐาน
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME}`;
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PRIMARY_KEY} = ?`;
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE ${PRIMARY_KEY} = ?`;
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PRIMARY_KEY} = ?`;
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`;
const COUNT_ALL_SQL = `SELECT COUNT(*) AS total FROM ${TABLE_NAME}`;

/**
 * ดึงจำนวนรายการทั้งหมดในตาราง (ใช้สำหรับคำนวณจำนวนหน้าทั้งหมดในระบบแบ่งหน้า)
 * @returns {Promise<number>} จำนวนแถวทั้งหมด
 */
export async function count() {
  const [[{ total }]] = await db.query(COUNT_ALL_SQL);
  return total;
}

/**
 * ดึงข้อมูลรายการสินค้าทั้งหมด หรือแบบแบ่งหน้า (Pagination)
 * @param {Object|null} pagination - ออบเจกต์ { page, limit, offset }
 * @returns {Promise<Array<Object>>} รายการสินค้า
 */
export async function findAll(pagination = null) {
  // หากไม่ได้ส่ง pagination เข้ามา ให้ดึงข้อมูลทั้งหมดตามปกติ
  if (!pagination) {
    const [datas] = await db.query(FIND_ALL_SQL);
    return datas;
  }

  // กำหนดค่า limit (จำนวนที่ต้องการดึงต่อหน้า ค่าเริ่มต้น: 10)
  const limit = Number(pagination.limit) || 10;

  // คำนวณค่า offset (จุดเริ่มต้นของแถวที่จะดึง)
  // หากมี offset ส่งมาตรงๆ ให้ใช้ค่านั้น หากไม่มีให้คำนวณจากสูตร: (page - 1) * limit
  const offset = pagination.offset !== undefined 
    ? Number(pagination.offset) 
    : ((Number(pagination.page) || 1) - 1) * limit;

  // รันคำสั่ง SQL พร้อมใส่ LIMIT ? OFFSET ?
  const SQL = FIND_ALL_SQL + ' LIMIT ? OFFSET ?';
  const [rows] = await db.query(SQL, [limit, offset]);
  return rows;
}

/**
 * ค้นหาสินค้าเดี่ยวตามรหัส Primary Key
 * @param {string|number} id - รหัสสินค้า
 * @returns {Promise<Object>} ข้อมูลสินค้า
 * @throws {Error} 404 หากไม่พบสินค้า
 */
export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    const err = new Error(`${ENTITY_NAME} not found for ${PRIMARY_KEY} = ${id}`);
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return data[0];
}

/**
 * อัปเดตข้อมูลสินค้าเดิมตาม ID
 * @param {string|number} id - รหัสสินค้า
 * @param {Object} data - ข้อมูลฟิลด์ที่จะแก้ไข
 * @returns {Promise<Object>} ข้อมูลสินค้าหลังการอัปเดต
 */
export async function update(id, data) {
  // ตรวจสอบก่อนว่ามีสินค้ารหัสนี้อยู่จริงหรือไม่ (ถ้าไม่มีจะ throw 404 ทันที)
  await findOne(id);
  // สั่งอัปเดตข้อมูล
  await db.query(UPDATE_SQL, [data, id]);
  return findOne(id);
}

/**
 * ลบสินค้าออกจากระบบตาม ID
 * @param {string|number} id - รหัสสินค้า
 * @returns {Promise<Object>} ข้อมูลสินค้าแถวที่เพิ่งถูกลบไป
 */
export async function remove(id) {
  const existing = await findOne(id);
  await db.query(REMOVE_SQL, [id]);
  return existing;
}

/**
 * เพิ่มสินค้าใหม่ลงในตาราง
 * @param {Object} data - ข้อมูลสินค้าใหม่
 * @returns {Promise<Object>} ข้อมูลสินค้าที่เพิ่งถูกบันทึก
 */
export async function create(data) {
  await db.query(CREATE_SQL, [data]);
  const id = data[PRIMARY_KEY] || data.id;
  return id ? findOne(id) : data;
}
