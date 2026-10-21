# 🚨 คู่มือแก้ Error ยอดฮิตเวลาลนในห้องสอบ (Emergency Troubleshooting Guide)

> **💡 คำแนะนำ:** เวลาทำข้อสอบแล้วโค้ดระเบิดหรือเกิด Error อย่าเพิ่งตกใจลนลาน! ให้กด `Ctrl + F` ในหน้านี้แล้วค้นหาข้อความ Error ที่ขึ้นใน Terminal หรือ Postman เพื่อดูวิธีแก้แบบ 10 วินาทีได้ทันทีครับ

---

## 📑 สารบัญค้นหาด่วน (Quick Navigation)

| ลำดับ | ข้อความ Error ที่พบ | สาเหตุสั้นๆ | ลิงก์ไปยังวิธีแก้ |
|:---:|---|---|:---:|
| **1** | `Cannot use import statement outside a module` | ยังไม่ได้บอก Node.js ให้ใช้ ES Modules | [🚀 แก้ข้อ 1](#1-cannot-use-import-statement-outside-a-module) |
| **2** | `Cannot set headers after they are sent to the client` | ส่ง response ซ้ำ ลืมใส่ `return` | [🚀 แก้ข้อ 2](#2-cannot-set-headers-after-they-are-sent-to-the-client) |
| **3** | `Cannot read properties of undefined (reading '...')` | ลืมเปิด Middleware `express.json()` | [🚀 แก้ข้อ 3](#3-typeerror-cannot-read-properties-of-undefined) |
| **4** | `connect ECONNREFUSED 127.0.0.1:3306` | ลืม Start MySQL ใน XAMPP / บริการ MySQL ดับ | [🚀 แก้ข้อ 4](#4-connect-econnrefused-1270013306) |
| **5** | `ER_NO_SUCH_TABLE` หรือ `Unknown database` | พิมพ์ชื่อ DB ผิด หรือลืมรันคำสั่งสร้างตาราง SQL | [🚀 แก้ข้อ 5](#5-er_no_such_table-หรือ-unknown-database) |
| **6** | ยิงแล้วติด `415 Unsupported Media Type` หรือ `406 Not Acceptable` ตลอด | ไม่ได้ใส่ Header ใน Postman / REST Client | [🚀 แก้ข้อ 6](#6-ติด-415-unsupported-media-type-หรือ-406-not-acceptable-ตลอดเวลา) |
| **7** | ยิง DELETE / PUT แล้ว Postman หมุนติ้วๆ ค้าง ไม่ยอมจบ (Hang / Timeout) | ลืมส่ง response คืน เช่น ลืมใส่ `res.status(204).end()` | [🚀 แก้ข้อ 7](#7-ยิง-delete--put-แล้ว-postman-หมุนติ้วๆ-ค้างไม่ยอมจบ) |
| **8** | `Error: bind EADDRINUSE: address already in use :::8080` | Port 8080 ชนกับเซิร์ฟเวอร์ตัวเก่าที่ยังไม่ปิด | [🚀 แก้ข้อ 8](#8-error-bind-eaddrinuse-address-already-in-use-8080) |
| **9** | `Incorrect integer value: 'NaN'` หรือ `Data truncated` | แปลงค่า parseInt แล้วได้ NaN หรือลืมตรวจค่าว่าง | [🚀 แก้ข้อ 9](#9-incorrect-integer-value-nan-หรือ-data-truncated) |
| **10** | `ER_ROW_IS_REFERENCED_2` (Foreign key constraint fails) | ลบตารางแม่ที่มีตารางลูกอ้างอิงอยู่ (ต้องดักส่ง 409) | [🚀 แก้ข้อ 10](#10-er_row_is_referenced_2-foreign-key-constraint-fails) |

---

## 1. `Cannot use import statement outside a module`

### 🔍 สาเหตุ:
Node.js มองโปรเจกต์เป็น CommonJS (`require()`) โดยค่าเริ่มต้น ทำให้เมื่อเขียนไวยากรณ์ `import express from 'express'` แล้วพัง

### ⏱️ วิธีแก้ใน 10 วินาที:
เปิดไฟล์ `package.json` แล้วเพิ่ม `"type": "module"`:

```json
{
  "name": "exam-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.21.0",
    "mysql2": "^3.11.0"
  }
}
```

> [!NOTE]
> หากไม่มีไฟล์ `package.json` ให้เปิด Terminal พิมพ์คำสั่ง:
> ```bash
> npm init -y
> npm pkg set type="module"
> ```

---

## 2. `Cannot set headers after they are sent to the client`

### 🔍 สาเหตุ:
Express พยายามส่ง Response ให้ Client มากกว่า 1 ครั้งใน Request เดียวกัน มักเกิดจากการลืมใส่คำว่า `return` หน้าคำสั่งส่ง Response หรือ Error ทำให้โค้ดไหลไปทำคำสั่งบรรทัดถัดไป

### ⏱️ วิธีแก้ใน 10 วินาที:

#### ❌ ตัวอย่างโค้ดที่ผิด:
```javascript
if (!product) {
  res.status(404).json({ message: 'Not found' }); // ❌ ลืม return โค้ดจะรันบรรทัดต่อไปต่อ!
}
res.status(200).json(product); // ❌ สั่งส่งซ้ำรอบสอง -> พังทันที!
```

#### ✅ วิธีแก้ที่ถูกต้อง:
```javascript
if (!product) {
  return res.status(404).json({ message: 'Not found' }); // ✅ ใส่ return ตัดจบการทำงานทันที
}
return res.status(200).json(product);
```

---

## 3. `TypeError: Cannot read properties of undefined` (reading '...')

### 🔍 สาเหตุ:
เรียกใช้ `req.body.name` หรือ `req.body.price` แล้วพบว่า `req.body` เป็น `undefined` เพราะ Express ยังไม่ได้เปิดใช้งาน JSON Body Parser

### ⏱️ วิธีแก้ใน 10 วินาที:
เปิดไฟล์ `app.js` (หรือจุดเริ่มต้น Express) แล้วเพิ่มบรรทัดนี้ **ก่อน Routers ทุกตัว**:

```javascript
import express from 'express';
const app = express();

// ✅ ต้องใส่บรรทัดนี้ก่อน app.use('/api/...', router) เสมอ!
app.use(express.json());

app.use('/api/v1/products', productRouter);
```

---

## 4. `connect ECONNREFUSED 127.0.0.1:3306`

### 🔍 สาเหตุ:
Express ติดต่อไปยัง MySQL ที่พอร์ต 3306 ไม่สำเร็จ เพราะ Service ของ MySQL ยังไม่ได้เปิดทำงาน หรือเปิดคนละพอร์ต

### ⏱️ วิธีแก้ใน 10 วินาที:
1. **เช็คโปรแกรม XAMPP / Laragon / Docker:**
   - ตรวจสอบว่าได้กดปุ่ม **Start** ที่หน้า MySQL หรือยัง (ตัวอักษร MySQL ต้องเป็นสีเขียว)
2. **เช็คพอร์ตใน `configs/db-config.js`:**
   - ถ้าใน XAMPP พอร์ต MySQL เปลี่ยนเป็น `3307` ต้องเปลี่ยนค่าในโค้ดให้ตรงกัน:
   ```javascript
   export const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',
     password: '', // ค่าเริ่มต้น XAMPP คือว่างไว้
     database: 'mobile_exam',
     port: 3306, // หรือ 3307 ตามที่ XAMPP แสดง
     waitForConnections: true,
     connectionLimit: 10
   });
   ```

---

## 5. `ER_NO_SUCH_TABLE` หรือ `Unknown database`

### 🔍 สาเหตุ:
- `ER_NO_SUCH_TABLE`: คำสั่ง SQL พยายามค้นหาตารางที่ไม่มีอยู่ในฐานข้อมูล (พิมพ์ชื่อตารางผิด หรือยังไม่ได้รันตาราง)
- `ER_BAD_DB_ERROR` / `Unknown database`: ยังไม่ได้สร้างฐานข้อมูลชื่อนี้ใน MySQL

### ⏱️ วิธีแก้ใน 10 วินาที:
1. **เช็คชื่อฐานข้อมูลใน `configs/db-config.js`:** ให้ตรงกับที่โจทย์ระบุเป๊ะๆ เช่น `classicmodels` หรือ `mobile_exam`
2. **รันสคริปต์ SQL สร้างตาราง:**
   - เปิดโปรแกรม phpMyAdmin (หรือ DBeaver / MySQL Workbench)
   - ก๊อปปี้คำสั่งจาก `database/schema.sql` ไปวางแล้วกด Execute
   - หรือรันผ่านคำสั่ง Terminal:
   ```bash
   node database/init_db.js
   ```

---

## 6. ติด `415 Unsupported Media Type` หรือ `406 Not Acceptable` ตลอดเวลา

### 🔍 สาเหตุ:
โค้ดมี Middleware ตรวจสอบ Content Negotiation (`Content-Type` และ `Accept`) แต่ในโปรแกรมทดสอบ (Postman / REST Client) ไม่ได้ส่ง Headers ไปด้วย

### ⏱️ วิธีแก้ใน 10 วินาที:
เปิด Postman ไปที่แท็บ **Headers** ของ Request นั้น แล้วเพิ่ม 2 ค่านี้:

| Key | Value | ความหมาย |
|---|---|---|
| `Content-Type` | `application/json` | สำหรับคำขอที่มี Body (POST, PUT) ป้องกัน Error 415 |
| `Accept` | `application/json` | สำหรับทุกคำขอ (GET, POST, PUT, DELETE) ป้องกัน Error 406 |

> [!TIP]
> หากต้องการข้ามการตรวจนี้ชั่วคราวในห้องสอบ ให้ไปดูที่ `src/app.js` แล้วคอมเมนต์ `app.use(transportValidator)` ปิดไว้ชั่วคราวขณะพัฒนา แต่ก่อนส่งข้อสอบต้องเปิดกลับมาด้วยนะครับ!

---

## 7. ยิง DELETE / PUT แล้ว Postman หมุนติ้วๆ ค้างไม่ยอมจบ

### 🔍 สาเหตุ:
1. ใน Route ไม่มีการสั่งส่ง Response กลับ Client (เช่น ลืมใส่ `res.status(204).end()`) ทำให้ Client รอ Response จน Timeout
2. หรือลืมใส่ `await` หน้าคำสั่ง Promise/SQL ทำให้โค้ดไม่รอ หรือติด Deadlock

### ⏱️ วิธีแก้ใน 10 วินาที:

#### กรณี DELETE (ต้องตอบ 204 No Content และห้ามมี Body):
```javascript
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    await productService.deleteProduct(id);
    
    // ✅ ต้องมีบรรทัดนี้ และใช้ .end() ปิดการทำงาน (ห้ามส่ง json)
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});
```

#### ตรวจสอบคำว่า `await`:
```javascript
// ❌ ผิด: ลืม await ผลลัพธ์จะเป็น Promise ค้าง
const result = productRepo.deleteById(id);

// ✅ ถูก: ต้องมี await เสมอเมื่อเรียก Repository หรือ Database
const result = await productRepo.deleteById(id);
```

---

## 8. `Error: bind EADDRINUSE: address already in use :::8080`

### 🔍 สาเหตุ:
พอร์ต `8080` กำลังถูกใช้งานอยู่ มักเกิดจากเราเคยรันคำสั่ง `node app.js` ค้างไว้ใน Terminal อีกหน้าต่างหนึ่ง แล้วเผลอกดรันซ้ำ

### ⏱️ วิธีแก้ใน 10 วินาที:
เปิด PowerShell แล้วสั่งปิด Process ที่รันอยู่ที่พอร์ต 8080 ทันที:

```powershell
# หา Process ID ที่กำลังใช้พอร์ต 8080 แล้วสั่งหยุด
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force
```

หรือถ้าจำเลขพอร์ตไม่ได้ ให้เปลี่ยนพอร์ตในไฟล์ `src/app.js` เป็นเลขอื่นชั่วคราว เช่น `8081`:
```javascript
const PORT = process.env.PORT || 8081;
```

---

## 9. `Incorrect integer value: 'NaN'` หรือ `Data truncated`

### 🔍 สาเหตุ:
นำตัวแปรที่รับมาจาก URL Path Param หรือ Query Param เช่น `req.params.id` ไปแปลงด้วย `parseInt()` แล้วค่าเป็นตัวอักษร ทำให้ได้ผลลัพธ์เป็น `NaN` (Not a Number) เมื่อส่งเข้า MySQL จึงเกิด Error ทันที

### ⏱️ วิธีแก้ใน 10 วินาที:
ตรวจเช็คค่า `isNaN` หรือใช้ Regex ตรวจสอบว่าเป็นตัวเลขจำนวนเต็มบวกก่อนส่งเข้า Database:

```javascript
const rawId = req.params.id;

// ✅ ตรวจสอบว่าเป็นตัวเลขล้วนหรือไม่
if (!/^\d+$/.test(rawId)) {
  return res.status(400).json({
    status: 400,
    message: 'ID must be a positive integer'
  });
}

const id = parseInt(rawId, 10);
```

---

## 10. `ER_ROW_IS_REFERENCED_2` (Foreign key constraint fails)

### 🔍 สาเหตุ:
พยายามสั่งลบข้อมูลในตารางแม่ (เช่น แบรนด์ หรือ สินค้า) ที่มีตารางลูกชี้ Foreign Key อ้างอิงอยู่ (เช่น มีตาราง Order Items ผูกอยู่กับสินค้านี้) ทำให้ MySQL ปฏิเสธการลบเพื่อรักษาความสมบูรณ์ของข้อมูล

### ⏱️ วิธีแก้ใน 10 วินาที:
ในไฟล์ `middlewares/error-handler.js` หรือใน Controller ให้ดักจับรหัส Error `1451` ของ MySQL แล้วแปลงเป็น **HTTP 409 Conflict**:

```javascript
// ✅ ใน Error Handler กลาง:
if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2') {
  return res.status(409).json({
    status: 409,
    errorCode: 'FOREIGN_KEY_CONFLICT',
    message: 'Cannot delete or update this record because it is referenced by other resources.'
  });
}
```

---

## ⏱️ เช็กลิสต์ 1 นาทีก่อนกดส่งข้อสอบ (Pre-Submit Checklist)

- [ ] **ลบ `console.log()` ขยะ:** เช็คว่าไม่มี log ที่พิมพ์ password หรือ dump object ค้างเต็ม terminal
- [ ] **เช็ค HTTP 204:** ไม่มี body ปนออกไป (`return res.status(204).end()`)
- [ ] **เช็ค HTTP 201:** มี Header `Location` ส่งกลับไปด้วยเสมอ
- [ ] **เช็ค Error Handler ตัวสุดท้าย:** มี 4 พารามิเตอร์ครบ `(err, req, res, next)` และอยู่ล่างสุดของ `app.js`
- [ ] **เช็ค `package.json`:** มี `"type": "module"` และระบุ dependencies ครบ (`express`, `mysql2`)
- [ ] **ทดสอบปิดแล้วเปิดใหม่:** กด `Ctrl + C` ปิดเซิร์ฟเวอร์ แล้วสั่ง `node src/app.js` ดูว่าสตาร์ทติดโดยไม่มี error หรือไม่
