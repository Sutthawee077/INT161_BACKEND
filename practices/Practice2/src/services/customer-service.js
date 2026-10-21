/**
 * ==============================================================================================
 * 📁 File: Practice2/src/services/customer-service.js
 * 🏷️ Layer: Service (Business Logic สำหรับการลบลูกค้าและการบันทึกการชำระเงิน)
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * 
 * 📌 ส่วนที่ 1: การลบลูกค้า (Delete Customer - ข้อที่ 4)
 * 1. ตรวจสอบว่าลูกค้ามีอยู่จริงหรือไม่ $\rightarrow$ หากไม่พบ โยน HTTP 404 (CUSTOMER_NOT_FOUND)
 * 2. สั่งลบข้อมูล: หากมี Orders หรือ Payments อ้างอิงอยู่ MySQL จะปฏิเสธ (Error 1451)
 *    และ Error Handler จะตอบกลับเป็น HTTP 409 Conflict (RESOURCE_IN_USE)
 * 3. หากลบสำเร็จ ส่งข้อความ 'Customer record successfully deleted'
 * 
 * 📌 ส่วนที่ 2: การสร้างข้อมูลการชำระเงิน (Create Payment - ข้อที่ 5)
 * 1. ตรวจสอบว่าลูกค้ารหัส customerNumber มีอยู่จริง $\rightarrow$ ถ้าไม่พบ โยน HTTP 404
 * 2. ตรวจสอบ Business Rules:
 *    - `amount` ต้องเป็นตัวเลขและมากกว่า 0
 *    - `paymentDate` ต้องเป็นรูปแบบ ISO (YYYY-MM-DD)
 *    - `checkNumber` ต้องไม่เป็นค่าว่าง
 *    หากไม่ผ่าน โยน HTTP 400 Bad Request (INVALID_PAYMENT_DATA)
 * 3. บันทึกลงตาราง payments: หากส่งหมายเลขเช็คซ้ำเดิมสำหรับลูกค้ารายเดิม
 *    MySQL จะเกิด Duplicate Composite Key (Error 1062) $\rightarrow$ ส่ง HTTP 409 Conflict
 * ==============================================================================================
 */

import * as customerRepo from '../repositories/customer-repo.js';
import * as paymentRepo from '../repositories/payment-repo.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * ลบข้อมูลลูกค้าออกจากระบบ (ข้อที่ 4)
 */
export async function deleteCustomer(customerNumber) {
  // 1. ตรวจสอบว่ามีลูกค้าตามรหัสนี้หรือไม่
  const customer = await customerRepo.findByNumber(customerNumber);
  if (!customer) {
    throw new AppError(`Customer with ID '${customerNumber}' was not found`, 404, 'CUSTOMER_NOT_FOUND');
  }

  // 2. ดำเนินการลบข้อมูล (ถ้าติด Foreign Key Restrict จะถูกดักจับและตอบ 409)
  await customerRepo.remove(customerNumber);
  return { message: 'Customer record successfully deleted' };
}

/**
 * บันทึกประวัติการชำระเงินใหม่ (ข้อที่ 5)
 */
export async function createPayment(customerNumber, data) {
  // 1. ตรวจสอบว่าลูกค้ามีตัวตนในระบบจริงหรือไม่
  const customer = await customerRepo.findByNumber(customerNumber);
  if (!customer) {
    throw new AppError(`Customer with ID '${customerNumber}' was not found`, 404, 'CUSTOMER_NOT_FOUND');
  }

  // 2. ตรวจสอบ Business Rules ตามข้อกำหนดของโจทย์
  const { checkNumber, paymentDate, amount } = data || {};

  // ตรวจสอบยอดเงิน (amount) ต้องเป็นตัวเลขและมากกว่า 0
  if (amount === undefined || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new AppError('Payment amount must be greater than zero', 400, 'INVALID_PAYMENT_DATA');
  }

  // ตรวจสอบฟอร์แมตวันที่ ต้องเป็น YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!paymentDate || typeof paymentDate !== 'string' || !dateRegex.test(paymentDate) || isNaN(Date.parse(paymentDate))) {
    throw new AppError('Invalid payment date format, expected YYYY-MM-DD', 400, 'INVALID_PAYMENT_DATA');
  }

  // ตรวจสอบหมายเลขเช็ค (checkNumber) ห้ามเป็นค่าว่าง
  if (!checkNumber || typeof checkNumber !== 'string' || checkNumber.trim() === '') {
    throw new AppError('Check number is required', 400, 'INVALID_PAYMENT_DATA');
  }

  // 3. บันทึกข้อมูลลงในตาราง payments
  // หากชน Composite Primary Key (customerNumber + checkNumber ซ้ำ) จะตอบ 409 อัตโนมัติ
  return await paymentRepo.create({
    customerNumber,
    checkNumber: checkNumber.trim(),
    paymentDate,
    amount
  });
}
