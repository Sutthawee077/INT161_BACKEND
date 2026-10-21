/**
 * ==============================================================================================
 * 📁 File: src/repositories/brand-repo.js
 * 🏷️ Layer: Repository (ชั้นการเข้าถึงฐานข้อมูลดิบ - Data Access Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Repository Layer:
 * 1. รับผิดชอบการติดต่อสื่อสารกับฐานข้อมูล MySQL โดยตรงผ่านคำสั่ง SQL ดิบ (Raw SQL)
 * 2. เป็นผู้ประกอบและรันคำสั่ง SELECT, INSERT, UPDATE, DELETE บนตาราง 'brands'
 * 3. ทำ Data Mapping เบื้องต้น แปลงผลลัพธ์จาก Recordset ของ MySQL ให้อยู่ในรูป Object สะอาด
 * 
 * ----------------------------------------------------------------------------------------------
 * ⛔ ข้อห้ามเด็ดขาดของ Repository Layer (Architecture Violation):
 * ----------------------------------------------------------------------------------------------
 * ❌ ห้ามรับ Object `req` หรือ `res` ของ Express เข้ามาในฟังก์ชันนี้เด็ดขาด
 * ❌ ห้ามส่ง HTTP Status Code (เช่น 200, 404, 500) ในชั้นนี้
 * ❌ ห้ามเขียน `res.json(...)` หรือสั่งตอบกลับหา Client จากชั้นนี้
 * ❌ ห้าม Hardcode ค่าตัวแปรลงในสตริง SQL โดยตรง เช่น `WHERE id = ` + id (ผิดกฎความปลอดภัย SQL Injection)
 * 
 * ----------------------------------------------------------------------------------------------
 * 💡 เทคนิคและแนวทางปฏิบัติในการทำข้อสอบ (Best Practices):
 * ----------------------------------------------------------------------------------------------
 * 1. ใช้ Parameterized Queries (เครื่องหมาย ?) ทุกครั้งที่มีตัวแปรภายนอกเข้ามา
 * 2. ใช้ Array Destructuring `const [rows] = await db.query(...)` เพราะ mysql2 จะคืนค่า 2 อย่าง:
 *    - ตัวที่ 1 (`rows`): ข้อมูลแถวที่ได้จากการ Query
 *    - ตัวที่ 2 (`fields`): Metadata รายละเอียดของคอลัมน์ในตาราง (ปกติไม่ได้ใช้)
 * 3. เทคนิค `SELECT 1 ... LIMIT 1` ในการตรวจสอบความมีอยู่ (Existence Check):
 *    - เร็วกว่า `SELECT *` อย่างมหาศาล เพราะฐานข้อมูลไม่ต้องส่งข้อมูลทุกคอลัมน์กลับมา
 *    - MySQL จะหยุดสแกนดัชนีทันทีที่พบแถวแรก ทำให้ประหยัด I/O และเวลาอย่างมาก
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ดึงรายการแบรนด์ทั้งหมดในระบบ เรียงลำดับตาม ID จากน้อยไปมาก
 * 
 * @async
 * @function findAll
 * @returns {Promise<Array<{id: number, name: string, country: string}>>} อาร์เรย์ของออบเจกต์แบรนด์ทั้งหมด
 * 
 * @example
 * const brands = await brandRepo.findAll();
 * // ผลลัพธ์: [ { id: 1, name: 'Apple', country: 'United States' }, ... ]
 */
export async function findAll() {
  // รันคำสั่ง SQL ดึงเฉพาะคอลัมน์ที่จำเป็น พร้อมเรียงลำดับ ID จากน้อยไปมาก (ORDER BY id ASC)
  const [rows] = await db.query('SELECT id, name, country FROM brands ORDER BY id ASC');
  
  // แปลงชนิดข้อมูล id ให้มั่นใจว่าเป็น Number 100% (ป้องกันกรณีไดรเวอร์คืนค่าเป็น string หรือ bigint)
  return rows.map(r => ({
    id: Number(r.id),
    name: r.name,
    country: r.country
  }));
}

/**
 * ค้นหาข้อมูลแบรนด์เดี่ยวตาม ID
 * 
 * @async
 * @function findById
 * @param {number|string} id - รหัส ID ของแบรนด์ที่ต้องการค้นหา
 * @returns {Promise<{id: number, name: string, country: string}|null>} ออบเจกต์แบรนด์ หรือ null หากไม่พบข้อมูล
 * 
 * @example
 * const brand = await brandRepo.findById(1);
 * if (!brand) {
 *   // จัดการกรณีไม่พบข้อมูล (ส่งต่อให้ Service โยน 404)
 * }
 */
export async function findById(id) {
  // สังเกตการส่ง [id] เป็น Parameter อาเรย์ตัวที่สอง เครื่องหมาย ? จะถูก sanitize อัตโนมัติ ป้องกัน SQL Injection
  const [rows] = await db.query('SELECT id, name, country FROM brands WHERE id = ?', [id]);
  
  // ถ้า rows.length === 0 แปลว่าไม่มีข้อมูลแบรนด์รหัสนี้ในฐานข้อมูล
  if (rows.length === 0) {
    return null; // คืนค่า null เพื่อให้ Service Layer นำไปตัดสินใจทาง Business Logic ต่อไป
  }
  
  // นำแถวแรกมาจัดฟอร์แมตข้อมูลส่งกลับ
  const r = rows[0];
  return {
    id: Number(r.id),
    name: r.name,
    country: r.country
  };
}

/**
 * ตรวจสอบว่ามีแบรนด์รหัส ID นี้อยู่ในฐานข้อมูลหรือไม่ (Fast Existence Check)
 * ฟังก์ชันนี้ออกแบบมาเพื่อใช้ในจุดที่มีการตรวจสอบสิทธิ์หรือความถูกต้อง เช่น ตอนสร้าง/แก้ไขสินค้า
 * 
 * @async
 * @function existsById
 * @param {number|string} id - รหัส ID ของแบรนด์ที่ต้องการตรวจสอบ
 * @returns {Promise<boolean>} คืนค่า true หากพบแบรนด์ในระบบ, false หากไม่พบ
 * 
 * @example
 * const isExist = await brandRepo.existsById(data.brandId);
 * if (!isExist) {
 *   throw new Error('Brand not found');
 * }
 */
export async function existsById(id) {
  // SELECT 1 คือให้ฐานข้อมูลคืนค่าเลข 1 แถวเดียว ไม่ต้องเสียเวลาอ่านเนื้อหาในตาราง
  // LIMIT 1 บอกให้ MySQL หยุดการค้นหาทันทีที่เจอแถวแรกที่ตรงเงื่อนไข ไม่ต้องกวาดทั้งตาราง
  const [rows] = await db.query('SELECT 1 FROM brands WHERE id = ? LIMIT 1', [id]);
  
  // ถ้า rows.length > 0 แสดงว่าพบข้อมูลในฐานข้อมูล คืนค่า true ทันที
  return rows.length > 0;
}
