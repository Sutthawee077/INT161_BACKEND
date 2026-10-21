/**
 * ==============================================================================================
 * 📁 File: Practice2/src/repositories/customer-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงตาราง customers)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 4: ลบข้อมูลลูกค้า (Delete Customer)
 * - ลูกค้ามีความสัมพันธ์เป็น Foreign Key กับตาราง `orders` และ `payments`
 * - หากลูกค้ามีข้อมูล Order หรือ Payment ค้างอยู่ MySQL จะไม่อนุญาตให้ลบ
 *   และจะโยน Error `ER_ROW_IS_REFERENCED_2 (1451)`
 *   ซึ่งจะถูก Error Handler แปลงเป็น HTTP 409 Conflict (RESOURCE_IN_USE) อัตโนมัติ
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ค้นหาข้อมูลลูกค้าตาม customerNumber
 * @param {number|string} customerNumber - รหัสลูกค้า
 * @returns {Promise<Object|null>}
 */
export async function findByNumber(customerNumber) {
  const [rows] = await db.query('SELECT * FROM customers WHERE customerNumber = ?', [customerNumber]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * ลบข้อมูลลูกค้าออกจากตาราง customers
 * @param {number|string} customerNumber - รหัสลูกค้าที่ต้องการลบ
 * @returns {Promise<Object>} ผลลัพธ์จากการลบ (ResultSetHeader)
 */
export async function remove(customerNumber) {
  const [result] = await db.query('DELETE FROM customers WHERE customerNumber = ?', [customerNumber]);
  return result;
}
