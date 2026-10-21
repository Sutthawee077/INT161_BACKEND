# ข้อสอบภาคปฏิบัติ: Mobile Product REST API ด้วย Node.js & Express (JavaScript ES Modules)

## 1. สถานการณ์และวัตถุประสงค์
ร้าน Mobile Hub ต้องการระบบจัดการสินค้าโทรศัพท์มือถือและแบรนด์ ให้นักศึกษาพัฒนา RESTful API ด้วย **Node.js (Express.js, ES Modules)** ที่บันทึกข้อมูลจริงในฐานข้อมูล MySQL ครอบคลุมหลักการ REST principles, Clean 3-Layer Architecture, DTO Mapping และ Exception handling ระบบจะถูกตรวจจาก HTTP request/response ด้วย Black-box Test Suite (`test_api.py`) และตรวจโครงสร้าง source code แยกกัน

---

## 2. สภาพแวดล้อมและขอบเขต
- **Runtime & Language:** Node.js (v18+ / v20+ ขึ้นไป) โดยใช้ JavaScript แบบ **ECMAScript Modules (`"type": "module"` ใน `package.json`)**
- **Framework & Libraries:**
  - `express`: สำหรับสร้าง RESTful API Web Server และ Routing
  - `mysql2/promise`: สำหรับเชื่อมต่อและจัดการ Connection Pool ไปยัง MySQL Database
- **ฐานข้อมูล:** ใช้ MySQL 8.0 ขึ้นไป ชื่อฐานข้อมูล `mobile_exam` โดยมีตารางและคอลัมน์ตรงตามโครงสร้าง SQL Schema ที่กำหนด ห้ามใช้ In-memory List/Object แทนฐานข้อมูลจริง ข้อมูลต้องคงอยู่แม้ Restart เซิร์ฟเวอร์
- **Base URL:** `http://localhost:8080/api/v1` ทุกคำขอเป็นอิสระต่อกัน (Stateless) และไม่พึ่งพา Session
- **ขอบเขต:** ข้อสอบไม่รวม authentication, pagination, PATCH, file upload หรือ frontend รับ/ส่งข้อมูลในรูปแบบ JSON เท่านั้น ยกเว้น `DELETE` สำเร็จที่ต้องไม่มี Response Body (204 No Content)
- **REST Behavior:**
  - `GET` ต้องไม่แก้ไขหรือเปลี่ยนแปลงสถานะของฐานข้อมูล
  - `PUT` เป็นการแทนที่ข้อมูลเดิมทุกฟิลด์ที่อนุญาต (Full Replacement) ไม่ใช่ Partial Update
  - `DELETE` ซ้ำบน ID เดิม ต้องตอบกลับเป็น `404 Not Found` เพื่อคงคุณสมบัติ Idempotent ของสถานะระบบ

---

## 3. โครงสร้างฐานข้อมูล (Database Schema)
ฐานข้อมูล `mobile_exam` ประกอบด้วย 2 ตารางหลัก:

1. **`brands`**:
   - `id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY`
   - `name VARCHAR(60) NOT NULL UNIQUE`
   - `country VARCHAR(60) NOT NULL`

2. **`products`**:
   - `id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY`
   - `sku VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE` (เปรียบเทียบแบบ Case-Sensitive)
   - `name VARCHAR(100) NOT NULL`
   - `brand_id BIGINT NOT NULL` (Foreign Key อ้างอิง `brands.id`)
   - `price DECIMAL(10,2) NOT NULL`
   - `stock INT NOT NULL`
   - `ram_gb INT NOT NULL`
   - `storage_gb INT NOT NULL`
   - `color VARCHAR(40) NOT NULL`
   - `description VARCHAR(500) NULL` (เป็น Optional อนุญาตให้เป็น null ได้)
   - `active BOOLEAN NOT NULL` (เก็บเป็น TINYINT(1) ใน MySQL)
   - `CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT`

> [!NOTE]
> ความสัมพันธ์ระหว่าง Brand กับ Product เป็นแบบ 1:N (One-to-Many) โดยสินค้าทุกชิ้นต้องมีแบรนด์ผูกอยู่เสมอ และใช้เงื่อนไข `ON DELETE RESTRICT` เพื่อห้ามลบแบรนด์ที่มีสินค้าผูกอยู่

---

## 4. DTO และสัญญา JSON (JSON Contracts)

