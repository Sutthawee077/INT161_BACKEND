# 🚀 INT161 Backend Development - Complete Exam Package

คลังโค้ด เอกสารคู่มือ แม่แบบระบบ RESTful API สำหรับการสอบปฏิบัติวิชา **INT161 Backend Development** พัฒนาด้วย **Node.js (Express.js, ES Modules) + MySQL (`mysql2/promise`)** ภายใต้สถาปัตยกรรม **Clean 3-Layer Architecture**

---

## 📦 ดาวน์โหลดแพ็กเกจไฟล์ Zip (Direct Downloads)

เลือกดาวน์โหลดตามความต้องการเพื่อนำไปเปิดในเครื่องสอบได้ทันที:

| ไฟล์ Zip | ขนาด | รายละเอียดสิ่งที่รวมอยู่ภายใน | ลิงก์ดาวน์โหลด |
|---|:---:|---|:---:|
| **`INT161_BACKEND_EXAM_FULL_PACKAGE.zip`** | ~4 MB | 🌟 **แพ็กเกจเต็มทุกอย่าง:** โค้ดทั้งหมด + เอกสารคู่มือทั้งหมด + สไลด์เลกเชอร์ 6 บท | 👉 **[ดาวน์โหลด](./INT161_BACKEND_EXAM_FULL_PACKAGE.zip)** |
| **`INT161_SOURCE_CODES_ONLY.zip`** | ~98 KB | 💻 **รวมเฉพาะโฟลเดอร์โค้ดทั้งหมด:** รวม `src/`, `practices/`, `templates/`, `database/` (เบามาก ไม่มีไฟล์สไลด์) | 👉 **[ดาวน์โหลด](./INT161_SOURCE_CODES_ONLY.zip)** |
| **`src/src.zip`** | ~29 KB | 📱 เฉพาะโค้ดระบบหลัก 3-Layer Architecture (Mobile Products & Brands) | 👉 **[ดาวน์โหลด](src/src.zip)** |
| **`practices/practices.zip`** | ~28 KB | 🧪 เฉพาะโค้ดแบบฝึกหัดแล็บ Practice 2 และ 2.0 (ClassicModels) | 👉 **[ดาวน์โหลด](practices/practices.zip)** |
| **`templates/templates.zip`** | ~33 KB | 🎯 เฉพาะโค้ดโครงเทมเพลต Style A (Student ID URL Prefix) | 👉 **[ดาวน์โหลด](templates/templates.zip)** |
| **`database/database.zip`** | ~4 KB | 🗄️ เฉพาะสคริปต์ฐานข้อมูล `init_db.js` และ `schema.sql` | 👉 **[ดาวน์โหลด](database/database.zip)** |

---

## 🗂️ โครงสร้างไดเรกทอรีที่จัดหมวดหมู่ชัดเจน (Categorized Structure)

