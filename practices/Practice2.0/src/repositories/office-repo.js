/**
 * ==============================================================================================
 * 📁 File: Practice2.0/src/repositories/office-repo.js
 * 🏷️ Layer: Repository (การเข้าถึงข้อมูลตาราง offices)
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

export async function findByCode(officeCode) {
  const [rows] = await db.query('SELECT * FROM offices WHERE officeCode = ?', [officeCode]);
  return rows.length > 0 ? rows[0] : null;
}