### 4.1 Product Request Body (สำหรับ POST และ PUT)
คำขอ POST และ PUT ต้องส่งข้อมูลทุกฟิลด์ที่ Required เข้ามา ห้ามส่งฟิลด์แปลกปลอม (เช่น `id` หรือ `unknown`) เข้ามาเด็ดขาด:

| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | Required | เงื่อนไขและกฎการตรวจสอบ |
|---|---|:---:|---|
| `sku` | string | ใช่ | ตัดช่องว่างหัวท้าย (trim); ความยาว 3–30 ตัวอักษร; รูปแบบตาม regex `^[A-Z0-9-]+$`; ต้องไม่ซ้ำ |
| `name` | string | ใช่ | ตัดช่องว่างหัวท้าย (trim); ความยาว 1–100 ตัวอักษร; ห้ามเป็นค่าว่าง |
| `brandId` | integer | ใช่ | ต้องเป็นตัวเลขจำนวนเต็มบวก > 0 และมีตัวตนอยู่ในตาราง `brands` |
| `price` | number | ใช่ | ตัวเลขระหว่าง 0.01 – 99,999,999.99 (รวมขอบ); ทศนิยมไม่เกิน 2 ตำแหน่ง |
| `stock` | integer | ใช่ | ตัวเลขจำนวนเต็มระหว่าง 0 – 100,000 (รวมขอบ); ห้ามมีจุดทศนิยมแม้กระทั่ง `1.0` |
| `ramGb` | integer | ใช่ | ตัวเลขจำนวนเต็ม: ต้องเป็นค่า 2, 4, 6, 8, 12, 16 หรือ 24 เท่านั้น |
| `storageGb` | integer | ใช่ | ตัวเลขจำนวนเต็ม: ต้องเป็นค่า 32, 64, 128, 256, 512 หรือ 1024 เท่านั้น |
| `color` | string | ใช่ | ตัดช่องว่างหัวท้าย (trim); ความยาว 1–40 ตัวอักษร; ห้ามเป็นค่าว่าง |
| `description` | string/null | ไม่ | หากไม่ส่งมาให้มีค่าเป็น null; ความยาวไม่เกิน 500 ตัวอักษร; **ห้ามสั่ง trim** |
| `active` | boolean | ใช่ | ต้องเป็นค่า boolean แท้จริง (`true` หรือ `false`); ห้ามส่งสตริง `"true"` หรือตัวเลข 1 |

### 4.2 กฎการปฏิเสธชนิดข้อมูล (Strict Type Checking)
- ไม่อนุญาตให้มีฟิลด์แปลกปลอม เช่น `id`, `brand`, `unknown` ใน Request Body $\rightarrow$ ตอบ **`400 INVALID_REQUEST`**
- ไม่อนุญาตให้ส่งตัวเลขในรูปสตริง เช่น `"100"` หรือ `"1.5"` $\rightarrow$ ตอบ **`400 INVALID_REQUEST`**
- ไม่อนุญาตให้ส่งจุดทศนิยมในฟิลด์ที่เป็น Integer เช่น `"stock": 1.0` หรือ `"stock": 1.5` $\rightarrow$ ตอบ **`400 INVALID_REQUEST`**
- ข้อมูลที่ผิดชนิดข้อมูลตั้งแต่ต้นจะจัดเป็น **`INVALID_REQUEST`**
- ข้อมูลที่ชนิดข้อมูลถูกต้องแต่ไม่ผ่านเงื่อนไขขอบเขตค่า จะจัดเป็น **`VALIDATION_ERROR`** พร้อมส่งอาร์เรย์ `fieldErrors`

### 4.3 โครงสร้าง Response Data
1. **Product Response (เดี่ยวและอาร์เรย์):**
   ```json
   {
     "id": 1,
     "sku": "EXAM-001",
     "name": "Exam Phone",
     "brand": {
       "id": 1,
       "name": "Apple"
     },
     "price": 15990.50,
     "stock": 10,
     "ramGb": 8,
     "storageGb": 256,
     "color": "Black",
     "description": "เครื่องทดสอบ",
     "active": true
   }
   ```
2. **Brand Response (GET /api/v1/brands):**
   ```json
   [
     {
       "id": 1,
       "name": "Apple",
       "country": "United States"
     }
   ]
   ```

---