```
INT161_BACKEND/
├── README.md                              # 📖 หน้าสารบัญและแผนผังโปรเจกต์
├── INT161_BACKEND_EXAM_FULL_PACKAGE.zip   # 📦 ไฟล์ Zip แพ็กเกจเต็ม (โค้ด + คู่มือ + สไลด์)
├── INT161_SOURCE_CODES_ONLY.zip           # 📦 ไฟล์ Zip รวมเฉพาะโฟลเดอร์โค้ดทั้งหมด (เบามาก ~98KB)
│
├── 📂 docs/                               # 📚 [คลังเอกสาร & คู่มือสอบทั้งหมด]
│   ├── SQL_REPOSITORY_CHEATSHEET.md       # 🗄️ รวม 14 แม่แบบ SQL เขียน Repository ได้ทันที
│   ├── EXAM_CHEATSHEET.md                 # ⚡ สรุปสูตรลัดและ 8 กับดักข้อสอบที่ห้ามพลาด
│   ├── exam_spec_th.md                    # 📋 รายละเอียดข้อกำหนดข้อสอบ 100 คะแนนเต็ม
│   ├── HELP.md                            # 📖 เอกสาร Technical Reference & RFC
│   └── examples-by-question/              # 📖 คู่มือเจาะลึก 7 ข้อสอบพร้อมโค้ดแยกข้อ
│       ├── 01-identity-verification.md    # ข้อ 1: รหัสนักศึกษา & Static Info
│       ├── 02-get-all-pagination-dto.md   # ข้อ 2: ดึงข้อมูลทั้งหมด + Pagination + Summary DTO
│       ├── 03-get-by-id-and-404.md        # ข้อ 3: ดึงตาม ID + JOIN ตาราง + 404
│       ├── 04-post-create-and-validation.md# ข้อ 4: สร้างข้อมูล + ตรวจสอบ + 409 ซ้ำ
│       ├── 05-put-update-and-idempotence.md# ข้อ 5: อัปเดต PUT + เช็ค SKU ตัวเอง vs คนอื่น
│       ├── 06-delete-and-foreign-key.md   # ข้อ 6: ลบข้อมูล + 204 ไม่มี body + 409 FK
│       ├── 07-centralized-error-handling.md# ข้อ 7: Error Handler กลาง + MySQL Error Mapping
│       └── README.md                      # สารบัญคู่มือรายข้อ
│
├── 📂 src/                                # 💻 [โค้ดระบบหลัก Clean 3-Layer Architecture]
│   ├── src.zip                            # 📦 ไฟล์ Zip เฉพาะโค้ดโฟลเดอร์ src
│   ├── configs/
│   │   └── db-config.js                   # ตั้งค่า MySQL Connection Pool (mysql2/promise)
│   ├── repositories/                      # จัดการคำสั่ง SQL ดิบ (Pure SQL Queries)
│   │   ├── product-repo.js                # CRUD & Relationship JOIN ของสินค้า
│   │   └── brand-repo.js                  # Query รายการแบรนด์ & existsById
│   ├── services/                          # Business Logic, Existence Check, Uniqueness
│   │   ├── product-service.js             # ตรวจสอบกฎทางธุรกิจสินค้า & โยน Custom Error
│   │   └── brand-service.js               # ตรรกะของแบรนด์
│   ├── routes/                            # Controllers, HTTP Status Codes & Headers
│   │   ├── product-route.js               # GET, POST (201+Location), PUT, DELETE (204)
│   │   └── brand-route.js                 # GET /brands, 405 Method Not Allowed
│   ├── middlewares/                       # Validation, Transport & Error Handling
│   │   ├── validate-product.js            # ตรวจสอบชนิดข้อมูลเคร่งครัด & สแกนทศนิยมใน Integer
│   │   ├── transport-middleware.js        # ตรวจ Content-Type (415) & Accept (406)
│   │   └── error-handler.js               # Centralized Error Handler (400, 404, 409, 500)
│   └── app.js                             # จุดเริ่มต้น Express Server & Middleware Pipeline
│
├── 📂 database/                           # 🗄️ [ไฟล์จัดการฐานข้อมูล MySQL]
│   ├── database.zip                       # 📦 ไฟล์ Zip เฉพาะสคริปต์ฐานข้อมูล
│   ├── init_db.js                         # สคริปต์สร้าง/รีเซ็ต และ Seed ฐานข้อมูลอัตโนมัติ
│   └── schema.sql                         # โครงสร้างตาราง (DDL) และข้อมูลตั้งต้น (DML)
│
├── 📂 practices/                          # 📂 [โค้ดแบบฝึกหัดแล็บ อ้างอิงได้จริง]
│   ├── practices.zip                      # 📦 ไฟล์ Zip เฉพาะโค้ดแล็บ Practice 2 & 2.0
│   ├── Practice2/                         # แล็บ 5 ข้อบน classicmodels (Offices, Employees, Customers, Payments)
│   └── Practice2.0/                       # แล็บระบบแบ่งหน้า Pagination demo & Generic Repository
│
├── 📂 slides/                             # 📑 [สไลด์เลกเชอร์ INT161 ทั้ง 6 บท (PDF)]
│   ├── 02-INT161-HttpBasics.pdf
│   ├── 03-INT161-Introduction to REST API.pdf
│   ├── 04-INT161-db-conection.pdf
│   ├── 05-INT161-Express-Framework.pdf
│   ├── 06-INT161-Error Handling.pdf
│   └── 07-INT161-Pagination and DTO (1).pdf
│
└── 📂 templates/                          # 🎯 [เทมเพลตข้อสอบแบบมี Student ID Prefix]
    ├── templates.zip                      # 📦 ไฟล์ Zip เฉพาะโค้ดเทมเพลต Style A
    └── style-a-student-id-exam/
```

---

## 🎯 สรุปความแตกต่างของแต่ละโฟลเดอร์ (เปิดอ่านตรงนี้ ไม่สับสนแน่นอน!)

เพื่อไม่ให้เพื่อนๆ สับสนว่าไฟล์ไหนใช้ทำอะไร ขอสรุปวัตถุประสงค์และกรณีการใช้งานไว้ให้ชัดเจนดังนี้ครับ:

