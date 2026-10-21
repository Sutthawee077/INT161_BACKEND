/**
 * ==============================================================================================
 * 📁 File: Practice2/src/repositories/employee-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงตาราง employees)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 3: จัดการข้อมูลพนักงาน (Find & Update Employee)
 * - มีความสัมพันธ์ Foreign Key 2 จุด:
 *   1. `officeCode` ต้องมีอยู่จริงในตาราง `offices`
 *   2. `reportsTo` (หัวหน้า) ต้องมีอยู่จริงในตาราง `employees`
 * - หากส่งค่า FK ที่ไม่มีอยู่จริง MySQL จะโยน Error `ER_NO_REFERENCED_ROW_2 (1452)`
 *   ซึ่งจะถูก Error Handler ดักจับและตอบกลับเป็น HTTP 400 Bad Request
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ค้นหาข้อมูลพนักงานตามรหัส employeeNumber
 * @param {number|string} employeeNumber - รหัสพนักงาน
 * @returns {Promise<Object|null>}
 */
export async function findByNumber(employeeNumber) {
  const [rows] = await db.query('SELECT * FROM employees WHERE employeeNumber = ?', [employeeNumber]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * อัปเดตข้อมูลพนักงานตาม employeeNumber
 * @param {number|string} employeeNumber - รหัสพนักงานที่ต้องการอัปเดต
 * @param {Object} data - ข้อมูลฟิลด์ต่างๆ ที่ต้องการแก้ไข
 * @returns {Promise<Object>} ข้อมูลพนักงานหลังการอัปเดต
 */
export async function update(employeeNumber, data) {
  // สังเกตการใช้ 'SET ?' ของ mysql2 ซึ่งจะช่วยแปลง Object ให้เป็นคำสั่ง UPDATE อัตโนมัติ
  const sql = 'UPDATE employees SET ? WHERE employeeNumber = ?';
  await db.query(sql, [data, employeeNumber]);
  return await findByNumber(employeeNumber);
}
