/**
 * ==============================================================================================
 * 📁 File: src/middlewares/validate-product.js
 * 🏷️ Layer: Middleware (ชั้นตรวจสอบความถูกต้องของข้อมูล - Request Validation Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Validator:
 * 1. ตรวจสอบความถูกต้องของ JSON Payload ที่ส่งเข้ามาในคำขอ POST /products และ PUT /products/:id
 * 2. คัดกรองและปฏิเสธข้อมูลแปลกปลอม (Unknown Field Rejection)
 * 3. ตรวจสอบชนิดข้อมูลอย่างเคร่งครัด (Strict Data Type Checking)
 * 4. ตรวจสอบและปฏิเสธเลขทศนิยมในฟิลด์ที่กำหนดให้เป็นจำนวนเต็ม (Integer Decimal Rejection)
 * 5. ทำความสะอาดข้อมูลสตริงด้วยการตัดช่องว่างหัวท้าย (Trimming) ยกเว้นฟิลด์ที่ห้ามตัด (description)
 * 6. ตรวจสอบขอบเขตค่าและเงื่อนไขระดับฟิลด์ (Field-level Validation เช่น ความยาว, ค่าสูงสุด-ต่ำสุด)
 * 
 * ----------------------------------------------------------------------------------------------
 * ⚖️ สองหมวดหมู่ของ Error Response ที่ต้องแยกให้ออกในข้อสอบ:
 * ----------------------------------------------------------------------------------------------
 * 🔴 หมวดที่ 1: INVALID_REQUEST (HTTP 400, fieldErrors เป็นอาเรย์ว่าง [])
 *    - เกิดขึ้นเมื่อโครงสร้าง Request ผิดพลาด, ชนิดข้อมูลผิด (Type Error), มีฟิลด์แปลกปลอม
 *    - ตัวอย่าง Response:
 *      {
 *        "status": 400,
 *        "code": "INVALID_REQUEST",
 *        "message": "price must be a number",
 *        "path": "/api/v1/products",
 *        "fieldErrors": []
 *      }
 * 
 * 🟡 หมวดที่ 2: VALIDATION_ERROR (HTTP 400, fieldErrors มีรายการข้อผิดพลาด)
 *    - เกิดขึ้นเมื่อชนิดข้อมูลถูกต้องแล้ว แต่ค่าไม่ตรงตามกฎทางธุรกิจ (เช่น สตริงสั้นเกินไป, ตัวเลขเกินช่วง)
 *    - ตัวอย่าง Response:
 *      {
 *        "status": 400,
 *        "code": "VALIDATION_ERROR",
 *        "message": "Invalid product data",
 *        "path": "/api/v1/products",
 *        "fieldErrors": [
 *          { "field": "sku", "message": "sku must be 3-30 characters and match [A-Z0-9-]+" }
 *        ]
 *      }
 * ==============================================================================================
 */

// ใช้ Set ในการเก็บรายชื่อฟิลด์ที่อนุญาต เพื่อให้ค้นหาได้รวดเร็วแบบ O(1)
const ALLOWED_FIELDS = new Set([
  'sku', 'name', 'brandId', 'price', 'stock', 'ramGb', 'storageGb', 'color', 'description', 'active'
]);

// กำหนดขนาด RAM ที่ถูกต้องตามข้อกำหนดของข้อสอบ
const VALID_RAM = new Set([2, 4, 6, 8, 12, 16, 24]);

// กำหนดขนาด Storage ที่ถูกต้องตามข้อกำหนดของข้อสอบ
const VALID_STORAGE = new Set([32, 64, 128, 256, 512, 1024]);

/**
 * Middleware ฟังก์ชันสำหรับ Validate ข้อมูล Product Body
 * 
 * @function validateProductBody
 * @param {Object} req - Express Request Object
 * @param {Object} res - Express Response Object
 * @param {Function} next - Express Next Function
 */
