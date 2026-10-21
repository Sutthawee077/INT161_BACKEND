/**
 * ==============================================================================================
 * 📁 File: Practice2/src/app.js
 * 🏷️ Layer: Application Entry Point (จุดเริ่มต้นของระบบ Express)
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * 1. กำหนดค่าเริ่มต้นของ Express Server
 * 2. ลงทะเบียน Middleware สำหรับแปลง Request Body เป็น JSON (express.json())
 * 3. Mount เส้นทาง API ทุกเส้นทางโดยมี Prefix เป็นรหัสนักศึกษา (Static Student ID Path)
 * 4. ให้บริการ Endpoint ตรวจสอบข้อมูลนักศึกษา (GET /api/<STUDENT_ID>/student-info)
 * 5. เชื่อมต่อ Centralized Error Handler ไว้บรรทัดสุดท้าย เพื่อดักจับ Error จากทุก Controller
 * ==============================================================================================
 */

import express from 'express';
import officeRouter from './routes/office-route.js';
import productlineRouter from './routes/productline-route.js';
import employeeRouter from './routes/employee-route.js';
import customerRouter from './routes/customer-route.js';
import { AppError, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ----------------------------------------------------------------------------------------------
// Middleware แปลง Body ที่ส่งเข้ามาให้เป็น JSON Object (req.body)
// ----------------------------------------------------------------------------------------------
app.use(express.json());

// ----------------------------------------------------------------------------------------------
// รหัสนักศึกษาประจำตัว: ใช้เป็น Static Prefix ตามข้อกำหนดของอาจารย์ผู้สอน
// 💡 ข้อห้าม: ห้ามใช้ Route Param เช่น /api/:studentId/... เด็ดขาด ให้ใช้ค่าตัวแปรคงที่แบบนี้
// ----------------------------------------------------------------------------------------------
const STUDENT_ID = '68130500077';

// ----------------------------------------------------------------------------------------------
// ลงทะเบียนเส้นทาง API (Mount Routes) แยกตามแต่ละ Resource
// ----------------------------------------------------------------------------------------------
// ข้อที่ 1: จัดการข้อมูลสำนักงาน (Offices) -> GET /api/<STUDENT_ID>/offices/:officeCode
app.use(`/api/${STUDENT_ID}/offices`, officeRouter);

// ข้อที่ 2: จัดการหมวดหมู่สินค้า (Product Lines) -> POST /api/<STUDENT_ID>/productlines
app.use(`/api/${STUDENT_ID}/productlines`, productlineRouter);

// ข้อที่ 3: จัดการข้อมูลพนักงาน (Employees) -> PUT /api/<STUDENT_ID>/employees/:employeeNumber
app.use(`/api/${STUDENT_ID}/employees`, employeeRouter);

// ข้อที่ 4 & 5: จัดการลูกค้าและการชำระเงิน (Customers & Payments)
// - DELETE /api/<STUDENT_ID>/customers/:customerNumber
// - POST /api/<STUDENT_ID>/customers/:customerNumber/payments
app.use(`/api/${STUDENT_ID}/customers`, customerRouter);

// ----------------------------------------------------------------------------------------------
// Endpoint สำหรับตรวจสอบตัวตนนักศึกษา (Identity Verification Endpoint)
// URL: GET /api/68130500077/student-info
// ----------------------------------------------------------------------------------------------
app.get(`/api/${STUDENT_ID}/student-info`, (req, res) => {
  res.json({
    status: 'success',
    data: {
      studentId: STUDENT_ID,
      name: 'Sutthawee Chanparmookkun',
      secretkey: 'Dear'
    }
  });
});

// ----------------------------------------------------------------------------------------------
// Centralized Error Handling Middleware
// ⚠️ สำคัญมาก: ต้องอยู่บรรทัดสุดท้ายของทุก Routes เสมอ เพื่อดักจับ Error ที่ส่งมาทาง next(err)
// ----------------------------------------------------------------------------------------------
app.use(errorHandler);

// ----------------------------------------------------------------------------------------------
// เริ่มต้นการทำงานของเซิร์ฟเวอร์ (Listen Port)
// ----------------------------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [Practice 2 Server] กำลังทำงานที่พอร์ต ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api/${STUDENT_ID}`);
});

export default app;
