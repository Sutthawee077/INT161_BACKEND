# 🏆 คัมภีร์พิชิตข้อสอบปฏิบัติ Backend REST API (INT161)
> ครอบคลุมข้อสอบจริงของวิชา INT161 ทั้ง 2 รูปแบบ พร้อม Code Templates, Cheat Sheet, และ Checklist เก็บ 100 คะแนนเต็ม

---

## 🧭 สารบัญและการเลือกใช้ Template ตามโจทย์ที่เจอ

เมื่อเข้าห้องสอบและเปิดดูโจทย์ ให้สังเกตทันทีว่าโจทย์มาในรูปแบบไหน:

| สัญญาณในโจทย์ | รูปแบบข้อสอบ | โฟลเดอร์ Template ที่ต้องใช้ |
|---|---|---|
| • URL มีรหัสนักศึกษา เช่น `/api/67130500001/...`<br>• มีข้อ `GET /student-info` แสดงชื่อและ Secret Key<br>• มีระบบ **Pagination** (Summary DTO / Detail DTO)<br>• ตรวจด้วย `node tests/test-runner.mjs` | **รูปแบบที่ 1 (Official Lab Exam)** | ใช้โฟลเดอร์:<br>[`templates/style-a-student-id-exam/`](file:///c:/Users/LT-X13i03/Documents/INT161%20Backend/int261-sample-exam/templates/style-a-student-id-exam/) |
| • URL เป็น Versioning ปกติ เช่น `/api/v1/products`<br>• ตรวจ Strict Types (`400 INVALID_REQUEST`, `400 VALIDATION_ERROR`)<br>• ตรวจ Transport Negotiation (`415`, `406`, `405`)<br>• ตรวจด้วย `python test_api.py` | **รูปแบบที่ 2 (Standard REST Exam)** | ใช้ Root Codebase ปัจจุบัน:<br>[`src/`](file:///c:/Users/LT-X13i03/Documents/INT161%20Backend/int261-sample-exam/src/) (ผ่าน 62/62 ข้อ 100%) |

---

# 🔴 รูปแบบที่ 1: Official Lab Exam (Static Student ID & Pagination)

### 📌 1.1 โครงสร้าง URL และ Base Path
* **กฎเหล็ก:** ต้อง Hardcode รหัสนักศึกษาลงใน Route โดยตรง ห้ามใช้ Route Param `:studentId`
  ```javascript
  // src/app.js
  const STUDENT_ID = '68130500077'; // ใส่รหัสนักศึกษาของตัวเอง
  app.use(`/api/${STUDENT_ID}/brands`, brandRouter);
  app.use(`/api/${STUDENT_ID}/products`, productRouter);
  ```

### 📌 1.2 Endpoint ระบุตัวตน (10 คะแนนฟรี)
```javascript
// GET /api/<STUDENT_ID>/student-info
router.get('/student-info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      studentId: "68130500077",
      name: "Your Full Name",
      secretKey: "YourSecretKey" // ดูในใบข้อสอบ
    },
    timestamp: new Date().toISOString()
  });
});
```

### 📌 1.3 Pagination Middleware & SQL
```javascript
// src/middlewares/pagination-middleware.js
export const queryParser = () => (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  req.pagination = { page, limit, offset };
  next();
};
```

**ใน Repository:**
```javascript
export async function findAll(pagination = null) {
  if (!pagination) {
    const [rows] = await db.query('SELECT * FROM products');
    return rows;
  }
  const { limit, offset } = pagination;
  const [rows] = await db.query('SELECT * FROM products LIMIT ? OFFSET ?', [limit, offset]);
  return rows;
}

export async function count() {
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM products');
  return total;
}
```

### 📌 1.4 การแปลง DTO (Summary DTO vs Detail DTO)
* **Summary DTO (สำหรับ List/Pagination):** ส่งเฉพาะฟิลด์สรุป ไม่ส่งฟิลด์ยาวๆ
  ```javascript
  export function toSummaryDto(row) {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      brandId: row.brand_id,
      category: row.category,
      price: Number(row.price),
      status: row.status
    };
  }
  ```
* **Detail DTO (สำหรับ GET by ID):** ส่งรายละเอียดครบถ้วน
  ```javascript
  export function toDetailDto(row) {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      category: row.category,
      price: Number(row.price),
      ramGb: row.ram_gb,
      storageGb: row.storage_gb,
      color: row.color,
      stockQuantity: row.stock_quantity,
      status: row.status,
      releaseDate: row.release_date
    };
  }
  ```

---

# 🔵 รูปแบบที่ 2: Standard REST API (Strict Validation & Error Schema)

### 📌 2.1 Centralized Error Handling & MySQL Error Mapping
```javascript
// src/middlewares/error-handler.js
export const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An error occurred';

  // แปลง MySQL Error Codes อัตโนมัติ
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    status = 409;
    code = 'DUPLICATE_KEY'; // หรือ DUPLICATE_SKU
    message = 'Resource already exists (Duplicate key violation)';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    status = 400; // หรือ 404 ตามโจทย์
    code = 'FOREIGN_KEY_NOT_FOUND';
    message = 'Referenced foreign key record does not exist';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    status = 409;
    code = 'RESOURCE_IN_USE';
    message = 'Cannot delete or modify resource because related records exist';
  }

  res.status(status).json({
    status,
    code,
    message,
    path: req.originalUrl ? req.originalUrl.split('?')[0] : '',
    fieldErrors: Array.isArray(err.fieldErrors) ? err.fieldErrors : []
  });
};
```

### 📌 2.2 การดักจับประเภทข้อมูลแบบ Strict (จุดตัดเกรด)
* **ดักจับ integer ที่ส่งทศนิยมมา เช่น `stock: 1.0`:**
  ```javascript
  // ตรวจจับจาก Raw JSON Text ก่อนที่จะถูก JSON.parse แปลงเป็น 1
  if (/"stock"\s*:\s*\d+\.\d+/.test(req.rawBody)) {
    return res.status(400).json({ status: 400, code: 'INVALID_REQUEST', message: 'stock must not have decimals' });
  }
  ```
* **ดักจับ Unknown Fields (ห้ามส่งฟิลด์ที่ไม่ได้ระบุ):**
  ```javascript
  const ALLOWED = new Set(['sku', 'name', 'brandId', 'price', 'stock', 'ramGb', 'storageGb', 'color', 'description', 'active']);
  for (const key of Object.keys(req.body)) {
    if (!ALLOWED.has(key)) {
      return res.status(400).json({ status: 400, code: 'INVALID_REQUEST', message: `Unknown field: ${key}` });
    }
  }
  ```
* **ดักจับ Path ID ปลอม (เช่น `0`, `-1`, `abc`, `1.0`, `overflow`):**
  ```javascript
  if (!/^\d+$/.test(rawId)) throw new AppError('Invalid ID', 400, 'INVALID_REQUEST');
  const big = BigInt(rawId);
  if (big <= 0n || big > 9223372036854775807n) throw new AppError('ID out of range', 400, 'INVALID_REQUEST');
  ```

---

## ⚡ สรุปคำสั่งที่ต้องใช้ในห้องสอบ

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
2. **รันเซิร์ฟเวอร์:**
   ```bash
   npm start
   ```
3. **รันเทสต์ตรวจสอบความถูกต้อง:**
   - สำหรับโจทย์รูปแบบที่ 1: `node tests/test-runner.mjs <STUDENT_ID>`
   - สำหรับโจทย์รูปแบบที่ 2: `python test_api.py --details`
