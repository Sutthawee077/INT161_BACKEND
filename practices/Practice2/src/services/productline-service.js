/**
 * ==============================================================================================
 * 📁 File: Practice2/src/services/productline-service.js
 * 🏷️ Layer: Service (Business Logic สำหรับหมวดหมู่สินค้า)
 * ==============================================================================================
 * 
 * 📖 ข้อที่ 2: สร้างหมวดหมู่สินค้าใหม่ (Create Product Line)
 * - เงื่อนไข Validation: ฟิลด์ productLine จำเป็นต้องมี และต้องไม่ใช่ช่องว่าง
 *   หากไม่มีให้โยน HTTP 400 Bad Request (VALIDATION_ERROR)
 * - หากมีค่าซ้ำในฐานข้อมูล MySQL จะส่ง ER_DUP_ENTRY และ Error Handler จะตอบกลับเป็น 409 Conflict
 * ==============================================================================================
 */

import * as productlineRepo from '../repositories/productline-repo.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createProductLine(data) {
  const { productLine, textDescription, htmlDescription, image } = data || {};

  // 1. ตรวจสอบความถูกต้องของข้อมูล (Validation)
  if (!productLine || typeof productLine !== 'string' || productLine.trim() === '') {
    throw new AppError("Field 'productLine' is required and cannot be empty", 400, 'VALIDATION_ERROR');
  }

  // 2. ส่งข้อมูลที่ผ่านการตัดช่องว่างไปบันทึกลง Database
  return await productlineRepo.create({
    productLine: productLine.trim(),
    textDescription: textDescription ?? null,
    htmlDescription: htmlDescription ?? null,
    image: image ?? null
  });
}
