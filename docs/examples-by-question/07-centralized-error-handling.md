# ข้อที่ 7: [Centralized Error Handling] การจัดการ Error แบบรวมศูนย์ และ MySQL Error Mapping

---

## 🎯 1. สถานการณ์และโจทย์ตัวอย่าง (Exam Scenario)

ในการสอบวิชา Backend (INT161) อาจารย์จะให้ความสำคัญกับ **Robustness (ความทนทานของระบบ)** สูงมาก หากส่งข้อมูลผิดพลาดหรือเกิด Database Exception ตัว API Server **ต้องไม่ Crash (ไม่พัง ดับไป)** และต้องส่ง Response ที่มีโครงสร้าง JSON ชัดเจนกลับไปเสมอ

### เงื่อนไขที่มักพบในข้อสอบ:
1. **Consistent Error Response Format:**
   เมื่อมีข้อผิดพลาด Response Body จะต้องเป็น JSON ในรูปแบบมาตรฐานเดียวกันทั้งระบบ เช่น:
   ```json
   {
     "timestamp": "2026-10-21T13:30:00.000Z",
     "status": 404,
     "code": "NOT_FOUND",
     "message": "Product with ID 999 does not exist",
     "path": "/api/67130500001/products/999"
   }
   ```
2. **Auto MySQL Error Mapping:**
   ระบบต้องสามารถแปลง Database Error Code ของ MySQL ให้เป็น HTTP Status Code ที่ถูกต้องโดยอัตโนมัติ:
   - Duplicate Entry (`ER_DUP_ENTRY` / code `1062`): แปลงเป็น **`409 Conflict`**
   - Foreign Key Reference Not Found (`ER_NO_REFERENCED_ROW_2` / code `1452`): แปลงเป็น **`400 Bad Request`**
   - Foreign Key Row In Use (`ER_ROW_IS_REFERENCED_2` / code `1451`): แปลงเป็น **`409 Conflict`**
3. **Route Not Found (404 Fallback):**
   หาก Client เรียก URL ที่ไม่มีในระบบ Express ปกติจะตอบกลับเป็น HTML (`<pre>Cannot GET ...</pre>`) ซึ่งจะสอบตกข้อ Header Content-Type ทันที ต้องทำ Middleware ดักตอบเป็น **JSON 404** เสมอ
4. **Transport Negotiation (415 / 406):**
   - Client ยิง `POST`/`PUT` แต่ไม่ส่ง `Content-Type: application/json` $\rightarrow$ ส่ง **`415 Unsupported Media Type`**
   - Client ส่ง `Accept: text/html` หรืออะไรที่ไม่รองรับ `application/json` $\rightarrow$ ส่ง **`406 Not Acceptable`**

---

## 💻 2. โค้ดฉบับสมบูรณ์แยกตาม Layer

### 2.1 Custom Error Class (`src/errors/app-error.js`)
คลาสสำหรับให้ Service และ Route โยน Error พร้อมระบุ HTTP Status Code:
```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', fieldErrors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

---

### 2.2 Error Handling Middleware (`src/middlewares/error-handler.js`)
หัวใจสำคัญของระบบ Error Handling:
```javascript
export function errorHandler(err, req, res, next) {
  // ค่าเริ่มต้นสำหรับ Error ทั่วไป
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let fieldErrors = err.fieldErrors || null;

  // 1. ดักจับ SyntaxError จาก JSON.parse ของ Express (ส่ง JSON พังมา)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON_BODY';
    message = 'Malformed JSON payload in request body';
  }

  // 2. ดักจับ MySQL Database Error Codes
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'A resource with the specified unique field already exists';
        break;

      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        errorCode = 'INVALID_FOREIGN_KEY';
        message = 'Referenced entity does not exist';
        break;

      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        errorCode = 'RESOURCE_IN_USE';
        message = 'Cannot delete or update resource: it is currently referenced by other records';
        break;

      case 'ECONNREFUSED':
        statusCode = 503;
        errorCode = 'DATABASE_UNAVAILABLE';
        message = 'Cannot connect to database server';
        break;
    }
  }

  // 3. ประกอบ Response Body มาตรฐาน
  const responseBody = {
    timestamp: new Date().toISOString(),
    status: statusCode,
    code: errorCode,
    message: message,
    path: req.originalUrl || req.url
  };

  if (fieldErrors && fieldErrors.length > 0) {
    responseBody.fieldErrors = fieldErrors;
  }

  // 4. ส่งกลับหา Client
  res.status(statusCode).json(responseBody);
}
```

---

### 2.3 Not Found & Transport Middlewares (`src/middlewares/transport-middleware.js`)
```javascript
// ดักจับ URL ที่ไม่มีอยู่ในระบบ (404 Not Found)
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    timestamp: new Date().toISOString(),
    status: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl
  });
}

