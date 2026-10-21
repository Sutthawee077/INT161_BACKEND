/**
 * ==============================================================================================
 * 📁 File: Practice2/src/middleware/errorHandler.js
 * 🏷️ Layer: Middleware (การจัดการ Exception และ Error รวมศูนย์)
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * 1. กำหนดคลาส `AppError` สำหรับให้ Service Layer ใช้ throw Error พร้อมระบุ HTTP Status และ Error Code
 * 2. จัดการดักจับข้อผิดพลาดทั้งหมดในระบบ ทั้ง Custom Error และ MySQL Native Errors
 * 3. แปลง MySQL Error Codes อัตโนมัติ:
 *    - `ER_DUP_ENTRY` (1062) $\rightarrow$ ตอบ HTTP 409 Conflict (DUPLICATE_KEY)
 *    - `ER_NO_REFERENCED_ROW_2` (1452) $\rightarrow$ ตอบ HTTP 400 Bad Request (FOREIGN_KEY_NOT_FOUND)
 *    - `ER_ROW_IS_REFERENCED_2` (1451) $\rightarrow$ ตอบ HTTP 409 Conflict (RESOURCE_IN_USE)
 * 4. ส่งกลับ Response ในรูปแบบ JSON Schema ตามที่อาจารย์กำหนด (ห้ามส่ง HTML error page)
 * ==============================================================================================
 */

/**
 * Custom Error Class สำหรับระบบ
 * @param {string} message - ข้อความอธิบายความผิดพลาดเป็นภาษาอังกฤษ
 * @param {number} statusCode - HTTP Status Code เช่น 400, 404, 409
 * @param {string} errorCode - รหัส Error String ประจำกรณี เช่น OFFICE_NOT_FOUND
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Centralized Error Handling Middleware
 * ⚠️ ต้องมีพารามิเตอร์ครบ 4 ตัวเสมอ: (err, req, res, next)
 */
const errorHandler = (err, req, res, next) => {
  // ค่าเริ่มต้นหากไม่ได้ระบุไว้
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // ----------------------------------------------------------------------------
  // ตรวจจับและแปลง MySQL Error Codes เป็น Client HTTP Error
  // ----------------------------------------------------------------------------
  // 1. Primary Key หรือ Unique Key ซ้ำ (เช่น รหัส ProductLine หรือ Composite Key ใน Payments ซ้ำ)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    message = 'Resource already exists (Primary key or unique constraint violation)';
  } 
  // 2. Foreign Key อ้างอิงไปยังแถวที่ไม่มีอยู่จริง (เช่น officeCode หรือ reportsTo ไม่มีใน DB)
  else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    errorCode = 'FOREIGN_KEY_NOT_FOUND';
    message = 'Referenced foreign key record does not exist';
  } 
  // 3. กำลังลบข้อมูลที่มีตารางอื่นอ้างอิงอยู่ (เช่น ลบลูกค้าที่มี Orders หรือ Payments ค้างอยู่)
  else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    errorCode = 'RESOURCE_IN_USE';
    message = 'Cannot delete or modify resource because it is referenced by related records';
  }

  // ----------------------------------------------------------------------------
  // ส่ง JSON Error Response กลับไปยัง Client ตาม Schema ที่ข้อสอบระบุ
  // ----------------------------------------------------------------------------
  res.status(statusCode).json({
    status: 'error',
    error: {
      code: errorCode,
      message: message
    }
  });
};

export { AppError, errorHandler };
