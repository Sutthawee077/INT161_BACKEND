/**
 * ==============================================================================================
 * 📁 File: src/middlewares/error-handler.js
 * 🏷️ Layer: Middleware (ชั้นจัดการข้อผิดพลาดแบบรวมศูนย์ - Centralized Error Handling Layer)
 * ==============================================================================================
 * 
 * 📖 ทำไมระบบต้องมี Centralized Error Handler?
 * 1. ลดความซ้ำซ้อน (DRY Principle):
 *    ไม่ต้องคอยเขียน `try...catch` แล้วส่ง `res.status(...).json(...)` ในทุกๆ Controller
 * 2. มาตรฐานผลลัพธ์ที่เป็นเอกภาพ (Uniform Error Schema):
 *    ทุก Error ที่เกิดขึ้นในระบบ ไม่ว่าจะมาจาก Validation, Database Exception, หรือ 404
 *    จะถูกส่งกลับหา Client ในโครงสร้าง JSON เดียวกันเสมอ
 * 3. ป้องกันข้อมูลหลุด (Security):
 *    ใน Production Mode เราจะไม่ส่ง Stack Trace หรือข้อความ Error ภายในฐานข้อมูลหลุดไปให้ User เห็น
 * 
 * ----------------------------------------------------------------------------------------------
 * ⚠️ กฎเหล็กของ Express Error-handling Middleware ที่ห้ามละเมิดเด็ดขาด:
 * ----------------------------------------------------------------------------------------------
 * 🪤 1. ต้องมี Parameter ครบ 4 ตัวเสมอ: `(err, req, res, next)`
 *    - Express อาศัย `fn.length === 4` ในการจำแนกว่า Middleware ตัวใดคือ Error Handler
 *    - หากคุณลบ `next` ออก เหลือเพียง `(err, req, res)` Express จะมองว่าเป็น Request Handler ปกติ
 *      และเมื่อเกิด Error ขึ้น ฟังก์ชันนี้จะไม่ถูกเรียกใช้งานเลย ทำให้เซิร์ฟเวอร์ค้างหรือ Crash!
 * 
 * 🪤 2. ต้องวางไว้ "บรรทัดสุดท้าย" ใน `app.js` เสมอ
 *    - Express จะประมวลผล Middleware ตามลำดับจากบนลงล่าง
 *    - หากวาง Error Handler ไว้ก่อนหน้า Routers จะไม่สามารถดักจับ Error ที่เกิดขึ้นใน Routers ได้เลย
 * ==============================================================================================
 */

/**
 * Global Error Handler สำหรับ Express
 * 
 * @function errorHandler
 * @param {Error|Object} err - Error Object ที่ถูกโยน (throw) หรือส่งต่อมาผ่าน next(err)
 * @param {Object} req - Express Request Object
 * @param {Object} res - Express Response Object
 * @param {Function} next - Express Next Function (ต้องคงไว้เสมอเพื่อให้ครบ 4 พารามิเตอร์)
 */
export function errorHandler(err, req, res, next) {
  // 1. ดึง HTTP Status Code: หากมีระบุใน error ให้ใช้ค่านั้น หากไม่มีให้ Fallback เป็น 500
  const status = err.status || err.statusCode || 500;

  // 2. ดึงรหัส Error Code: หาก status เป็น 500 ให้ตั้งเป็น INTERNAL_ERROR นอกนั้นเป็น INVALID_REQUEST
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST');

  // 3. ข้อความอธิบายความผิดพลาด (Error Message)
  const message = err.message || 'An error occurred';

  // 4. URL Path ที่เกิดข้อผิดพลาด (ตัด Query String ออกเพื่อให้ตรงตามมาตรฐาน Schema ของข้อสอบ)
  const path = req.originalUrl ? req.originalUrl.split('?')[0] : '';

  // 5. รายการ Field Errors ในกรณีที่เป็น Validation Error (หากไม่มีให้เป็นอาร์เรย์ว่าง [])
  const fieldErrors = Array.isArray(err.fieldErrors) ? err.fieldErrors : [];

  // 6. ส่ง Error Response JSON กลับไปยัง Client
  res.status(status).json({
    status,
    code,
    message,
    path,
    fieldErrors
  });
}
