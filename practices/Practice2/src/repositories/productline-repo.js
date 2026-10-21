/**
 * ==============================================================================================
 * 📁 File: Practice2/src/repositories/productline-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงตาราง productlines)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 2: บันทึกข้อมูลหมวดหมู่สินค้าใหม่ (Create Product Line)
 * - คอลัมน์ `productLine` เป็น String Primary Key ที่รับค่ามาจาก Client โดยตรง (Non-Auto-Increment)
 * - หากค่าซ้ำกับที่มีอยู่แล้วในฐานข้อมูล MySQL จะโยน Error `ER_DUP_ENTRY (1062)`
 *   ซึ่งจะถูก Error Handler ดักจับและตอบกลับเป็น HTTP 409 Conflict โดยอัตโนมัติ
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ค้นหาหมวดหมู่สินค้าตามชื่อ productLine
 * @param {string} productLine - ชื่อหมวดหมู่สินค้า
 * @returns {Promise<Object|null>}
 */
export async function findByProductLine(productLine) {
  const [rows] = await db.query('SELECT * FROM productlines WHERE productLine = ?', [productLine]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * เพิ่มหมวดหมู่สินค้าใหม่ลงในตาราง productlines
 * @param {Object} data - ข้อมูลหมวดหมู่สินค้า
 * @returns {Promise<Object>} ข้อมูลหมวดหมู่สินค้าที่เพิ่งถูกเพิ่ม
 */
export async function create(data) {
  const sql = 'INSERT INTO productlines (productLine, textDescription, htmlDescription, image) VALUES (?, ?, ?, ?)';
  await db.query(sql, [
    data.productLine,
    data.textDescription ?? null,
    data.htmlDescription ?? null,
    data.image ?? null
  ]);
  return await findByProductLine(data.productLine);
}
