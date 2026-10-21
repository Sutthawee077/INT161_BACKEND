/**
 * ==============================================================================================
 * 📁 File: src/services/brand-service.js
 * 🏷️ Layer: Service (ชั้นตรรกะทางธุรกิจ - Business Logic Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Service Layer:
 * 1. เป็น "หัวใจหลัก" ในการประมวลผลตรรกะทางธุรกิจ (Business Rules) ของระบบ
 * 2. เป็นสะพานเชื่อมระหว่าง Controller (Route) และ Database Access (Repository)
 * 3. บริหารจัดการ Transaction หรือการเรียกใช้งานหลายๆ Repository ร่วมกัน
 * 4. ตัดสินใจว่าเมื่อเกิดเงื่อนไขที่ไม่ถูกต้อง จะต้องโยน Error ชนิดใด (เช่น 404 Not Found)
 * 
 * ----------------------------------------------------------------------------------------------
 * ⛔ กฎเหล็กของการออกแบบ Service Layer (Clean Architecture):
 * ----------------------------------------------------------------------------------------------
 * ❌ ห้ามรับ Object `req` หรือ `res` จาก Express เข้ามาใน Service เด็ดขาด!
 *    - เหตุผล: หาก Service ยึดติดกับ Express จะทำให้ไม่สามารถนำไปเขียน Unit Test แบบเดี่ยวๆ ได้
 *    - ข้อมูลทุกอย่างที่ส่งเข้า Service จะต้องเป็น Data ทั่วไป (เช่น number, string, object)
 * ❌ ห้ามสั่ง `res.status(...).json(...)` ในชั้นนี้เด็ดขาด
 *    - เมื่อพบข้อผิดพลาด ให้ใช้วิธีโยน `throw new Error(...)` พร้อมแนบ property `status` และ `code`
 *      เพื่อให้ Centralized Error Handler นำไปตอบสนองเอง
 * ==============================================================================================
 */

import * as brandRepo from '../repositories/brand-repo.js';

/**
 * ดึงรายการแบรนด์ทั้งหมดในระบบ
 * 
 * @async
 * @function getAllBrands
 * @returns {Promise<Array<Object>>} รายชื่อแบรนด์ทั้งหมด
 */
export async function getAllBrands() {
  // ส่งต่อไปยัง Repository โดยตรงเพื่อดึงข้อมูลทั้งหมด
  return await brandRepo.findAll();
}

/**
 * ค้นหาข้อมูลแบรนด์เดี่ยวตาม ID
 * 
 * @async
 * @function getBrandById
 * @param {number|string} id - รหัส ID ของแบรนด์ที่ต้องการค้นหา
 * @returns {Promise<Object|null>} ออบเจกต์แบรนด์ หรือ null หากไม่พบ
 */
export async function getBrandById(id) {
  return await brandRepo.findById(id);
}

/**
 * ตรวจสอบความมีอยู่ของแบรนด์ (Existence Check)
 * ฟังก์ชันนี้ใช้บ่อยมากเพื่อตรวจสอบก่อนที่ Product Service จะทำการสร้างหรือแก้ไขสินค้า
 * 
 * @async
 * @function checkBrandExists
 * @param {number|string} id - รหัส ID ของแบรนด์ที่ต้องการเช็ค
 * @returns {Promise<boolean>} คืนค่า true หากพบแบรนด์ในระบบจริง
 */
export async function checkBrandExists(id) {
  return await brandRepo.existsById(id);
}
