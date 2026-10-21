/**
 * ==============================================================================================
 * 📁 File: Practice2/src/services/office-service.js
 * 🏷️ Layer: Service (Business Logic สำหรับตาราง offices)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 1: ดึงข้อมูลสำนักงานเดี่ยวตามรหัส
 * - หากไม่พบข้อมูล ห้ามส่ง Object ว่างหรือ null
 * - ต้องโยน AppError สถานะ 404 Not Found (OFFICE_NOT_FOUND) ไปให้ Error Handler จัดการ
 * ==============================================================================================
 */

import * as officeRepo from '../repositories/office-repo.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getOfficeById(officeCode) {
  const office = await officeRepo.findByCode(officeCode);
  if (!office) {
    // โยน 404 เมื่อไม่พบสำนักงาน
    throw new AppError(`Office with code '${officeCode}' was not found`, 404, 'OFFICE_NOT_FOUND');
  }
  return office;
}
