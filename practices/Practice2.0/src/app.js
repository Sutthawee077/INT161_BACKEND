/**
 * ==============================================================================================
 * 📁 File: Practice2.0/src/app.js
 * 🏷️ Layer: Application Entry Point & Pagination Demo
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * 1. กำหนดค่า Express Server สำหรับแบบฝึกหัด Practice 2.0
 * 2. สาธิต Endpoint การแบ่งหน้า Pagination: `GET /test-pagination?page=1&limit=5`
 * 3. Mount เส้นทาง API ข้อมูลสำนักงาน: `GET /api/<STUDENT_ID>/offices/:officeCode`
 * 4. เชื่อมต่อ Centralized Error Handler (errorHandler)
 * ==============================================================================================
 */

import express from 'express';
import officeRouter from './routes/office-route.js';
import * as productRepo from './repositories/product-repo.js';
import { AppError, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

// ----------------------------------------------------------------------------------------------
// 📌 Endpoint ทดสอบการแบ่งหน้า (Pagination Test Endpoint)
// URL: GET /test-pagination?page=1&limit=5
// ----------------------------------------------------------------------------------------------
app.get('/test-pagination', async (req, res, next) => {
  try {
    // 1. ดึงค่า page: ค่าเริ่มต้นคือ 1 และต้องไม่น้อยกว่า 1
    const page = Math.max(1, parseInt(req.query.page) || 1);

    // 2. ดึงค่า limit: รองรับทั้งชื่อ ?limit หรือ ?pageSize ค่าเริ่มต้นคือ 5
    const limit = Math.max(1, parseInt(req.query.limit || req.query.pageSize) || 5);

    // 3. คำนวณ offset สำหรับคำสั่ง SQL: (page - 1) * limit
    // ตัวอย่าง: page 1 -> offset 0 | page 2 -> offset 5 | page 3 -> offset 10
    const offset = (page - 1) * limit;
    const pagination = { page, limit, offset };

    // 4. ดึงข้อมูลจากฐานข้อมูลผ่าน Repository
    const rows = await productRepo.findAll({ limit, offset });

    // 5. ส่งผลลัพธ์กลับพร้อม Metadata การแบ่งหน้า
    res.status(200).json({
      status: 'success',
      page,
      limit,
      offset,
      pagination,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------------------------
// Mount เส้นทางของ Office API โดยใช้รหัสนักศึกษาเป็น Prefix
// ----------------------------------------------------------------------------------------------
const STUDENT_ID = '68130500077';
app.use(`/api/${STUDENT_ID}/offices`, officeRouter);

// ----------------------------------------------------------------------------------------------
// Centralized Error Handler (ต้องอยู่ท้ายสุดเสมอ)
// ----------------------------------------------------------------------------------------------
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [Practice 2.0 Server] กำลังทำงานที่พอร์ต ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api/${STUDENT_ID}`);
});

export default app;
