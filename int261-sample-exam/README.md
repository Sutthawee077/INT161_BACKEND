# 📱 Sample Exam Project: Mobile Store RESTful API

โปรเจกต์ตัวอย่างข้อสอบปฏิบัติวิชา **INT161 Backend Development** พัฒนาด้วย **Node.js (Express.js, ES Modules) + MySQL (`mysql2/promise`)** ภายใต้สถาปัตยกรรม **Clean 3-Layer Architecture** ครบถ้วนทุกข้อกำหนดตามเกณฑ์การให้คะแนน

---

## 📦 ดาวน์โหลดเฉพาะโค้ดโปรเจกต์นี้ (Download ZIP)
👉 **[ดาวน์โหลด int261-sample-exam.zip](./int261-sample-exam.zip)** *(ขนาดเพียง 29 KB มีโค้ด 3-Layer ครบทุกเลเยอร์)*

---

## 🏗️ โครงสร้างเลเยอร์ในโปรเจกต์ (`src/`)

```
int261-sample-exam/
├── int261-sample-exam.zip     # 📦 ไฟล์ Zip เฉพาะโค้ดชุดนี้
├── README.md                  # 📖 เอกสารสรุปโปรเจกต์
└── src/                       # 💻 โค้ดระบบหลัก
    ├── configs/
    │   └── db-config.js       # MySQL Connection Pool (mysql2/promise)
    ├── repositories/          # Pure SQL Queries (SELECT, INSERT, UPDATE, DELETE)
    │   ├── brand-repo.js
    │   └── product-repo.js
    ├── services/              # Business Logic, Existence checks, Uniqueness
    │   ├── brand-service.js
    │   └── product-service.js
    ├── routes/                # Controllers, HTTP Status Codes & Headers
    │   ├── brand-route.js
    │   └── product-route.js
    ├── middlewares/           # Validation, Transport (415/406) & Error Handling
    │   ├── error-handler.js
    │   ├── transport-middleware.js
    │   └── validate-product.js
    └── app.js                 # จุดเริ่มต้นเซิร์ฟเวอร์ & Middleware Pipeline
```

---

## 🚀 วิธีการรันโปรเจกต์

1. **เตรียมฐานข้อมูล:**
   ```bash
   node ../database/init_db.js
   ```
2. **รันเซิร์ฟเวอร์:**
   ```bash
   node src/app.js
   ```
   *(เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:8080/api/v1`)*
