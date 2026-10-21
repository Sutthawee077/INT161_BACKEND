/**
 * ==============================================================================================
 * 📁 File: src/routes/brand-route.js
 * 🏷️ Layer: Route / Controller (ชั้นควบคุมการรับส่งข้อมูลของแบรนด์ - Controller Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Route Layer:
 * 1. รับ HTTP Request ที่ยิงเข้ามายังเส้นทาง `/api/v1/brands`
 * 2. ตรวจสอบความถูกต้องของ Query String (โจทย์ห้ามมี Query ใดๆ บน Endpoint นี้)
 * 3. เรียกใช้งาน `brandService` เพื่อดึงข้อมูลจากชั้น Business Logic
 * 4. ส่ง HTTP Status Code (200 OK) และ Response Body กลับไปยัง Client
 * 5. ปฏิเสธ HTTP Method อื่นๆ ที่ไม่รองรับ (เช่น POST, PUT, DELETE บน /brands)
 *    ด้วยการตอบกลับเป็น **`HTTP 405 Method Not Allowed`**
 * ==============================================================================================
 */

import express from 'express';
import * as brandService from '../services/brand-service.js';

const router = express.Router();

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [GET] /api/v1/brands
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: ดึงรายชื่อแบรนด์ทั้งหมดในระบบ
 * 
 * 💡 สิ่งที่ข้อสอบตรวจสอบ:
 * 1. ตอบกลับด้วย HTTP Status 200 OK
 * 2. คืนค่า JSON Array ของแบรนด์ทั้งหมด
 * 3. ⚠️ ห้ามส่ง Query Parameter มาที่ Endpoint นี้เด็ดขาด
 *    หาก Client ส่ง เช่น `/api/v1/brands?sort=name` หรือ `/api/v1/brands?foo=bar`
 *    จะต้องตอบกลับเป็น HTTP 400 INVALID_REQUEST ทันที
 */
router.get('/', async (req, res, next) => {
  try {
    // ใช้ new URL ช่วยแยกและตรวจสอบ Query String
    const url = new URL(req.originalUrl, 'http://localhost');
    
    // หากมี Query String แนบมา (search !== '') ให้ปฏิเสธด้วย 400 ทันที
    if (url.search !== '') {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Query parameters are not allowed on /brands',
        path: req.originalUrl.split('?')[0],
        fieldErrors: []
      });
    }

    // เรียก Brand Service เพื่อดึงข้อมูลแบรนด์ทั้งหมด
    const brands = await brandService.getAllBrands();
    
    // ตอบกลับด้วย HTTP 200 OK พร้อมข้อมูลในรูปแบบ JSON
    res.json(brands);
  } catch (err) {
    // หากเกิด Error ให้ส่งต่อให้ Centralized Error Handler จัดการ
    next(err);
  }
});

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [ALL OTHER METHODS] /api/v1/brands/*
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: ดักจับ HTTP Method อื่นๆ ที่ไม่มีการเปิดให้บริการ เช่น:
 * - POST /api/v1/brands
 * - PUT /api/v1/brands
 * - DELETE /api/v1/brands
 * 
 * ตอบกลับด้วย HTTP 405 Method Not Allowed ตามมาตรฐาน RESTful Specification
 */
router.all('*', (req, res) => {
  res.status(405).json({
    status: 405,
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method Not Allowed',
    path: req.originalUrl.split('?')[0],
    fieldErrors: []
  });
});

export default router;
