/**
 * ==============================================================================================
 * 📁 File: Practice2/src/repositories/payment-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงตาราง payments)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 5: จัดการข้อมูลการชำระเงิน (Payments)
 * - ตาราง payments มี Primary Key แบบ "Composite Primary Key" (2 คอลัมน์คู่กัน):
 *   `(customerNumber, checkNumber)`
 * - หากบันทึกข้อมูลซ้ำคู่เดิม MySQL จะโยน Error `ER_DUP_ENTRY (1062)`
 *   และ Error Handler จะตอบกลับเป็น HTTP 409 Conflict
 * - ใช้ `DATE_FORMAT(paymentDate, "%Y-%m-%d")` เพื่อจัดฟอร์แมตวันที่ให้เป็น ISO สวยงาม
 * - แปลง `parseFloat(rows[0].amount)` เพื่อให้ได้ค่าตัวเลขทศนิยมแท้จริง
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ค้นหาข้อมูลการชำระเงินตาม Composite Primary Key (customerNumber + checkNumber)
 * @param {number|string} customerNumber - รหัสลูกค้า
 * @param {string} checkNumber - หมายเลขเช็ค
 * @returns {Promise<Object|null>}
 */
export async function findOne(customerNumber, checkNumber) {
  const [rows] = await db.query(
    'SELECT customerNumber, checkNumber, DATE_FORMAT(paymentDate, "%Y-%m-%d") AS paymentDate, amount FROM payments WHERE customerNumber = ? AND checkNumber = ?',
    [customerNumber, checkNumber]
  );
  if (rows.length === 0) return null;
  return {
    customerNumber: rows[0].customerNumber,
    checkNumber: rows[0].checkNumber,
    paymentDate: rows[0].paymentDate,
    amount: parseFloat(rows[0].amount)
  };
}

/**
 * บันทึกประวัติการชำระเงินใหม่ลงในตาราง payments
 * @param {Object} data - ข้อมูลการชำระเงิน
 * @returns {Promise<Object>} ข้อมูลการชำระเงินที่เพิ่งถูกบันทึก
 */
export async function create(data) {
  const sql = 'INSERT INTO payments (customerNumber, checkNumber, paymentDate, amount) VALUES (?, ?, ?, ?)';
  await db.query(sql, [data.customerNumber, data.checkNumber, data.paymentDate, data.amount]);
  return await findOne(data.customerNumber, data.checkNumber);
}
