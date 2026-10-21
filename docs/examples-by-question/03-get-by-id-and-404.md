# ข้อที่ 3: [GET by ID & Detail DTO] ดึงข้อมูลรายตัว และการจัดการ 404 Not Found

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

* **โจทย์:** ให้สร้าง Endpoint สำหรับอ่านข้อมูลสินค้ารายตัวตาม ID พร้อมดึงชื่อแบรนด์ (`brandName`)
* **Method & URI:** `GET /api/<STUDENT_ID>/products/:id`
* **เงื่อนไข:**
  1. ตรวจสอบรหัส `:id` ว่าเป็นตัวเลขจำนวนเต็มบวกที่ถูกต้องหรือไม่
  2. เชื่อมโยง (JOIN) กับตาราง `brands` เพื่อเอา `brand.name` มาใส่ในฟิลด์ `brandName`
  3. **เมื่อพบสินค้า:** ส่ง `HTTP 200 OK` พร้อมข้อมูลในรูปแบบ **Detail DTO**
  4. **เมื่อไม่พบสินค้า (ID ไม่มีอยู่จริง):**
     - 🚫 **ห้าม** ตอบกลับด้วย `{}` ว่างๆ หรือ `null`
     - ให้โยน Error ไปที่ Centralized Error Handler และตอบกลับด้วย **`HTTP 404 Not Found`**

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer

### 2.1 Layer Repository (`src/repositories/product-repo.js`)
ใช้คำสั่ง SQL `LEFT JOIN` เพื่อดึงข้อมูลสินค้าพร้อมชื่อแบรนด์:

```javascript
import db from '../configs/db-config.js';

/**
 * ค้นหาสินค้าตาม ID พร้อมดึงชื่อแบรนด์
 * @param {number} id 
 * @returns {Promise<object|null>} คืนข้อมูลสินค้า หรือ null ถ้าหาไม่พบ
 */
export async function findByIdWithBrand(id) {
  const SQL = `
    SELECT p.id, p.sku, p.name, p.brand_id, b.name AS brand_name,
           p.category, p.price, p.ram_gb, p.storage_gb, p.color,
           p.stock_quantity, p.status, p.release_date
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = ?
  `;
  const [rows] = await db.query(SQL, [id]);
  if (rows.length === 0) return null;
  return rows[0];
}
```

---

### 2.2 Layer Service (`src/services/product-service.js`)
ตรวจสอบผลลัพธ์จาก Repository หากเป็น `null` ให้โยน `AppError` สถานะ 404:

```javascript
import * as productRepo from '../repositories/product-repo.js';

export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export async function getProductDetail(rawId) {
  // 1. ตรวจสอบรูปแบบ ID ว่าเป็นตัวเลขบวกที่ถูกต้องหรือไม่
  if (!/^\d+$/.test(rawId) || Number(rawId) <= 0) {
    throw new AppError('Invalid product ID format', 400, 'INVALID_REQUEST');
  }

  const id = Number(rawId);

  // 2. ค้นหาข้อมูลจาก Repository
  const row = await productRepo.findByIdWithBrand(id);

  // 3. ถ้าไม่พบ ให้โยน 404 NOT_FOUND
  if (!row) {
    throw new AppError(`Product with ID '${id}' was not found`, 404, 'PRODUCT_NOT_FOUND');
  }

  // 4. แปลงข้อมูลเป็น Detail DTO
  return {
    id: Number(row.id),
    sku: row.sku,
    name: row.name,
    brandId: Number(row.brand_id),
    brandName: row.brand_name || null,
    category: row.category,
    price: Number(row.price),
    ramGb: Number(row.ram_gb),
    storageGb: Number(row.storage_gb),
    color: row.color,
    stockQuantity: Number(row.stock_quantity),
    status: row.status,
    releaseDate: row.release_date ? row.release_date.toISOString().split('T')[0] : null
  };
}
```

---

### 2.3 Layer Route (`src/routes/product-route.js`)
```javascript
import express from 'express';
import * as productService from '../services/product-service.js';

const router = express.Router();

// GET /api/<STUDENT_ID>/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductDetail(req.params.id);
    res.status(200).json({
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err); // ส่งต่อไปยัง Error Handling Middleware กลาง
  }
});

export default router;
```

---

## 🔍 3. อธิบายการทำงานของโค้ดอย่างละเอียด (Explanation)

1. **`if (!row) throw new AppError(..., 404, 'PRODUCT_NOT_FOUND')`**:
   - เมื่อ `db.query` ไม่พบข้อมูล มันจะคืน Array ว่าง `[]`
   - ใน Repository เมื่อ `rows.length === 0` เราจะคืน `null`
   - และใน Service เมื่อพบว่าเป็น `null` เราจะสั่ง `throw new AppError(...)` ทันที ทำให้ Flow กระโดดไปที่บล็อก `catch (err)` และส่งเข้า `next(err)` ของ Express
2. **`LEFT JOIN brands b ON p.brand_id = b.id`**:
   - เชื่อมตาราง `products` กับ `brands` โดยอ้างอิง `brand_id` เพื่อดึงชื่อแบรนด์ (`b.name AS brand_name`) ออกมาใน Query เดียว ไม่ต้องทำ Query ซ้ำสองรอบ
3. **การจัด Format วันที่ `release_date.toISOString().split('T')[0]`**:
   - ใน MySQL คอลัมน์ `DATE` ไดรเวอร์ `mysql2` จะส่งกลับมาเป็น JS Date Object
   - การทำ `.toISOString().split('T')[0]` จะตัดเวลาทิ้ง ให้เหลือเฉพาะฟอร์แมต `YYYY-MM-DD` ตามที่โจทย์ระบุ

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1:** เมื่อหาไม่พบ ดันตอบกลับด้วย `res.json(null)` หรือ `res.json({})` พร้อม HTTP 200 $\rightarrow$ **ผิดหลัก RESTful ทันที** ข้อสอบจะให้ 0 คะแนนในเทสต์นี้ ต้องตอบ 404 เท่านั้น!
* ❌ **กับดักที่ 2:** ส่ง ID แปลกๆ มา เช่น `/products/abc` หรือ `/products/0` แล้วปล่อยให้ SQL พังจนกลายเป็น 500 $\rightarrow$ ต้องตรวจสอบตั้งแต่ Service ให้ตอบกลับเป็น `400 Bad Request`