export function validateProductBody(req, res, next) {
  const path = req.originalUrl.split('?')[0];
  const body = req.body;

  // ----------------------------------------------------------------------------
  // ตรวจสอบขั้นต้น: Body ต้องเป็น JavaScript Object ธรรมดา
  // (ใน JS นั้น typeof null คือ 'object' และ typeof [] ก็คือ 'object' จึงต้องเช็คดักให้ครบ)
  // ----------------------------------------------------------------------------
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Body must be a JSON object',
      path: path,
      fieldErrors: []
    });
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 1: ตรวจจับฟิลด์แปลกปลอม (Unknown Field Check)
  // หาก Client ส่งคีย์แปลกปลอมเข้ามา เช่น "id": 100 หรือ "unknown": true
  // ----------------------------------------------------------------------------
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: `Unknown field: ${key}`,
        path: path,
        fieldErrors: []
      });
    }
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 2: ตรวจสอบชนิดข้อมูลเคร่งครัด (Strict Type Checking)
  // หากชนิดข้อมูลไม่ตรงตามกำหนด ให้ตอบกลับเป็น INVALID_REQUEST ทันที
  // ----------------------------------------------------------------------------

  // ตรวจสอบชนิดของฟิลด์ name (ต้องเป็น String)
  if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'name must be a string',
      path: path,
      fieldErrors: []
    });
  }

  // ตรวจสอบชนิดของฟิลด์ sku (ต้องเป็น String)
  if (body.sku !== undefined && body.sku !== null && typeof body.sku !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'sku must be a string',
      path: path,
      fieldErrors: []
    });
  }

  // ตรวจสอบชนิดของฟิลด์ color (ต้องเป็น String)
  if (body.color !== undefined && body.color !== null && typeof body.color !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'color must be a string',
      path: path,
      fieldErrors: []
    });
  }

  // ตรวจสอบชนิดของฟิลด์ description (ต้องเป็น String หรือ null)
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'description must be a string or null',
      path: path,
      fieldErrors: []
    });
  }

  // ตรวจสอบชนิดของฟิลด์ active (ต้องเป็น Boolean เท่านั้น ห้ามส่ง "true" หรือเลข 1 มาแทน)
  if (body.active !== undefined && body.active !== null && typeof body.active !== 'boolean') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'active must be a boolean',
      path: path,
      fieldErrors: []
    });
  }

  // ตรวจสอบชนิดของฟิลด์ price (ต้องเป็น Number ห้ามส่ง String ตัวเลข เช่น "100" หรือ NaN)
  if (body.price !== undefined && body.price !== null) {
    if (typeof body.price !== 'number' || isNaN(body.price)) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'price must be a number',
        path: path,
        fieldErrors: []
      });
    }
  }

  // ----------------------------------------------------------------------------
  // ตรวจสอบชนิดของฟิลด์จำนวนเต็ม (Integer): stock, ramGb, storageGb, brandId
  // ----------------------------------------------------------------------------
  const raw = req.rawBody || '';
  const intFields = ['stock', 'ramGb', 'storageGb', 'brandId'];

  for (const f of intFields) {
    if (body[f] !== undefined && body[f] !== null) {
      // 1. ตรวจสอบว่าไม่ใช่ตัวเลข หรือมีเศษทศนิยม (เช่น 1.5)
      if (typeof body[f] !== 'number' || !Number.isInteger(body[f])) {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: `${f} must be an integer`,
          path: path,
          fieldErrors: []
        });
      }

      // 2. ตรวจสอบในข้อความ JSON ดั้งเดิม (Raw Body) ว่ามีจุดทศนิยมหรือไม่ (เช่น "stock": 1.0)
      // เหตุผล: JavaScript จะแปลง 1.0 เป็น 1 ทำให้ Number.isInteger(1) ผ่าน จึงต้องดักด้วย Regex!
      const regex = new RegExp(`"${f}"\\s*:\\s*\\d+\\.\\d+`);
      if (regex.test(raw)) {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: `${f} must not have decimal places`,
          path: path,
          fieldErrors: []
        });
      }
    }
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของค่าในระดับฟิลด์ (Field-level Validation)
  // หากฟิลด์ใดไม่ผ่าน ให้รวบรวมข้อผิดพลาดใส่ในอาร์เรย์ fieldErrors
  // ----------------------------------------------------------------------------
  const fieldErrors = [];

  // 1. ตรวจสอบ SKU: จำเป็นต้องมี, 3-30 ตัวอักษร, ประกอบด้วย [A-Z0-9-] เท่านั้น
  if (body.sku === undefined || body.sku === null) {
    fieldErrors.push({ field: 'sku', message: 'sku is required' });
  } else {
    body.sku = body.sku.trim(); // ตัดช่องว่างหัวท้าย
    if (body.sku.length < 3 || body.sku.length > 30 || !/^[A-Z0-9-]+$/.test(body.sku)) {
      fieldErrors.push({ field: 'sku', message: 'sku must be 3-30 characters and match [A-Z0-9-]+' });
    }
  }

  // 2. ตรวจสอบ Name: จำเป็นต้องมี, 1-100 ตัวอักษร
  if (body.name === undefined || body.name === null) {
    fieldErrors.push({ field: 'name', message: 'name is required' });
  } else {
    body.name = body.name.trim(); // ตัดช่องว่างหัวท้าย
    if (body.name.length < 1 || body.name.length > 100) {
      fieldErrors.push({ field: 'name', message: 'name must be between 1 and 100 characters' });
    }
  }

  // 3. ตรวจสอบ Brand ID: จำเป็นต้องมี และต้องมีค่ามากกว่า 0
  if (body.brandId === undefined || body.brandId === null) {
    fieldErrors.push({ field: 'brandId', message: 'brandId is required' });
  } else if (body.brandId <= 0) {
    fieldErrors.push({ field: 'brandId', message: 'brandId must be greater than 0' });
  }

  // 4. ตรวจสอบ Price: จำเป็นต้องมี, อยู่ระหว่าง 0.01 ถึง 99,999,999.99, ทศนิยมไม่เกิน 2 ตำแหน่ง
  if (body.price === undefined || body.price === null) {
    fieldErrors.push({ field: 'price', message: 'price is required' });
  } else {
    if (body.price < 0.01 || body.price > 99999999.99) {
      fieldErrors.push({ field: 'price', message: 'price must be between 0.01 and 99999999.99' });
    } else {
      // ตรวจสอบจำนวนตำแหน่งจุดทศนิยม
      const parts = body.price.toString().split('.');
      if (parts[1] && parts[1].length > 2) {
        fieldErrors.push({ field: 'price', message: 'price must have at most 2 decimal places' });
      }
    }
  }

  // 5. ตรวจสอบ Stock: จำเป็นต้องมี, อยู่ระหว่าง 0 ถึง 100,000 ชิ้น
  if (body.stock === undefined || body.stock === null) {
    fieldErrors.push({ field: 'stock', message: 'stock is required' });
  } else if (body.stock < 0 || body.stock > 100000) {
    fieldErrors.push({ field: 'stock', message: 'stock must be between 0 and 100000' });
  }

  // 6. ตรวจสอบ RAM: จำเป็นต้องมี และต้องตรงกับค่าใน VALID_RAM (2, 4, 6, 8, 12, 16, 24)
  if (body.ramGb === undefined || body.ramGb === null) {
    fieldErrors.push({ field: 'ramGb', message: 'ramGb is required' });
  } else if (!VALID_RAM.has(body.ramGb)) {
    fieldErrors.push({ field: 'ramGb', message: 'ramGb must be 2, 4, 6, 8, 12, 16, or 24' });
  }

  // 7. ตรวจสอบ Storage: จำเป็นต้องมี และต้องตรงกับค่าใน VALID_STORAGE (32, 64, 128, 256, 512, 1024)
  if (body.storageGb === undefined || body.storageGb === null) {
    fieldErrors.push({ field: 'storageGb', message: 'storageGb is required' });
  } else if (!VALID_STORAGE.has(body.storageGb)) {
    fieldErrors.push({ field: 'storageGb', message: 'storageGb must be 32, 64, 128, 256, 512, or 1024' });
  }

  // 8. ตรวจสอบ Color: จำเป็นต้องมี, 1-40 ตัวอักษร
  if (body.color === undefined || body.color === null) {
    fieldErrors.push({ field: 'color', message: 'color is required' });
  } else {
    body.color = body.color.trim(); // ตัดช่องว่างหัวท้าย
    if (body.color.length < 1 || body.color.length > 40) {
      fieldErrors.push({ field: 'color', message: 'color must be between 1 and 40 characters' });
    }
  }

  // 9. ตรวจสอบ Description (Optional): ความยาวห้ามเกิน 500 ตัวอักษร
  // ⚠️ ข้อควรระวัง: ตามข้อกำหนดข้อสอบ ฟิลด์ description "ห้ามสั่ง trim()"
  if (body.description !== undefined && body.description !== null) {
    if (body.description.length > 500) {
      fieldErrors.push({ field: 'description', message: 'description must not exceed 500 characters' });
    }
  } else {
    body.description = null; // หากไม่ส่งมา ให้กำหนดเป็น null เพื่อเตรียมลง DB
  }

  // 10. ตรวจสอบ Active: จำเป็นต้องมีค่า boolean
  if (body.active === undefined || body.active === null) {
    fieldErrors.push({ field: 'active', message: 'active is required' });
  }

  // ----------------------------------------------------------------------------
  // หากพบ Field Error อย่างน้อย 1 ข้อ ให้ตอบกลับเป็น HTTP 400 VALIDATION_ERROR ทันที
  // ----------------------------------------------------------------------------
  if (fieldErrors.length > 0) {
    return res.status(400).json({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid product data',
      path: path,
      fieldErrors: fieldErrors
    });
  }

  // เมื่อผ่านทุกเงื่อนไข ให้ส่งต่อไปยัง Route Handler เพื่อทำงานต่อไป
  next();
}
