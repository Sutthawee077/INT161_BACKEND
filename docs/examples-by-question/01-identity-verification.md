# ข้อที่ 1: [Setup & Identity] การตั้งค่า Base URL ด้วยรหัสนักศึกษา และ Endpoint ตรวจสอบตัวตน

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

ในข้อสอบ INT161 อาจารย์มักจะมีข้อบังคับเรื่อง **Student Identity** (มีคะแนนฟรี 10 คะแนน):
1. **Base URL ต้องมีรหัสนักศึกษาแบบ Static**: เช่น `/api/68130500077/...` 
   - 🚫 **ข้อห้ามเด็ดขาด**: ห้ามใช้ dynamic parameter เช่น `/api/:studentId/...` หรือ `req.params.studentId`
2. **Endpoint ตรวจสอบตัวตน**: 
   - `GET /api/<STUDENT_ID>/student-info`
   - ต้องตอบกลับ `HTTP 200 OK`
   - คืน JSON ข้อมูลรหัสนักศึกษา, ชื่อ-นามสกุล, และ Secret Key (ที่อาจารย์แจกในใบข้อสอบ) พร้อม ISO Timestamp

---

## 💻 2. โค้ดฉบับสมบูรณ์ (Full Code)

### ไฟล์ `src/app.js` (การ Mount Router ด้วย Static Student ID)
```javascript
import express from 'express';
import studentRouter from './routes/student-route.js';
import productRouter from './routes/product-route.js';
import brandRouter from './routes/brand-route.js';
import errorHandler from './middlewares/error-handler.js';

const app = express();
app.use(express.json());

// ⚠️ กำหนดรหัสนักศึกษาของคุณตรงนี้
const STUDENT_ID = '68130500077';

// Mount เส้นทางโดยนำรหัสนักศึกษามาทำเป็น Prefix
app.use(`/api/${STUDENT_ID}`, studentRouter);
app.use(`/api/${STUDENT_ID}/products`, productRouter);
app.use(`/api/${STUDENT_ID}/brands`, brandRouter);

// Global Error Handler วางไว้ล่างสุดเสมอ
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/api/${STUDENT_ID}`);
});

export default app;
```

---

### ไฟล์ `src/routes/student-route.js` (Route คืนข้อมูลนักศึกษา)
```javascript
import express from 'express';

const router = express.Router();

// GET /api/<STUDENT_ID>/student-info
router.get('/student-info', (req, res) => {
  // ข้อมูลที่อาจารย์ระบุในหัวกระดาษข้อสอบ
  const studentData = {
    studentId: '68130500077',
    name: 'Your Name Lastname',
    secretKey: '68YoLa' // ดู Secret Key จากใบสอบของตัวเอง
  };

  res.status(200).json({
    success: true,
    data: studentData,
    timestamp: new Date().toISOString()
  });
});

export default router;
```

---

## 🔍 3. อธิบายการทำงานของโค้ดอย่างละเอียด (Explanation)

1. **`const STUDENT_ID = '68130500077';`**:
   - การประกาศตัวแปรไว้ด้านบนของ `app.js` ช่วยให้เมื่อเปิดโปรเจกต์ใหม่ แค่เปลี่ยนค่าตัวแปรนี้จุดเดียว ทุก Routing ในโปรเจกต์จะเปลี่ยนตามทันที
2. **`app.use('/api/${STUDENT_ID}', studentRouter);`**:
   - เมื่อ Route ภายในไฟล์ `student-route.js` คือ `/student-info` เมื่อถูกรวมกับ Prefix ด้านบน Path เต็มๆ จะกลายเป็น:
     `GET /api/68130500077/student-info` พอดี
3. **`new Date().toISOString()`**:
   - คืนค่าเวลาในรูปแบบมาตรฐาน ISO 8601 สากล (เช่น `2026-10-21T13:30:00.000Z`) ซึ่งเป็นฟอร์แมตที่ระบบตรวจข้อสอบอัตโนมัติต้องการ

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1:** ไปเขียน `app.get('/api/:studentId/student-info', ...)` $\rightarrow$ **โดนหักคะแนนทันที** เพราะระบบตรวจจะเช็กจาก Static string
* ❌ **กับดักที่ 2:** พิมพ์ Secret Key ผิดแม้แต่ตัวพิมพ์เล็ก/ใหญ่ $\rightarrow$ ระบบ Autograder มักจะตรวจแบบ Case-Sensitive ถ้าไม่ตรงจะไม่ได้คะแนนส่วนนี้ (10 คะแนน)
