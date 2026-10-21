# 🧪 คู่มือการใช้งานชุดทดสอบ API ในห้องสอบ (API Testing Guide)

คลังชุดทดสอบที่เตรียมไว้ให้เพื่อช่วยประหยัดเวลาในห้องสอบ ไม่ต้องเสียเวลากรอก Method, URL, Headers หรือ JSON Body เองทีละตัวใน Postman สามารถกดยิงเทสเพื่อตรวจเช็คโค้ดของตัวเองได้ในคลิกเดียว!

---

## 🎯 มีชุดทดสอบให้เลือกใช้ 2 รูปแบบ

| รูปแบบ | ไฟล์ที่ใช้ | เหมาะสำหรับ | วิธีใช้งานด่วน |
|---|---|---|---|
| **แบบที่ 1 (แนะนำที่สุด): VS Code REST Client** | [`requests.http`](./requests.http) | คนที่ชอบทำทุกอย่างใน VS Code ไม่ต้องสลับหน้าต่าง | ติดตั้ง Extension **REST Client** แล้วเปิดไฟล์ กดยิงคำว่า `Send Request` เหนือแต่ละข้อได้ทันที |
| **แบบที่ 2: Postman Collection** | [`exam_test.postman_collection.json`](./exam_test.postman_collection.json) | คนที่ถนัดใช้โปรแกรม Postman | เปิด Postman แล้วกดปุ่ม **Import** เลือกไฟล์นี้ จะได้ Collection พร้อมยิงทันที |

---

## 🚀 วิธีใช้งานแบบที่ 1: VS Code REST Client (เร็วที่สุด)

1. ใน VS Code ไปที่เมนู Extensions (`Ctrl + Shift + X`)
2. ค้นหาคำว่า **"REST Client"** (โดย Huachao Mao) แล้วกด **Install**
3. เปิดไฟล์ [`docs/requests.http`](./requests.http)
4. คุณจะเห็นปุ่มข้อความเล็กๆ สีเทาเขียนว่า `Send Request` ลอยอยู่เหนือ URL แต่ละบรรทัด
5. เพียงแค่คลิก `Send Request` ผลลัพธ์ (Response Status, Headers, Body) จะแสดงขึ้นมาทางหน้าต่างด้านขวามือทันที!

> [!TIP]
> ตัวแปร `@baseUrl` ด้านบนสุดของไฟล์ถูกตั้งค่าไว้ที่ `http://localhost:8080/api/v1` หากคุณเปลี่ยนพอร์ตเซิร์ฟเวอร์ ให้แก้เลขพอร์ตที่บรรทัดบนสุดเพียงจุดเดียว จะมีผลกับทุก Request ทันที

---

## 📬 วิธีใช้งานแบบที่ 2: Postman Collection

1. เปิดโปรแกรม **Postman**
2. กดปุ่ม **Import** ที่มุมบนซ้ายของโปรแกรม
3. ลากไฟล์ [`docs/exam_test.postman_collection.json`](./exam_test.postman_collection.json) เข้าไปวาง หรือกดเลือกไฟล์
4. คุณจะได้ Collection ชื่อว่า **`INT161 Backend Exam Test Collection`**
5. ภายในถูกจัดหมวดหมู่แยกตามหัวข้อข้อสอบไว้เรียบร้อยแล้ว:
   - 📂 `1. Brands`
   - 📂 `2. Products - List & Filter`
   - 📂 `3. Products - Get by ID & Traps`
   - 📂 `4. Products - Create & Validation`
   - 📂 `5. Products - Update PUT`
   - 📂 `6. Products - Delete`
   - 📂 `7. Content Negotiation (415 & 406)`

---

## 📋 รายการเคสทดสอบทั้งหมด 18 รายการ (Test Cases Coverage)

| หมวดหมู่ | Method & Endpoint | สถานะที่คาดหวัง | สิ่งที่ทำการตรวจสอบ |
|---|---|:---:|---|
| **Brands** | `GET /brands` | `200 OK` | ดึงรายชื่อแบรนด์ทั้งหมด |
| **Brands** | `POST /brands` | `405 Method Not Allowed` | ป้องกันไม่ให้แก้ไขข้อมูล Master Data |
| **Products List** | `GET /products` | `200 OK` | ดึงรายการสินค้าทั้งหมด |
| **Products Filter**| `GET /products?brandId=1` | `200 OK` | กรองสินค้าเฉพาะ Apple |
| **Products Filter**| `GET /products?brandId=999` | `200 OK` | กรองแบรนด์ที่ไม่มีสินค้า (ต้องตอบอาเรย์ว่าง `[]`) |
| **Get by ID** | `GET /products/1` | `200 OK` | ดึงข้อมูลสินค้าชิ้นที่ 1 |
| **Get by ID** | `GET /products/99999` | `404 Not Found` | สินค้าที่ไม่มีในระบบ |
| **Get by ID Trap**| `GET /products/abc` | `400 Bad Request` | ดักจับ ID ที่ไม่ใช่ตัวเลขจำนวนเต็ม |
| **Get by ID Trap**| `GET /products/1?sort=name` | `400 Bad Request` | ดักจับ Query String ปนมาที่ ID Endpoint |
| **Create** | `POST /products` | `201 Created` | มี Header `Location: /api/v1/products/:id` |
| **Create Trap** | `POST /products` (SKU ซ้ำ) | `409 Conflict` | ตรวจสอบรหัส SKU ซ้ำในระบบ |
| **Create Trap** | `POST /products` (stock 10.5)| `400 Bad Request` | ดักจับทศนิยมในฟิลด์ที่เป็น Integer |
| **Create Trap** | `POST /products` (มีฟิลด์แปลก) | `400 Bad Request` | ปฏิเสธ Unknown Fields |
| **Update PUT** | `PUT /products/1` | `200 OK` | อัปเดตข้อมูลสินค้าแทนที่เดิมสำเร็จ |
| **Update PUT** | `PUT /products/99999` | `404 Not Found` | อัปเดตสินค้าที่ไม่มีอยู่จริง |
| **Delete** | `DELETE /products/4` | `204 No Content` | ลบสำเร็จและ**ต้องไม่มี Response Body** |
| **Delete Trap** | `DELETE /products/4` (ซ้ำ) | `404 Not Found` | ลบซ้ำรายการเดิมที่เพิ่งลบไป |
| **Negotiation** | `GET /products` (`Accept: text/html`)| `406 Not Acceptable`| ปฏิเสธ Client ที่ไม่ยอมรับ JSON |
| **Negotiation** | `POST /products` (`Content-Type: text/plain`)| `415 Unsupported Media Type` | ปฏิเสธ Payload ที่ไม่ใช่ JSON |