// ตรวจสอบ Content-Type (415) และ Accept Header (406)
export function transportSecurity(req, res, next) {
  // ตรวจสอบ Content-Type เมื่อมี Body (POST / PUT / PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      return res.status(415).json({
        timestamp: new Date().toISOString(),
        status: 415,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json',
        path: req.originalUrl
      });
    }
  }

  // ตรวจสอบ Accept Header
  const accept = req.headers['accept'];
  if (accept && accept !== '*/*' && !accept.includes('application/json')) {
    return res.status(406).json({
      timestamp: new Date().toISOString(),
      status: 406,
      code: 'NOT_ACCEPTABLE',
      message: 'Client must accept application/json',
      path: req.originalUrl
    });
  }

  next();
}
```

---

### 2.4 การเรียงลำดับ Middleware ใน `src/app.js` (สำคัญมากที่สุด!)
```javascript
import express from 'express';
import { transportSecurity, notFoundHandler } from './middlewares/transport-middleware.js';
import { errorHandler } from './middlewares/error-handler.js';
import productRouter from './routes/product-route.js';
import brandRouter from './routes/brand-route.js';

const app = express();

// 1. Body Parser
app.use(express.json());

// 2. Transport Header Negotiation
app.use(transportSecurity);

// 3. API Routers
app.use('/api/v1/products', productRouter);
app.use('/api/v1/brands', brandRouter);

// 4. 404 Handler (ต้องอยู่ "หลังสุดของ Routers" แต่ "ก่อน Error Handler")
app.use(notFoundHandler);

// 5. Centralized Error Handler (ต้องอยู่บรรทัด "สุดท้ายของทุก Middleware" เสมอ)
app.use(errorHandler);

