# ข้อที่ 5: [PUT Full Update & Idempotence] การแทนที่ข้อมูลเดิมทุกฟิลด์ และความเป็น Idempotent

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

* **โจทย์:** ให้สร้าง Endpoint สำหรับแก้ไขข้อมูลสินค้าเดิมที่มีอยู่แบบแทนที่ทุกฟิลด์ (Full Replacement)
* **Method & URI:** `PUT /api/<STUDENT_ID>/products/:id`
* **เงื่อนไข:**
  1. **ลำดับการตรวจสอบ (Order of Checks):**
     - ตรวจสอบว่าสินค้า `:id` มีอยู่จริงไหม? ถ้าไม่พบ $\rightarrow$ **`404 PRODUCT_NOT_FOUND`**
     - ตรวจสอบว่า `brandId` ใหม่มีอยู่จริงไหม? ถ้าไม่พบ $\rightarrow$ **`404 BRAND_NOT_FOUND`**
     - ตรวจสอบความซ้ำของ SKU:
       - ถ้าส่ง SKU เดิมของสินค้านั้นเอง $\rightarrow$ **อนุญาตให้ผ่าน**
       - ถ้าส่ง SKU ที่ไปซ้ำกับสินค้า **ชิ้นอื่น** ในระบบ $\rightarrow$ **`409 DUPLICATE_SKU`**
  2. **Full Replacement Principle:**
     - ข้อมูลทุกฟิลด์ที่ส่งมาจะถูกแทนที่ทับของเดิม
     - หากฟิลด์เสริม (เช่น `description`) ไม่ได้ถูกส่งมาใน PUT body $\rightarrow$ **ต้องถูกเซ็ตเป็น `null` ทันที** (ห้ามคงค่าเดิมไว้ เพราะ PUT ไม่ใช่ PATCH)
  3. **Idempotence (การเรียกซ้ำได้ผลลัพธ์เดิม):**
     - การยิง PUT ซ้ำด้วย Body เดิมหลายครั้ง สถานะของระบบต้องไม่เปลี่ยน และจำนวนแถวในฐานข้อมูลต้องเท่าเดิม

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer

### 2.1 Layer Repository (`src/repositories/product-repo.js`)
```javascript
import db from '../configs/db-config.js';

export async function findById(id) {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function findBySku(sku) {
  const [rows] = await db.query('SELECT * FROM products WHERE sku = ?', [sku]);
  return rows.length > 0 ? rows[0] : null;
}

export async function updateProduct(id, data) {
  const SQL = `
    UPDATE products
    SET sku = ?, name = ?, brand_id = ?, price = ?, stock = ?,
        ram_gb = ?, storage_gb = ?, color = ?, description = ?, active = ?
    WHERE id = ?
  `;
  await db.query(SQL, [
    data.sku,
    data.name,
    data.brandId,
    data.price,
    data.stock,
    data.ramGb || null,
    data.storageGb || null,
    data.color,
    data.description !== undefined ? data.description : null, // ถ้าไม่ส่งมาให้เป็น null
    data.active ? 1 : 0,
    id
  ]);

  return findById(id);
}
```

---

### 2.2 Layer Service (`src/services/product-service.js`)
```javascript
import * as productRepo from '../repositories/product-repo.js';
import * as brandRepo from '../repositories/brand-repo.js';

export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export async function updateExistingProduct(id, body) {
  // 1. ตรวจสอบว่าสินค้าเดิมมีอยู่จริงหรือไม่
  const existing = await productRepo.findById(id);
  if (!existing) {
    throw new AppError(`Product with ID '${id}' was not found`, 404, 'PRODUCT_NOT_FOUND');
  }

  // 2. ตรวจสอบว่า Brand ใหม่มีอยู่จริงหรือไม่
  const brandExists = await brandRepo.existsById(body.brandId);
  if (!brandExists) {
    throw new AppError(`Brand with ID '${body.brandId}' does not exist`, 404, 'BRAND_NOT_FOUND');
  }

  // 3. ตรวจสอบ SKU ซ้ำ (ระวังจุดดักคะแนน: ถ้าเป็น SKU ของตัวเองต้องยอมให้ผ่าน!)
  const sku = String(body.sku).trim();
  if (existing.sku !== sku) {
    const duplicate = await productRepo.findBySku(sku);
    if (duplicate) {
      throw new AppError(`SKU '${sku}' is already in use by another product`, 409, 'DUPLICATE_SKU');
    }
  }

  // 4. บันทึกแทนที่ข้อมูลเดิม
  const updated = await productRepo.updateProduct(id, {
    ...body,
    sku,
    name: String(body.name).trim(),
    color: String(body.color).trim(),
    description: body.description !== undefined ? body.description : null
  });

  return updated;
}
```

---

### 2.3 Layer Route (`src/routes/product-route.js`)
```javascript
import express from 'express';
import * as productService from '../services/product-service.js';

const router = express.Router();

// PUT /api/<STUDENT_ID>/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid ID' });
    }

    const updated = await productService.updateExistingProduct(id, req.body);
    res.status(200).json({
      success: true,
      data: updated,
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

1. **`if (existing.sku !== sku)`**:
   - ถ้า Client ส่งข้อมูลมาอัปเดต โดยฟิลด์ `sku` ยังคงเป็นค่าเดิมของสินค้าตัวนี้ โค้ดจะไม่เข้าไปตรวจเช็กความซ้ำ ทำให้ผ่านฉลุย
   - แต่ถ้า Client เปลี่ยน `sku` เป็นค่าใหม่ โค้ดจะนำค่าใหม่ไปเช็กในฐานข้อมูลว่าไปชนกับสินค้า ID อื่นหรือไม่
2. **`description: body.description !== undefined ? body.description : null`**:
   - ความแตกต่างสำคัญระหว่าง **PUT (Full Replace)** กับ **PATCH (Partial Update)**:
     - ใน PUT ถ้า Client ส่ง Body ที่ตัดฟิลด์ `description` ทิ้งไป ค่าในฐานข้อมูลจะต้องกลายเป็น `NULL`
     - โค้ดนี้เช็กว่าถ้าไม่มีคีย์ `description` ส่งมา ให้ปรับค่าเป็น `null` ทันที

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1: ตรวจ SKU ซ้ำแบบลืมดูตัวเอง**
  - ข้อสอบจะมีเทสต์ที่ส่ง PUT อัปเดตราคาหรือชื่อสินค้า แต่ส่ง **SKU เดิม** มาด้วย
  - ถ้าเขียนแค่ `if (findBySku(sku)) throw 409` โค้ดจะมองว่า SKU ซ้ำกับตัวเองแล้วโยน 409 ทันที $\rightarrow$ **เทสต์ตกทันที**
* ❌ **กับดักที่ 2: สร้างข้อมูลใหม่เมื่อไม่พบ ID**
  - ในมาตรฐาน REST แบบเข้มงวด ถ้า ID ที่ระบุใน URL ไม่พบในฐานข้อมูล ต้องตอบ `404 Not Found` เสมอ ห้ามไปสร้างแถวใหม่