| โฟลเดอร์ | ใช้ฐานข้อมูล | วัตถุประสงค์หลัก | เมื่อไหร่ที่ต้องเปิดดูโฟลเดอร์นี้? |
|---|:---:|---|---|
| **`src/`** | `mobile_exam`<br>*(Products, Brands)* | **ระบบตัวอย่างข้อสอบจริงฉบับสมบูรณ์ (Reference หลัก)**<br>เขียนแบบ Clean 3-Layer (Route ➔ Service ➔ Repo ➔ DB) ครบเครื่องเรื่อง Middleware 415/406, Strict Type Validation, Centralized Error Handling, และ Location Header | 🌟 **เปิดดูเป็นหลักเวลาทำข้อสอบ!** ลอกโครงสร้างโฟลเดอร์, วิธีเขียน Service, วิธีเขียน Middleware ดักจับ Error และวิธีเขียน Router ให้ถูกมาตรฐาน HTTP RESTful API |
| **`practices/`** | `classicmodels`<br>*(Offices, Employees, Customers, Payments)* | **แบบฝึกหัดการบ้านในห้องเรียน (Lab Exercises)**<br>รวบรวม Practice 2 และ Practice 2.0 พร้อมคอมเมนต์ภาษาไทยอธิบายละเอียดยิบทุกบรรทัด | 📖 **เปิดดูเมื่อต้องการดูตัวอย่างโจทย์คล้ายในแล็บ** เช่น โจทย์ถามเกี่ยวกับพนักงาน ลูกค้า ยอดชำระเงิน หรือดูตัวอย่าง Pagination และ Generic Repository |
| **`templates/`** | ตามโจทย์กำหนด | **โครงเริ่มต้นข้อสอบสไตล์มีรหัสนักศึกษา (Starter Template)**<br>เตรียม Routing ที่มี URL Prefix นำหน้าด้วยรหัสนักศึกษา เช่น `/:studentId/api/...` | 🚀 **เปิดดูเมื่อข้อสอบกำหนดให้ใส่รหัสนักศึกษาใน URL** สามารถหยิบโครงนี้ไปต่อยอดเขียนได้ทันที ไม่ต้องเสียเวลาเซ็ตอัปเอง |
| **`docs/`** | - | **คลังคู่มือและสูตรโกงข้อสอบ (Cheatsheets)**<br>รวบรวม 14 แม่แบบ SQL Repository, 8 กับดักข้อสอบที่หักคะแนนบ่อย, และคู่มือเจาะลึก 7 ข้อสอบ | ⚡ **เปิดอ่านคู่ขนานตลอดการทำข้อสอบ** ก๊อปปี้สูตร SQL ไปแปะได้ทันที และเช็ค Checklist กันลืมจุดหักคะแนน |
| **`database/`** | `mobile_exam` | **สคริปต์สร้างและ Seed ฐานข้อมูล**<br>มีไฟล์ `init_db.js` และ `schema.sql` รันครั้งเดียวได้ DB พร้อมทดสอบทันที | 🗄️ **เปิดใช้เมื่อต้องการรีเซ็ตฐานข้อมูลเพื่อเริ่มรันเทสระบบใหม่** |
| **`slides/`** | - | **สไลด์เลกเชอร์อาจารย์ บทที่ 2 ถึง 7** (PDF ครบ 6 ไฟล์) | 📑 **เปิดค้นหาทฤษฎี นิยาม RFC หรือสิ่งที่อาจารย์เน้นย้ำในสไลด์** |

---

---

## 🛠️ วิธีการติดตั้งและรันระบบ (Quick Start)

### 1. ติดตั้ง Dependencies ที่จำเป็น
โปรเจกต์นี้ใช้เพียง 2 ไลบรารีหลักเท่านั้น:
```bash
npm init -y
npm install express mysql2
```
> [!TIP]
> อย่าลืมเพิ่ม `"type": "module"` ในไฟล์ `package.json` หากสร้างโปรเจกต์ใหม่ เพื่อให้รองรับไวยากรณ์ `import/export` ยุคใหม่

### 2. ตั้งค่าและเตรียมฐานข้อมูล MySQL
รันสคริปต์เพื่อสร้างฐานข้อมูล `mobile_exam` และนำเข้าข้อมูล Mock Data:
```bash
node database/init_db.js
```

### 3. รันเซิร์ฟเวอร์
```bash
node src/app.js
```
เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:8080` พร้อมรับคำขอทันที!

---

## 📚 สารบัญเอกสารสำหรับเปิดอ่านในห้องสอบ

| เอกสารคู่มือ | หัวข้อสำคัญ | ลิงก์ |
|---|---|:---:|
| **SQL Repository Cheat Sheet** | รวม 14 แม่แบบ SQL: CRUD, Pagination, COUNT, JOIN, Transaction และ Generic Template | [📖 เปิดอ่าน](docs/SQL_REPOSITORY_CHEATSHEET.md) |
| **Exam Cheat Sheet** | สรุปเทียบข้อสอบ Style 1 (Student ID) vs Style 2 (REST API) และ 8 กับดักคะแนน | [📖 เปิดอ่าน](docs/EXAM_CHEATSHEET.md) |
| **Question-by-Question Guide** | คู่มือเจาะลึก 7 ข้อของข้อสอบ อธิบายการทำงานทีละบรรทัด จุดตรวจ และตัวอย่างโค้ด | [📖 เปิดอ่าน](docs/examples-by-question/README.md) |
| **Exam Specification (Node.js)** | รายละเอียดโจทย์ข้อสอบฉบับเต็ม 100 คะแนน กฎ Data Type และ Error Response | [📖 เปิดอ่าน](docs/exam_spec_th.md) |
| **Technical Reference** | ข้อมูลอ้างอิงทางเทคนิค Express.js, MySQL2, และ RFC HTTP Status Codes | [📖 เปิดอ่าน](docs/HELP.md) |
