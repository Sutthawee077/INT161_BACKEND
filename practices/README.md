# 📂 INT161 Lab Practices (แบบฝึกหัดแล็บพร้อมคำอธิบาย)

โฟลเดอร์นี้รวบรวมโค้ดแบบฝึกหัดแล็บของวิชา **INT161 Backend Development** บนฐานข้อมูล `classicmodels` พร้อมเขียน Comment อธิบายการทำงานทีละบรรทัดอย่างละเอียด

---

## 📦 ดาวน์โหลดเฉพาะไฟล์แล็บ (Download Practices ZIP)
👉 **[ดาวน์โหลด practices.zip](./practices.zip)** *(ขนาดเพียง 28 KB รวบรวม Practice 2 และ Practice 2.0 ครบทุกไฟล์)*

---

## 📑 รายละเอียดเนื้อหาในโฟลเดอร์นี้

### 1. `Practice2/` (แบบฝึกหัด CRUD & Exception Handling 5 ข้อหลัก)
- **ข้อที่ 1:** `GET /api/<STUDENT_ID>/offices/:officeCode` $\rightarrow$ จัดการ `404 Not Found` เมื่อไม่พบสำนักงาน
- **ข้อที่ 2:** `POST /api/<STUDENT_ID>/productlines` $\rightarrow$ จัดการ String Primary Key และ `409 Conflict` (Duplicate Key `1062`)
- **ข้อที่ 3:** `PUT /api/<STUDENT_ID>/employees/:employeeNumber` $\rightarrow$ ตรวจสอบอีเมล (400) และดักจับ Foreign Key Constraint `1452` (400)
- **ข้อที่ 4:** `DELETE /api/<STUDENT_ID>/customers/:customerNumber` $\rightarrow$ ลบข้อมูล และจัดการ Foreign Key Restrict `1451` (`409 Conflict`)
- **ข้อที่ 5:** `POST /api/<STUDENT_ID>/customers/:customerNumber/payments` $\rightarrow$ จัดการ Composite Primary Key คู่ `(customerNumber, checkNumber)`

### 2. `Practice2.0/` (แบบฝึกหัดระบบแบ่งหน้า Pagination & Generic Repository)
- **Endpoint:** `GET /test-pagination?page=1&limit=5` $\rightarrow$ สาธิตสูตรการคำนวณ `offset = (page - 1) * limit`
- **Generic Repository Template:** `src/repositories/product-repo.js` แม่แบบเขียน CRUD ด้วยตัวแปรส่วนกลาง `TABLE_NAME` และ `PRIMARY_KEY` พร้อมฟังก์ชัน `count()`
