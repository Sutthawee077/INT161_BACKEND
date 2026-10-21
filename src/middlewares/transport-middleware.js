/**
 * ==============================================================================================
 * 📁 File: src/middlewares/transport-middleware.js
 * 🏷️ Layer: Middleware (ชั้นตรวจสอบโปรโตคอลและการรับส่งข้อมูล - Transport & Protocol Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Middleware ในไฟล์นี้:
 * 1. ตรวจสอบการเจรจารูปแบบข้อมูล (HTTP Content Negotiation):
 *    - Content-Type Header: ตรวจสอบชนิดข้อมูลที่ Client ส่งมา
 *    - Accept Header: ตรวจสอบชนิดข้อมูลที่ Client ยอมรับขากลับ
 * 2. จัดเก็บ `req.rawBody` ในรูปแบบ Raw Text String ดั้งเดิม ก่อนที่จะถูกแปลงเป็น JSON
 * 3. ตรวจจับข้อผิดพลาดในระดับ HTTP Payload:
 *    - Empty Body: คำขอที่ไม่มีเนื้อหา Body
 *    - Malformed JSON: คำขอที่ส่ง JSON พัง ผิดหลักไวยากรณ์ (Syntax Error)
 * 
 * ----------------------------------------------------------------------------------------------
 * ❓ ทำไมต้องตรวจ Content-Type (HTTP 415) และ Accept (HTTP 406)?
 * ----------------------------------------------------------------------------------------------
 * ตามมาตรฐาน RESTful API (RFC 7231):
 * - เมื่อ Client ส่งคำขอ POST/PUT ที่มีเนื้อหา แต่ระบุ Header เป็นอย่างอื่นที่ไม่ใช่ JSON
 *   (เช่น text/plain, application/xml) เซิร์ฟเวอร์ต้องตอบ **`HTTP 415 Unsupported Media Type`**
 * - เมื่อ Client ส่ง Accept Header ที่บอกว่าไม่ต้องการรับ JSON (เช่น Accept: text/html)
 *   ในขณะที่ API เราสร้างเฉพาะ JSON เซิร์ฟเวอร์ต้องตอบ **`HTTP 406 Not Acceptable`**
 * 
 * ----------------------------------------------------------------------------------------------
 * 🔍 ความลับของ `rawBodyParser` และการดักจับทศนิยมใน JavaScript (Decimal Bug):
 * ----------------------------------------------------------------------------------------------
 * - ในภาษา JavaScript คำสั่ง `JSON.parse('{"stock": 1.0}')` จะให้ผลลัพธ์เป็น `{ stock: 1 }`
 * - นั่นหมายความว่า JavaScript Engine ได้ตัดจุดทศนิยม `.0` ทิ้งไปแล้วโดยอัตโนมัติ!
 * - เมื่อเรานำไปตรวจสอบด้วย `Number.isInteger(1)` ก็จะได้ค่าเป็น `true` ทั้งที่ผู้ใช้ส่ง `1.0` มา!
 * - 💡 โค้ดในไฟล์นี้จึงอ่านข้อมูลทีละ Chunk จาก Node.js Readable Stream ด้วยตนเอง
 *   แล้วบันทึกเก็บไว้ใน `req.rawBody` เพื่อให้ตัวตรวจเช็คสามารถใช้ Regular Expression สแกนหา `1.0` ได้!
 * ==============================================================================================
 */

/**
 * Middleware สำหรับตรวจสอบ Transport Headers (Content-Type และ Accept)
 * 
 * @function transportValidator
 * @param {Object} req - Express Request Object
 * @param {Object} res - Express Response Object
 * @param {Function} next - Express Next Function สำหรับส่งต่อไปยัง Middleware ถัดไป
 */
export function transportValidator(req, res, next) {
  // ตัด Query String ออกจาก URL เพื่อให้ path ใน Error Response สอดคล้องกับมาตรฐาน (เช่น /api/v1/products)
  const path = req.originalUrl.split('?')[0];

  // ตรวจสอบเฉพาะ HTTP Method ที่มีการส่ง Body เข้ามา (POST และ PUT)
  if (req.method === 'POST' || req.method === 'PUT') {
    // --------------------------------------------------------------------------
    // 1. ตรวจสอบ Content-Type Header (ตอบ HTTP 415 หากไม่ตรง)
    // --------------------------------------------------------------------------
    const contentType = req.headers['content-type'];
    if (contentType && !contentType.toLowerCase().startsWith('application/json')) {
      return res.status(415).json({
        status: 415,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json',
        path: path,
        fieldErrors: []
      });
    }

    // --------------------------------------------------------------------------
    // 2. ตรวจสอบ Accept Header (ตอบ HTTP 406 หากไม่ยอมรับ JSON)
    // --------------------------------------------------------------------------
    const accept = req.headers['accept'];
    if (accept) {
      // ตรวจดูว่า Header มีคำว่า application/json, */* หรือ application/* อยู่หรือไม่
      const acceptsJson = accept.includes('application/json') || accept.includes('*/*') || accept.includes('application/*');
      
      // ถ้าไม่มีแปลว่า Client ปฏิเสธการรับ JSON
      if (!acceptsJson) {
        // แม้ว่าจะเกิด 406 แต่มาตรฐานการตรวจยังต้องการให้ Response ส่งกลับเป็น JSON
        res.set('Content-Type', 'application/json');
        return res.status(406).json({
          status: 406,
          code: 'NOT_ACCEPTABLE',
          message: 'Accept header must accept application/json',
          path: path,
          fieldErrors: []
        });
      }
    }
  }

  // หากผ่านเงื่อนไข ให้ส่งการทำงานไปยัง Middleware ตัวถัดไป
  next();
}

/**
 * Middleware สำหรับดักจับ Raw Body และแปลงเป็น JSON Object
 * 
 * @function rawBodyParser
 * @param {Object} req - Express Request Object
 * @param {Object} res - Express Response Object
 * @param {Function} next - Express Next Function
 */
export function rawBodyParser(req, res, next) {
  // หากเป็น Method ที่ไม่มี Payload ให้ผ่านไปทันที
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return next();
  }

  let data = '';
  // กำหนดการอ่าน Encoding เป็น UTF-8
  req.setEncoding('utf8');

  // Node.js Stream Event: เกิดขึ้นเมื่อมีก้อนข้อมูล (chunk) ถูกส่งเข้ามาทาง Socket
  req.on('data', chunk => {
    data += chunk;
  });

  // Node.js Stream Event: เกิดขึ้นเมื่อส่งข้อมูลมาครบทั้งหมดแล้ว
  req.on('end', () => {
    // 💡 บันทึกสตริงดั้งเดิมเก็บไว้ใน req.rawBody เพื่อใช้ในการตรวจ Regex ในภายหลัง
    req.rawBody = data;
    const path = req.originalUrl.split('?')[0];

    // ตรวจสอบกรณี Body ว่างเปล่า (Empty Body)
    if (!data || data.trim() === '') {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Empty request body',
        path: path,
        fieldErrors: []
      });
    }

    // ทำการแปลงข้อความสตริงให้เป็น JSON Object
    try {
      req.body = JSON.parse(data);
      next(); // แปลงสำเร็จ ส่งต่อไปยัง Router หรือ Validator
    } catch (e) {
      // ดักจับ SyntaxError เมื่อไวยากรณ์ JSON ผิดพลาด (เช่น ลืมปิดเครื่องหมายคำพูด หรือปีกกา)
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Malformed JSON',
        path: path,
        fieldErrors: []
      });
    }
  });
}
