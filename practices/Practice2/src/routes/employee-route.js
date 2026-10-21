/**
 * ==============================================================================================
 * 📁 File: Practice2/src/routes/employee-route.js
 * 🏷️ Layer: Route / Controller (ข้อที่ 3: Update Employee)
 * ==============================================================================================
 * 
 * Endpoint: PUT /api/<STUDENT_ID>/employees/:employeeNumber
 * - แก้ไขข้อมูลพนักงานตาม employeeNumber
 * - เมื่อสำเร็จ ตอบกลับด้วย HTTP 200 OK พร้อมข้อมูลพนักงานที่แก้ไขแล้ว
 * - จัดการ Exception: 404 (ไม่พบพนักงาน), 400 (อีเมลผิด), 400 (Foreign Key ไม่ถูกต้อง)
 * ==============================================================================================
 */

import express from 'express';
import * as employeeService from '../services/employee-service.js';

const router = express.Router();

router.put('/:employeeNumber', async (req, res, next) => {
  try {
    const { employeeNumber } = req.params;
    const updated = await employeeService.updateEmployee(employeeNumber, req.body);
    res.status(200).json({
      status: 'success',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
