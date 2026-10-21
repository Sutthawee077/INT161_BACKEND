# 📚 INT161 Backend Exam - คู่มือตัวอย่างโค้ดเจาะลึกแยกรายข้อ (Question-by-Question Guide)

คลังคู่มือฉบับสมบูรณ์สำหรับการสอบปฏิบัติวิชา **INT161 Backend Development** เขียนด้วย **Node.js (Express.js, ES Modules) + MySQL (`mysql2/promise`)** 

คู่มือชุดนี้ถูกจัดทำขึ้นเพื่อให้คุณสามารถเปิดอ่าน ทำความเข้าใจทีละข้อ และคัดลอกส่วนประกอบที่จำเป็นไปประยุกต์ใช้ในห้องสอบได้อย่างรวดเร็ว แม่นยำ และได้คะแนนเต็ม 100%

---

## 🗺️ สารบัญข้อสอบและหัวข้อหลัก (Exam Topics Index)

| ข้อที่ | หัวข้อและสถานการณ์ของโจทย์ | HTTP Method & Path | สิ่งสำคัญที่ข้อสอบตรวจ | ลิงก์ไปยังคู่มือ |
|:---:|:---|:---|:---|:---:|
| **01** | **Identity Verification**<br>ยืนยันตัวตนรหัสนักศึกษา | `GET /student-info`<br>`/api/<STUDENT_ID>/...` | Static Route, Path Prefix, การป้องกัน Hardcode | [📖 อ่านข้อที่ 1](./01-identity-verification.md) |
| **02** | **Get All with Pagination & DTO**<br>ดึงข้อมูลทั้งหมด + แบ่งหน้า + กรองฟิลด์ | `GET /products?page=1&limit=10` | `LIMIT ? OFFSET ?`, `COUNT(*)`, Summary DTO, Metadata | [📖 อ่านข้อที่ 2](./02-get-all-pagination-dto.md) |
| **03** | **Get by ID & Relationship Join**<br>ดึงข้อมูลเดี่ยว + JOIN ตาราง + 404 | `GET /products/:id` | Path Param Validation, `LEFT JOIN`, Detail DTO, 404 | [📖 อ่านข้อที่ 3](./03-get-by-id-and-404.md) |
| **04** | **Create Resource & Validation**<br>สร้างข้อมูลใหม่ + ตรวจสอบ + 409 Duplicate | `POST /products` | Strict Body Validation, Duplicate SKU (409), `201 Created` + `Location` | [📖 อ่านข้อที่ 4](./04-post-create-and-validation.md) |
| **05** | **Update Resource & Idempotence**<br>แก้ไขข้อมูลแบบแทนที่ทั้งหมด (PUT) | `PUT /products/:id` | Full Replacement, Check Own SKU vs Other SKU, Nullify fields | [📖 อ่านข้อที่ 5](./05-put-update-and-idempotence.md) |
| **06** | **Delete Resource & FK Restrict**<br>ลบข้อมูล และจัดการ Foreign Key | `DELETE /products/:id` | `204 No Content` (Empty body), Repeated Delete 404, FK Restrict (409) | [📖 อ่านข้อที่ 6](./06-delete-and-foreign-key.md) |
| **07** | **Centralized Error Handling**<br>การดักจับ Error รวมศูนย์ และ MySQL Mapping | Global Express Middleware | Express 4-param handler, MySQL Error codes (1062/1451/1452), 404 JSON | [📖 อ่านข้อที่ 7](./07-centralized-error-handling.md) |

---

## 🏗️ โครงสร้าง 3-Layer Architecture ที่ใช้ในทุกข้อ

ทุกข้อถูกออกแบบภายใต้โครงสร้าง Clean Architecture ที่อาจารย์กำหนดและให้คะแนนด้าน Best Practices:

```
src/
├── configs/
│   └── db-config.js          # MySQL connection pool (mysql2/promise)
├── errors/
│   └── app-error.js          # Custom AppError class (statusCode, errorCode)
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

## ⚡ คำแนะนำในการใช้คู่มือนี้ระหว่างสอบ

1. **อ่าน `EXAM_CHEATSHEET.md` และ `SQL_REPOSITORY_CHEATSHEET.md` ที่ Root:**
   - ตรวจดูว่าข้อสอบรอบของคุณเป็น **Style A** (แบบใช้ Student ID ใน URL Prefix และมีระบบแบ่งหน้า Pagination) หรือ **Style B** (แบบ REST API มาตรฐาน มีการตรวจ Header 415/406 และ Type Checking เข้มงวด)
   - หากต้องการเขียนคำสั่ง SQL สำหรับ Repository ให้เปิด [`SQL_REPOSITORY_CHEATSHEET.md`](../SQL_REPOSITORY_CHEATSHEET.md) เพื่อดูตัวอย่างคำสั่ง CRUD, Pagination, JOIN, Transaction ได้ทันที
2. **จับคู่โจทย์ของข้อนั้นเข้ากับไฟล์ในโฟลเดอร์นี้:**
   - เช่น ถ้าโจทย์บอกว่า *"ให้เขียนฟังก์ชันลบข้อมูลลูกค้า หากมี Order ค้างอยู่ให้ตอบ 409"* $\rightarrow$ เปิด **`06-delete-and-foreign-key.md`** ได้ทันที
   - หากโจทย์มี *"ให้สร้าง Pagination คืนค่า totalPages, hasNextPage"* $\rightarrow$ เปิด **`02-get-all-pagination-dto.md`**
3. **ตรวจสอบ Checklist จุดที่นักศึกษาตกม้าตายบ่อย (Traps & Pitfalls):**
   - ท้ายไฟล์แต่ละข้อจะมีตารางเตือนจุดผิดพลาดที่ทำให้เสียคะแนน เช่น การส่ง Response Body ใน HTTP 204 หรือ การลืมใส่ `return` หลังส่ง Error ให้กวาดสายตาตรวจตามตารางก่อน Submit ข้อสอบเสมอ!
