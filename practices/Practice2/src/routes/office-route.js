/**
 * ==============================================================================================
 * 📁 File: Practice2/src/routes/office-route.js
 * 🏷️ Layer: Route / Controller (ข้อที่ 1: GET Office by ID)
 * ==============================================================================================
 * 
 * Endpoint: GET /api/<STUDENT_ID>/offices/:officeCode
 * - ดึงข้อมูลสำนักงานตาม officeCode
 * - หากพบ ตอบ 200 OK พร้อมโครงสร้าง { status: 'success', data: { ... } }
 * - หากไม่พบ โยน 404 ผ่าน next(err) เพื่อให้ errorHandler จัดการ
 * ==============================================================================================
 */

import express from 'express';
import * as officeService from '../services/office-service.js';

const router = express.Router();

router.get('/:officeCode', async (req, res, next) => {
  try {
    const { officeCode } = req.params;
    const office = await officeService.getOfficeById(officeCode);
    res.status(200).json({
      status: 'success',
      data: office
    });
  } catch (err) {
    next(err);
  }
});

export default router;
