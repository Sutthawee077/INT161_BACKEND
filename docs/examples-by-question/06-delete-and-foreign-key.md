# ข้อที่ 6: [DELETE with FK Constraint] การลบข้อมูล และการจัดการ Foreign Key Restrict (409)

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

* **โจทย์:** ให้สร้าง Endpoint สำหรับลบข้อมูลออกจากฐานข้อมูลจริง
* **Method & URI:** `DELETE /api/<STUDENT_ID>/products/:id` (หรือ `DELETE /customers/:customerNumber`)
* **เงื่อนไข:**
  1. **ตรวจสอบความมีตัวตน:** หากไม่พบ ID สินค้าที่จะลบ ให้ตอบกลับเป็น **`HTTP 404 Not Found`**
  2. **ลบสำเร็จ:** ตอบกลับด้วย **`HTTP 204 No Content`** และ**ต้องไม่มี Response Body เด็ดขาด**
  3. **การลบซ้ำ:** หาก Client เรียก DELETE ด้วย ID เดิมซ้ำเป็นครั้งที่สอง ต้องตอบกลับเป็น **`HTTP 404 Not Found`**
  4. **Foreign Key Restrict Constraint (กรณีพิเศษ):**
     - หากข้อมูลที่จะลบถูกอ้างอิงเป็น Foreign Key ในตารางอื่น (เช่น กำลังลบลูกค้าที่มีข้อมูลคำสั่งซื้อ Orders หรือกำลังลบแบรนด์ที่มีสินค้าผูกอยู่)
     - MySQL จะปฏิเสธการลบด้วย Error: `ER_ROW_IS_REFERENCED_2 (1451)`
     - ระบบต้องดักจับและส่ง **`HTTP 409 Conflict`** (`code: "RESOURCE_IN_USE"`)

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer

### 2.1 Layer Repository (`src/repositories/product-repo.js`)
```javascript
import db from '../configs/db-config.js';

export async function findById(id) {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function deleteById(id) {
  const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
```

---

### 2.2 Layer Service (`src/services/product-service.js`)
```javascript
import * as productRepo from '../repositories/product-repo.js';

export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export async function removeProduct(id) {
  // 1. ตรวจสอบว่ามีข้อมูลก่อนลบหรือไม่
  const existing = await productRepo.findById(id);
  if (!existing) {
    throw new AppError(`Product with ID '${id}' was not found`, 404, 'PRODUCT_NOT_FOUND');
  }

  // 2. ดำเนินการลบออกจากฐานข้อมูล
  await productRepo.deleteById(id);
}
```

---

### 2.3 Layer Route (`src/routes/product-route.js`)
```javascript
import express from 'express';
import * as productService from '../services/product-service.js';

const router = express.Router();

// DELETE /api/<STUDENT_ID>/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid ID' });
    }

    await productService.removeProduct(id);

    // ⚠️ สำคัญมาก: 204 No Content ต้องใช้ .end() ห้ามส่ง json() หรือ body ใดๆ
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

### 2.4 การดักจับใน Error Middleware (`src/middlewares/error-handler.js`)
สำหรับกรณีที่ตารางนั้นมี Foreign Key ผูกอยู่และห้ามลบ (On Delete Restrict):

```javascript
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let code = err.errorCode || err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // ตรวจจับข้อผิดพลาด Foreign Key Restrict ของ MySQL
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    status = 409;
    code = 'RESOURCE_IN_USE';
    message = 'Cannot delete resource because it is referenced by other records';
  }

  res.status(status).json({
    status,
    code,
    message,
    path: req.originalUrl ? req.originalUrl.split('?')[0] : '',
    fieldErrors: []
  });
};
```

---

## 🔍 3. อธิบายการทำงานของโค้ดอย่างละเอียด (Explanation)

1. **`res.status(204).end()`**:
   - ข้อกำหนด HTTP RFC 9110 ระบุว่า `204 No Content` ต้องไม่มี Content-Body ใดๆ ทั้งสิ้น
   - ใน Express ถ้าคุณเขียน `res.status(204).json({ message: "deleted" })` มันจะยังคงส่ง JSON เล็กๆ ออกไป ซึ่งทำให้ Test Suite หลายตัวตรวจว่าตกทันที
   - การเขียน `.end()` คือการตัดจบ HTTP Response ทันทีโดยไม่มี Body
2. **ทำไมต้อง `findById` ก่อนลบ?**:
   - ถ้าเราสั่ง `DELETE FROM products WHERE id = 999999` ทันที MySQL จะไม่ Error แต่มันจะได้ `affectedRows = 0`
   - การเช็ก `findById` ก่อน จะทำให้เรารู้ทันทีว่าข้อมูลไม่มีอยู่ และสามารถโยน `404 Not Found` ได้อย่างถูกต้องตามเกณฑ์ข้อสอบ

---

## ⚠️ 4. จุดดักคะแนนที่ต้องระวัง (Exam Traps)

* ❌ **กับดักที่ 1: เผลอส่ง Response Body ใน Status 204**
  - ใน `test_api.py`: `_require(r[0] == 204 and r[3] == b'')` (ตรวจว่า bytes ใน payload ต้องว่างเปล่า!)
* ❌ **กับดักที่ 2: ลบครั้งที่สองแล้วไม่ตอบ 404**
  - ข้อสอบมักจะยิง DELETE ซ้ำ 2 ครั้งติดกัน ครั้งที่สองต้องได้ 404 เพราะข้อมูลถูกลบไปแล้วตั้งแต่ครั้งแรก