export default app;
```

---

## 🔍 3. เจาะลึกอธิบายการทำงานทีละบรรทัด (Step-by-Step Code Walkthrough)

### 3.1 ทำไมต้องมี `(err, req, res, next)` ครบ 4 พารามิเตอร์?
```javascript
export function errorHandler(err, req, res, next) { ... }
```
- ใน Express นั้น ตัวแปร arguments ของฟังก์ชันมีผลต่อการระบุชนิด Middleware โดยตรง
- ฟังก์ชันธรรมดาจะมี 3 พารามิเตอร์: `(req, res, next)`
- เมื่อ Express เห็นว่าฟังก์ชันรับ **4 พารามิเตอร์** (`fn.length === 4`) Express จะลงทะเบียนฟังก์ชันนั้นเป็น **Error-handling middleware** ทันที
- ⚠️ **กฎเหล็ก:** ห้ามลบพารามิเตอร์ `next` ออก แม้ว่าจะไม่ได้เรียกใช้งานก็ตาม มิฉะนั้น Express จะมองเป็น Middleware ธรรมดา และ Error จะหลุดออกไปนอกระบบ

### 3.2 การส่งต่อ Error ด้วย `next(err)` ใน Service หรือ Route
เมื่อเกิดข้อผิดพลาดใน Controller:
```javascript
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err); // 👈 ส่ง Error ไปให้ centralized errorHandler ทันที
  }
});
```
- เมื่อเรียก `next(err)` โดยส่ง Object หรือ Error เข้าไป Express จะข้าม Middleware ทั่วไปทั้งหมดทันที และกระโดดตรงไปยัง `errorHandler` บรรทัดสุดท้ายเลย

### 3.3 การจับ MySQL Native Error Codes
```javascript
if (err.code) {
  switch (err.code) {
    case 'ER_DUP_ENTRY': // 1062
      statusCode = 409;
      break;
    case 'ER_NO_REFERENCED_ROW_2': // 1452
      statusCode = 400;
      break;
    case 'ER_ROW_IS_REFERENCED_2': // 1451
      statusCode = 409;
      break;
  }
}
```
- Driver `mysql2` จะแนบ property `err.code` และ `err.errno` มาให้กับ Error ทุกตัวที่เกิดจากฐานข้อมูล
- การจับตรงนี้จะช่วยลดความซ้ำซ้อน เพราะไม่ต้องเขียน `try...catch` เช็ค Error Code ซ้ำๆ ในทุก Service ให้เหนื่อย

---

## ⚠️ 4. จุดที่นักศึกษาตกม้าตายบ่อยที่สุด (Exam Traps & Pitfalls)

| อันดับ | ข้อผิดพลาดที่พบบ่อยมาก | ผลลัพธ์และวิธีแก้ไข |
|:---:|:---|:---|
| 🪤 1 | **วาง `app.use(errorHandler)` ไว้ก่อนหน้า Router** | **ผล:** ไม่ทำงานเลย เพราะ Express รัน Middleware ตามลำดับจากบนลงล่าง<br>**แก้:** ต้องเอา `app.use(errorHandler)` ไว้เป็นบรรทัดสุดท้ายก่อน `export default app;` เสมอ |
| 🪤 2 | **ลืมส่ง 4 Arguments ใน Error Handler** | **ผล:** เขียน `(err, req, res)` ทำให้ Express คิดว่าเป็น Request Handler ปกติ และเซิร์ฟเวอร์ Crash<br>**แก้:** ต้องเขียน `(err, req, res, next)` ครบ 4 ตัวเสมอ |
| 🪤 3 | **ลืมทำ 404 Route Not Found ให้เป็น JSON** | **ผล:** อาจารย์ยิงมาที่ URL ที่ไม่มี เช่น `GET /api/unknown`<br>Express ตอบ `<pre>Cannot GET /api/unknown</pre>` (HTML) โดนหักคะแนน Header<br>**แก้:** ใส่ `notFoundHandler` ดักไว้หลัง Routers ก่อน Error Handler |
| 🪤 4 | **ส่ง Header ซ้ำ (`ERR_HTTP_HEADERS_SENT`)** | **ผล:** เขียน `res.status(404).json(...)` แต่ลืม `return` ทำให้โค้ดด้านล่างทำงานต่อจนพัง<br>**แก้:** ใช้ `return res.status(...)` หรือส่งผ่าน `next(err)` |
| 🪤 5 | **Async Route ไม่มี Try...Catch** | **ผล:** เมื่อเกิดข้อผิดพลาดใน async function สัญญาณ Promise จะ reject โดยไม่มีใครรับ เซิร์ฟเวอร์จะค้างและ Client จะ Timeout<br>**แก้:** ต้องครอบ `try...catch` และส่ง `next(err)` เสมอ |

---

## 💡 สรุปขั้นตอนเตรียมพร้อมในห้องสอบ
1. สร้างโฟลเดอร์ `src/middlewares` และสร้างไฟล์ `error-handler.js`
2. ก๊อปปี้เทมเพลตโค้ดในหัวข้อ 2.1 - 2.3 ไปวาง
3. ตรวจสอบใน `app.js` ว่าวางลำดับถูกต้อง:
   - `express.json()`
   - `routes`
   - `notFoundHandler`
   - `errorHandler`
4. รันเทสด้วย Postman หรือชุดเทสของอาจารย์เพื่อยืนยันว่าไม่มี Error หลุดออกมาเป็น HTML หรือ Server Crash!