## 5. การจัดการ Error และรหัสสถานะ HTTP (Exception Handling)
Response เมื่อเกิดข้อผิดพลาดจะต้องมีโครงสร้าง JSON มาตรฐานเดียวกันทั้งระบบ:
```json
{
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "Detailed error message",
  "path": "/api/v1/products",
  "fieldErrors": []
}
```

### ตาราง HTTP Status Codes:
- **`200 OK`**: คำขอสำเร็จ (GET, PUT)
- **`201 Created`**: สร้างข้อมูลสำเร็จ (POST) พร้อมแนบ Response Header `Location: /api/v1/products/:id`
- **`204 No Content`**: ลบข้อมูลสำเร็จ (DELETE) **โดยต้องไม่มี Response Body เด็ดขาด (`res.status(204).end()`)**
- **`400 Bad Request`**: ข้อมูล Request ไม่ถูกต้อง (`INVALID_REQUEST` หรือ `VALIDATION_ERROR`)
- **`404 Not Found`**: ไม่พบข้อมูลในระบบ (`PRODUCT_NOT_FOUND`, `BRAND_NOT_FOUND`)
- **`405 Method Not Allowed`**: เรียกใช้ HTTP Method ที่ไม่รองรับบน Endpoint นั้น
- **`406 Not Acceptable`**: Client ส่ง Header `Accept` ที่ไม่ยอมรับ `application/json`
- **`409 Conflict`**: ข้อมูลซ้ำซ้อน (`DUPLICATE_SKU`) หรือติด Foreign Key Restrict (`RESOURCE_IN_USE`)
- **`415 Unsupported Media Type`**: Client ยิง POST/PUT โดยส่ง Header `Content-Type` ที่ไม่ใช่ `application/json`
- **`500 Internal Server Error`**: ข้อผิดพลาดภายในระบบ โดยต้องไม่เปิดเผย Stack Trace สู่ภายนอก

---

## 6. โครงสร้างโปรแกรมตามหลัก Clean 3-Layer Architecture
โปรเจกต์ต้องจัดโครงสร้างโฟลเดอร์ให้แบ่งแยกความรับผิดชอบอย่างชัดเจน:

```
src/
├── configs/
│   └── db-config.js          # MySQL connection pool (mysql2/promise)
├── repositories/             # Pure SQL Queries (SELECT, INSERT, UPDATE, DELETE)
│   ├── brand-repo.js
│   └── product-repo.js
├── services/                 # Business Logic, Existence checks, DTO mapping
│   ├── brand-service.js
│   └── product-service.js
├── routes/                   # Express Routers, HTTP Status, Headers
│   ├── brand-route.js
│   └── product-route.js
├── middlewares/              # Validations, Headers (415/406), Error Handlers
│   ├── error-handler.js
│   ├── transport-middleware.js
│   └── validate-product.js
└── app.js                    # Express app initialization & Middleware pipeline
```

---

## 7. เกณฑ์การให้คะแนน (100 คะแนนเต็ม)

| หมวด | คะแนน | รายละเอียดและหลักฐานการตรวจ |
|---|:---:|---|
| **REST Principles** | 15 | การใช้ HTTP Resource/Method/Status ที่ถูกต้อง (8), Header Location ใน 201 (3), Idempotence ของ GET, PUT และ DELETE 204 ไม่มี body (4) |
| **CRUD & Persistence** | 35 | GET List/Brands (6), GET by ID (5), POST Create (8), PUT Update (8), DELETE (5), Filter by brandId (3) บันทึกใน MySQL จริง |
| **DTO & Data Contracts** | 20 | Nested Brand Object และโครงสร้าง JSON (7), Validation/Normalization/Strict Typing และปฏิเสธทศนิยมใน Integer (8), ปฏิเสธฟิลด์แปลกปลอม (5) |
| **Exception Handling** | 20 | โครงสร้าง Error Response สม่ำเสมอ (4), 400 Bad Request (5), 404 Not Found (4), 409 Conflict SKU ซ้ำ (3), 405/415/406 Transport (2), 500 ปลอดภัยไม่หลุด stack trace (2) |
| **Clean Architecture** | 10 | แบ่ง Layer ชัดเจน Controller $\rightarrow$ Service $\rightarrow$ Repository (4), การใช้ Connection Pool และ Prepared Statements (3), ไฟล์ README/Config และรันผ่าน npm start (3) |

---

## 8. วิธีการรันและทดสอบระบบ

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าและเตรียมฐานข้อมูล
```bash
node init_db.js
```

### 3. รัน Server
```bash
npm start
```
เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:8080`
