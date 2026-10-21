/**
 * ==============================================================================================
 * 📁 File: Practice2/src/routes/productline-route.js
 * 🏷️ Layer: Route / Controller (ข้อที่ 2: Create Product Line)
 * ==============================================================================================
 * 
 * Endpoint: POST /api/<STUDENT_ID>/productlines
 * - รับ Request Body { productLine, textDescription, ... }
 * - เมื่อสำเร็จ ตอบกลับด้วย HTTP 201 Created พร้อมข้อมูลที่เพิ่งสร้าง
 * - หากค่าซ้ำหรือข้อมูลไม่ถูกต้อง จะถูก errorHandler จัดการเป็น 409 หรือ 400
 * ==============================================================================================
 */

import express from 'express';
import * as productlineService from '../services/productline-service.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const created = await productlineService.createProductLine(req.body);
    res.status(201).json({
      status: 'success',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

export default router;
