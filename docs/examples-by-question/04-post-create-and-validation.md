# ข้อที่ 4: [POST Create & Validation] การสร้างข้อมูล, การตรวจสอบ Body, และ Duplicate Key (409)

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

* **โจทย์:** ให้สร้าง Endpoint สำหรับสร้างสินค้าใหม่ลงในฐานข้อมูล
* **Method & URI:** `POST /api/<STUDENT_ID>/products`
* **เงื่อนไข:**
  1. **ตรวจสอบความถูกต้องของข้อมูล (Validation):**
     - ฟิลด์ที่จำเป็น (Required): `sku`, `name`, `brandId`, `price`, `stock`
     - `sku`: ต้องไม่ว่าง, ความยาว 3-30 ตัวอักษร, อักขระเป็น `[A-Z0-9-]` เท่านั้น
     - `name`: ตัดช่องว่าง (trim) แล้วต้องมีความยาว 1-100 ตัวอักษร
     - `price`: ต้องเป็นตัวเลขมากกว่า `0.00`
     - `stock`: ต้องเป็นจำนวนเต็มบวกหรือ 0 (`stock >= 0`)
     - หากไม่ผ่านเงื่อนไขใด ให้ส่ง **`HTTP 400 Bad Request`** (`code: "VALIDATION_ERROR"`)
  2. **ตรวจสอบ Foreign Key:** `brandId` ต้องมีอยู่จริงในตาราง `brands` ถ้าไม่มีให้ส่ง **`HTTP 404/400`**
  3. **ตรวจสอบ Duplicate Key:** `sku` ต้องไม่ซ้ำกับสินค้าอื่นในระบบ หากซ้ำให้ส่ง **`HTTP 409 Conflict`** (`code: "DUPLICATE_KEY"`)
  4. **เมื่อสร้างสำเร็จ:**
     - ตอบกลับด้วย **`HTTP 201 Created`**
     - ตั้งค่า Header **`Location: /api/.../products/{newId}`**
     - ส่งข้อมูลสินค้าที่เพิ่งสร้างใน Body

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer

### 2.1 Layer Repository (`src/repositories/product-repo.js`)
```javascript
import db from '../configs/db-config.js';

export async function findBySku(sku) {
  const [rows] = await db.query('SELECT * FROM products WHERE sku = ?', [sku]);
  return rows.length > 0 ? rows[0] : null;
}

export async function insertProduct(productData) {
  const SQL = `
    INSERT INTO products (sku, name, brand_id, category, price, ram_gb, storage_gb, color, stock_quantity, status, release_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(SQL, [
    productData.sku,
    productData.name,
    productData.brandId,
    productData.category || 'GENERAL',
    productData.price,
    productData.ramGb || null,
    productData.storageGb || null,
    productData.color || null,
    productData.stock,
    productData.status || 'AVAILABLE',
    productData.releaseDate || null
  ]);

  return result.insertId;
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

export async function createNewProduct(body) {
  // 1. Validation ตรวจสอบฟิลด์ที่จำเป็น
  const required = ['sku', 'name', 'brandId', 'price', 'stock'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new AppError(`Field '${field}' is required and cannot be empty`, 400, 'VALIDATION_ERROR');
    }
  }

  // 2. Trim ข้อความและตรวจ Format
  const sku = String(body.sku).trim();
  const name = String(body.name).trim();

  if (sku.length < 3 || sku.length > 30 || !/^[A-Z0-9-]+$/.test(sku)) {
    throw new AppError('SKU must be 3-30 uppercase characters matching [A-Z0-9-]', 400, 'VALIDATION_ERROR');
  }

  const price = Number(body.price);
  if (isNaN(price) || price <= 0) {
    throw new AppError('Price must be a positive number greater than 0', 400, 'VALIDATION_ERROR');
  }

  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError('Stock must be an integer greater than or equal to 0', 400, 'VALIDATION_ERROR');
  }

  // 3. ตรวจสอบ Foreign Key (Brand มีจริงไหม)
  const brandExists = await brandRepo.existsById(body.brandId);
  if (!brandExists) {
    throw new AppError(`Brand with ID '${body.brandId}' does not exist`, 404, 'BRAND_NOT_FOUND');
  }

  // 4. ตรวจสอบ Duplicate Key (SKU ซ้ำไหม)
  const existingProduct = await productRepo.findBySku(sku);
  if (existingProduct) {
    throw new AppError(`Product with SKU '${sku}' already exists`, 409, 'DUPLICATE_KEY');
  }

  // 5. บันทึกลงฐานข้อมูล
  const newId = await productRepo.insertProduct({
    ...body,
    sku,
    name,
    price,
    stock
  });

  return { id: newId, sku, name, brandId: body.brandId, price, stock };
}
```

---

### 2.3 Layer Route (`src/routes/product-route.js`)
```javascript
import express from 'express';
import * as productService from '../services/product-service.js';

const router = express.Router();

// POST /api/<STUDENT_ID>/products
router.post('/', async (req, res, next) => {
  try {
    const createdProduct = await productService.createNewProduct(req.body);

    // กำหนด Location Header ชี้ไปยัง URL ของสินค้าใหม่
    const locationPath = `${req.baseUrl}/${createdProduct.id}`;
    res.set('Location', locationPath);

    res.status(201).json({
      success: true,
      data: createdProduct,
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

1. **`res.status(201)`**:
   - การสร้าง Resource ใหม่สำเร็จ มาตรฐาน REST บังคับให้ใช้ Status `201 Created` เสมอ (ห้ามใช้ 200)
2. **`res.set('Location', locationPath)`**:
   - ข้อสอบ REST แทบทุกชุดมีข้อตรวจว่า Response ของ POST ต้องมี Header `Location` ที่บอก Client ว่าสามารถไปอ่าน Resource ที่เพิ่งสร้างใหม่ได้ที่ URI ใด (เช่น `/api/68130500077/products/49`)
3. **การดักจับ Duplicate Entry สองชั้น (Double Protection)**:
   - ชั้นที่ 1: เราเช็ก `findBySku(sku)` ในระดับโค้ด เพื่อความชัดเจนและโยน `409 DUPLICATE_KEY`
   - ชั้นที่ 2: แม้จะหลุดไปถึง MySQL และเกิด Error `ER_DUP_ENTRY (1062)` ตัว `errorHandler` ก็จะดักจับและเปลี่ยนเป็น 409 ให้โดยอัตโนมัติ

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1:** ส่ง `Location` header ไม่ครบ หรือ Path ใน Location ผิด $\rightarrow$ ข้อสอบตรวจ Location header มี 3-5 คะแนนในหมวด REST Principles
* ❌ **กับดักที่ 2:** เมื่อ SKU ซ้ำ ปล่อยให้เกิด Unhandled Database Exception จน Server ส่ง 500 $\rightarrow$ **ต้องเป็น 409 Conflict เท่านั้น**
* ❌ **กับดักที่ 3:** ไม่ตัดช่องว่าง (`trim()`) ทำให้ถ้าส่ง `" APL-001 "` ไป อาจถูกบันทึกพร้อมช่องว่าง หรือผิด Format
