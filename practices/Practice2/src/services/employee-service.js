/**
 * ==============================================================================================
 * 📁 File: Practice2/src/services/employee-service.js
 * 🏷️ Layer: Service (Business Logic สำหรับการแก้ไขข้อมูลพนักงาน)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 3: อัปเดตข้อมูลพนักงาน (Update Employee)
 * 1. ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่ $\rightarrow$ หากไม่พบ โยน HTTP 404 (EMPLOYEE_NOT_FOUND)
 * 2. ตรวจสอบรูปแบบอีเมล (Email Format Validation) ด้วย Regex $\rightarrow$ หากผิด โยน HTTP 400 (INVALID_EMAIL)
 * 3. อัปเดตข้อมูลลงฐานข้อมูล:
 *    - หากส่ง `officeCode` หรือ `reportsTo` ที่ไม่มีอยู่จริง
 *    - MySQL จะโยน Error ER_NO_REFERENCED_ROW_2 (1452)
 *    - Error Handler กลางจะแปลงเป็น HTTP 400 FOREIGN_KEY_NOT_FOUND ให้เองโดยอัตโนมัติ
 * ==============================================================================================
 */

import * as employeeRepo from '../repositories/employee-repo.js';
import { AppError } from '../middleware/errorHandler.js';

export async function updateEmployee(employeeNumber, data) {
  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 1: ตรวจสอบความมีอยู่ของพนักงาน
  // ----------------------------------------------------------------------------
  const existingEmployee = await employeeRepo.findByNumber(employeeNumber);
  if (!existingEmployee) {
    throw new AppError(`Employee with ID '${employeeNumber}' was not found`, 404, 'EMPLOYEE_NOT_FOUND');
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 2: ตรวจสอบรูปแบบอีเมล (Email Format Validation)
  // ----------------------------------------------------------------------------
  const { firstName, lastName, email, officeCode, reportsTo, jobTitle, extension } = data || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    throw new AppError('Invalid email address format', 400, 'INVALID_EMAIL');
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 3: จัดเตรียมข้อมูลสำหรับอัปเดต (อัปเดตเฉพาะฟิลด์ที่มีการส่งค่าเข้ามา)
  // ----------------------------------------------------------------------------
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email.trim();
  if (officeCode !== undefined) updateData.officeCode = officeCode;
  // จัดการกรณี reportsTo เป็นค่าว่าง หรือ null
  if (reportsTo !== undefined) updateData.reportsTo = reportsTo === '' || reportsTo === null ? null : reportsTo;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (extension !== undefined) updateData.extension = extension;

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 4: สั่งอัปเดตข้อมูลลงใน MySQL
  // หากติด Foreign Key จะถูก Error Handler แปลงเป็น 400 อัตโนมัติ
  // ----------------------------------------------------------------------------
  return await employeeRepo.update(employeeNumber, updateData);
}
