# คู่มือเริ่มต้นใช้งาน (Node.js & Express.js Reference Guide) - INT161

โปรเจกต์นี้ได้รับการพัฒนาขึ้นด้วย **Node.js (JavaScript ES Modules)** ร่วมกับ **Express.js** และ **MySQL2** เพื่อใช้สำหรับการเรียนการสอนและการสอบปฏิบัติวิชา **INT161 Backend Development**

---

## 🚀 เริ่มต้นใช้งานโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าและเตรียมฐานข้อมูล MySQL
ตรวจสอบข้อมูลเชื่อมต่อฐานข้อมูลใน [`src/configs/db-config.js`](file:///c:/Users/LT-X13i03/Documents/INT161%20Backend/int261-sample-exam/src/configs/db-config.js) จากนั้นสั่งรันสคริปต์เพื่อสร้างตารางและใส่ข้อมูล Mock Data:
```bash
node init_db.js
```

### 3. รัน API Server
```bash
npm start
```
หรือหากต้องการรันแบบ Hot-Reload ในช่วงการพัฒนา:
```bash
npm run dev
```
เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:8080`

---

## 📚 เอกสารอ้างอิงทางเทคนิค (Technical References)

* [Node.js Documentation](https://nodejs.org/docs/latest/api/)
* [Express.js 4.x Guide](https://expressjs.com/en/guide/routing.html)
* [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
* [mysql2/promise Reference](https://github.com/sidorares/node-mysql2)
* [RFC 9110 HTTP Semantics & Status Codes](https://www.rfc-editor.org/rfc/rfc9110.html)
* [RESTful API Design Best Practices](https://restfulapi.net/)
