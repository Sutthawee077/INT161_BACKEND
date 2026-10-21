/**
 * ==============================================================================================
 * 📁 File: Practice2/src/repositories/office-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงตาราง offices)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 1: ค้นหาข้อมูลสำนักงานตาม officeCode (เช่น '1', '2', 'NA')
 * - ใช้ Parameterized Query ([officeCode]) เพื่อป้องกัน SQL Injection
 * - คืนค่าเป็นแถวแรกที่พบ หรือ null หากไม่พบข้อมูล
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

export async function findByCode(officeCode) {
  const [rows] = await db.query('SELECT * FROM offices WHERE officeCode = ?', [officeCode]);
  return rows.length > 0 ? rows[0] : null;
}
