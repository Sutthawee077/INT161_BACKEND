/**
 * ==============================================================================================
 * 📁 File: Practice2/src/routes/customer-route.js
 * 🏷️ Layer: Route / Controller (ข้อที่ 4 & 5: Customer Delete & Payment Create)
 * ==============================================================================================
 * 
 * เส้นทางที่ให้บริการ:
 * 1. DELETE /api/<STUDENT_ID>/customers/:customerNumber (ข้อที่ 4)
 *    - เมื่อลบสำเร็จ ตอบ HTTP 200 OK พร้อมข้อความยืนยัน
 *    - หากไม่พบลูกค้า ตอบ 404
 *    - หากมี Order ค้างอยู่ ติด Foreign Key Restrict ตอบ 409 Conflict
 * 
 * 2. POST /api/<STUDENT_ID>/customers/:customerNumber/payments (ข้อที่ 5)
 *    - เมื่อสร้างสำเร็จ ตอบ HTTP 201 Created พร้อมข้อมูลการชำระเงิน
 *    - หากยอดเงินหรือวันที่ไม่ถูกต้อง ตอบ 400
 *    - หาก Composite Key (เช็คซ้ำ) ตอบ 409 Conflict
 * ==============================================================================================
 */

import express from 'express';
import * as customerService from '../services/customer-service.js';

const router = express.Router();

// ------------------------------------------------------------------------------
// ข้อที่ 4: ลบข้อมูลลูกค้า
// ------------------------------------------------------------------------------
router.delete('/:customerNumber', async (req, res, next) => {
  try {
    const { customerNumber } = req.params;
    const result = await customerService.deleteCustomer(customerNumber);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------------------
// ข้อที่ 5: บันทึกข้อมูลการชำระเงินของลูกค้า
// ------------------------------------------------------------------------------
router.post('/:customerNumber/payments', async (req, res, next) => {
  try {
    const { customerNumber } = req.params;
    const created = await customerService.createPayment(customerNumber, req.body);
    res.status(201).json({
      status: 'success',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

export default router;
