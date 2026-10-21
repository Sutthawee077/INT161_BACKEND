# ข้อที่ 2: [GET with Pagination & Summary DTO] ดึงรายการข้อมูลแบบแบ่งหน้า พร้อมแปลง DTO

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

* **โจทย์:** ให้สร้าง Endpoint ดึงรายการสินค้าทั้งหมดแบบแบ่งหน้า (Pagination)
* **Method & URI:** `GET /api/<STUDENT_ID>/products?page=1&limit=10`
* **เงื่อนไข:**
  1. รับ Query parameters:
     - `page`: หน้าที่ต้องการ (ค่าเริ่มต้นคือ `1`)
     - `limit`: จำนวนรายการต่อหน้า (ค่าเริ่มต้นคือ `10`, สูงสุดไม่เกิน `100`)
  2. คำนวณ Metadata ของ Pagination:
     - `total`: จำนวนรายการทั้งหมดในฐานข้อมูล
     - `totalPages`: จำนวนหน้าทั้งหมด (`Math.ceil(total / limit)`)
     - `hasNextPage`: มีหน้าถัดไปหรือไม่ (`page * limit < total`)
     - `hasPrevPage`: มีหน้าก่อนหน้าหรือไม่ (`page > 1`)
  3. **การแปลง Summary DTO:** ข้อมูลสินค้าในอาร์เรย์ `data` ต้องแสดงเฉพาะฟิลด์สรุป:
     - `id`, `sku`, `name`, `brandId`, `category`, `price`, `status`
     - *(ไม่ส่งฟิลด์ยาวๆ เช่น description, ramGb, storageGb, color เพื่อประหยัด Bandwidth)*

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer (3-Layer Architecture)

### 2.1 Layer Repository (`src/repositories/product-repo.js`)
ทำหน้าที่ติดต่อกับ MySQL ส่งคำสั่ง SQL `COUNT(*)` และ `LIMIT ? OFFSET ?`:

```javascript
import db from '../configs/db-config.js';

/**
 * นับจำนวนสินค้าทั้งหมดในตาราง
 * @returns {Promise<number>}
 */
export async function countAll() {
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM products');
  return total;
}

/**
 * ดึงรายการสินค้าแบบแบ่งหน้า
 * @param {number} limit 
 * @param {number} offset 
 * @returns {Promise<Array>}
 */
export async function findAllPaginated(limit, offset) {
  const SQL = `
    SELECT id, sku, name, brand_id, category, price, status
    FROM products
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(SQL, [limit, offset]);
  return rows;
}
```

---

### 2.2 Layer Service (`src/services/product-service.js`)
ทำหน้าที่คำนวณ Business Logic (Offset, Total Pages) และแปลงข้อมูลเป็น Summary DTO:

```javascript
import * as productRepo from '../repositories/product-repo.js';

export async function getProductsWithPagination(pageParam, limitParam) {
  // 1. ตรวจสอบและแปลงค่า Page และ Limit (ป้องกันค่าติดลบหรือค่าแปลกปลอม)
  const page = Math.max(1, parseInt(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam) || 10));
  const offset = (page - 1) * limit;

  // 2. ดึงข้อมูลจริง และนับจำนวนทั้งหมดพร้อมกัน
  const [total, rows] = await Promise.all([
    productRepo.countAll(),
    productRepo.findAllPaginated(limit, offset)
  ]);

  // 3. แปลงข้อมูล Database Row ให้เป็น Summary DTO
  const summaryList = rows.map(row => ({
    id: Number(row.id),
    sku: row.sku,
    name: row.name,
    brandId: Number(row.brand_id),
    category: row.category,
    price: Number(row.price),
    status: row.status
  }));

  // 4. คำนวณ Pagination Metadata
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  };

  return { data: summaryList, pagination };
}
```

---

### 2.3 Layer Route (`src/routes/product-route.js`)
ทำหน้าที่รับ Request จาก Client และส่ง Response:

```javascript
import express from 'express';
import * as productService from '../services/product-service.js';

const router = express.Router();

// GET /api/<STUDENT_ID>/products?page=1&limit=10
router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await productService.getProductsWithPagination(page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

## 🔍 3. อธิบายการทำงานของโค้ดอย่างละเอียด (Explanation)

1. **`Math.max(1, parseInt(pageParam) || 1)`**:
   - ถ้า Client ส่ง `page=0` หรือ `page=-5` หรือไม่ส่งมา `Math.max(1, ...)` จะบังคับให้หน้าเริ่มต้นเป็น `1` เสมอ เพื่อไม่ให้เกิด Error ใน SQL
2. **`const offset = (page - 1) * limit;`**:
   - สูตรคำนวณการข้ามแถว:
     - หน้าที่ 1: `(1 - 1) * 10 = 0` (เริ่มที่แถวแรก)
     - หน้าที่ 2: `(2 - 1) * 10 = 10` (ข้าม 10 แถวแรกไป)
3. **`Promise.all([...])`**:
   - ช่วยให้คำสั่ง `SELECT COUNT(*)` และ `SELECT ... LIMIT ...` ทำงานไปพร้อมกันแบบ Concurrency ทำให้ระบบตอบสนองได้เร็วขึ้น
4. **`Number(row.price)`**:
   - ใน MySQL คอลัมน์ชนิด `DECIMAL(10,2)` ไดรเวอร์ `mysql2` อาจคืนค่าออกมาเป็น String (เช่น `"48900.00"`) การครอบ `Number(...)` จะช่วยแปลงเป็นตัวเลข JSON number ตามที่โจทย์ต้องการเสมอ

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1:** ส่งฟิลด์เกินใน Summary DTO (เช่น ส่ง `description` หรือ `color` ไปด้วย) $\rightarrow$ ระบบตรวจ DTO จะจับได้ว่ามีคีย์เกิน
* ❌ **กับดักที่ 2:** คำนวณ `hasNextPage` ผิด เช่น ไปเขียน `page < totalPages` ซึ่งถ้าข้อมูลมี 0 แถว หรือหน้าสุดท้าย อาจคำนวณพลาด สูตรที่ชัวร์ที่สุดคือ: `page * limit < total`
* ❌ **กับดักที่ 3:** ลืมส่ง Pagination Object ในกรณีที่ผลลัพธ์เป็น Array เปล่า `[]`
