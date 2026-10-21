/**
 * ==============================================================================================
 * 📁 File: src/routes/product-route.js
 * 🏷️ Layer: Route / Controller (ชั้นควบคุมเส้นทางสินค้า - Product Controller Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Product Route:
 * 1. รับ HTTP Requests สำหรับการทำ CRUD ข้อมูลสินค้าทั้งหมด:
 *    - GET /api/v1/products (ดึงทั้งหมด หรือกรองตาม brandId)
 *    - GET /api/v1/products/:id (ดึงข้อมูลเดี่ยวตาม ID)
 *    - POST /api/v1/products (สร้างสินค้าใหม่)
 *    - PUT /api/v1/products/:id (แก้ไขสินค้าเดิมแบบแทนที่ทั้งหมด)
 *    - DELETE /api/v1/products/:id (ลบสินค้าออกจากระบบ)
 * 2. ตรวจสอบความถูกต้องของ Path Parameters (:id) และ Query Parameters (?brandId=)
 * 3. ควบคุม HTTP Status Code และ Response Headers ให้ตรงตาม RFC มาตรฐาน REST:
 *    - POST สำเร็จ: **HTTP 201 Created** พร้อม Header `Location: /api/v1/products/:id`
 *    - DELETE สำเร็จ: **HTTP 204 No Content** และ**ต้องไม่มี Response Body เด็ดขาด**
 * 4. ส่งต่อ Error ไปยัง Centralized Error Handler ด้วย `next(err)`
 * ==============================================================================================
 */

import express from 'express';
import * as productService from '../services/product-service.js';
import { validateProductBody } from '../middlewares/validate-product.js';

const router = express.Router();

/**
 * ฟังก์ชันช่วยตรวจสอบและแปลงรหัส ID จาก Path Parameter
 * 
 * 💡 สิ่งที่ข้อสอบและชุดเทสตรวจสอบอย่างเข้มงวด:
 * 1. ห้ามมี Query String แนบมาที่ Endpoint แบบเจาะจง ID
 *    เช่น `/products/1?sort=name` $\rightarrow$ ต้องตอบ **HTTP 400 INVALID_REQUEST**
 * 2. ตรวจสอบรูปแบบ ID:
 *    - ต้องเป็นตัวเลขจำนวนเต็มบวกเท่านั้น (`/^\d+$/`)
 *    - ปฏิเสธตัวอักษร เช่น `/products/abc` $\rightarrow$ 400
 *    - ปฏิเสธตัวเลขติดลบ เช่น `/products/-1` $\rightarrow$ 400
 *    - ปฏิเสธทศนิยม เช่น `/products/1.0` $\rightarrow$ 400
 * 3. ป้องกันปัญหา Integer Overflow (64-bit Signed Integer Range):
 *    - JavaScript Number มีขีดจำกัดความปลอดภัยอยู่ที่ $2^{53} - 1$ (9,007,199,254,740,991)
 *    - แต่คอลัมน์ BIGINT ใน MySQL รองรับได้ถึง $2^{63} - 1$ (9,223,372,036,854,775,807)
 *    - หากส่งตัวเลขขนาดมหึมาเกิน 64-bit เช่น `9223372036854775808`
 *      การใช้ `BigInt()` จะช่วยดักจับ Overflow ได้อย่างแม่นยำและตอบ 400 ทันที!
 * 
 * @function parseAndValidateId
 * @param {string} rawId - ค่า ID ดั้งเดิมจาก req.params.id
 * @param {Object} req - Express Request Object
 * @returns {number} ID ที่ผ่านการตรวจสอบความถูกต้องแล้ว
 */
function parseAndValidateId(rawId, req) {
  // 1. ตรวจสอบว่ามี Query String ปนมาที่ ID Endpoint หรือไม่
  const url = new URL(req.originalUrl, 'http://localhost');
  if (url.search !== '') {
    const err = new Error('Query parameters are not allowed on this endpoint');
    err.status = 400;
    err.code = 'INVALID_REQUEST';
    throw err;
  }

  // 2. ตรวจสอบว่าเป็นตัวเลขโดดๆ (Digits Only) หรือไม่
  if (!/^\d+$/.test(rawId)) {
    const err = new Error('Invalid ID format');
    err.status = 400;
    err.code = 'INVALID_REQUEST';
    throw err;
  }

  // 3. ตรวจสอบช่วงค่า 64-bit Integer Overflow และค่ามากกว่า 0
  try {
    const big = BigInt(rawId);
    // ค่า ID ใน Database ต้องมากกว่า 0 (big > 0n) และไม่เกินขีดจำกัดสูงสุดของ BIGINT
    if (big <= 0n || big > 9223372036854775807n) {
      const err = new Error('ID must be a positive integer within valid range');
      err.status = 400;
      err.code = 'INVALID_REQUEST';
      throw err;
    }
    return Number(big);
  } catch (e) {
    const err = new Error('ID overflow');
    err.status = 400;
    err.code = 'INVALID_REQUEST';
    throw err;
  }
}

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [GET] /api/v1/products
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: ดึงรายการสินค้าทั้งหมด หรือกรองตาม brandId (?brandId=...)
 * 
 * 💡 สิ่งที่ข้อสอบตรวจสอบ:
 * 1. ตรวจสอบ Parameter แปลกปลอม: ไม่อนุญาต Query อื่นนอกจาก `brandId` (เช่น ?sort=name $\rightarrow$ ตอบ 400)
 * 2. ตรวจสอบการส่งซ้ำ: ห้ามส่ง brandId ซ้ำหลายตัว (เช่น ?brandId=1&brandId=2 $\rightarrow$ ตอบ 400)
 * 3. ตรวจสอบค่า brandId: ต้องเป็นตัวเลขจำนวนเต็มบวก > 0
 */
router.get('/', async (req, res, next) => {
  try {
    const url = new URL(req.originalUrl, 'http://localhost');
    const params = url.searchParams;

    // 1. ตรวจหา Query Parameter ที่ไม่อนุญาต
    for (const key of params.keys()) {
      if (key !== 'brandId') {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: `Unknown query parameter: ${key}`,
          path: req.originalUrl.split('?')[0],
          fieldErrors: []
        });
      }
    }

    let brandId = null;
    if (params.has('brandId')) {
      // 2. ตรวจสอบว่าส่ง brandId ซ้ำซ้อนกันหรือไม่
      const allBrandIds = params.getAll('brandId');
      if (allBrandIds.length > 1) {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: 'Multiple brandId query parameters provided',
          path: req.originalUrl.split('?')[0],
          fieldErrors: []
        });
      }

      // 3. ตรวจสอบความถูกต้องของค่า brandId
      const val = params.get('brandId');
      if (!val || !/^\d+$/.test(val)) {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: 'Invalid brandId parameter',
          path: req.originalUrl.split('?')[0],
          fieldErrors: []
        });
      }

      // 4. ตรวจสอบขอบเขตตัวเลขของ brandId
      try {
        const big = BigInt(val);
        if (big <= 0n || big > 9223372036854775807n) {
          return res.status(400).json({
            status: 400,
            code: 'INVALID_REQUEST',
            message: 'brandId must be greater than 0',
            path: req.originalUrl.split('?')[0],
            fieldErrors: []
          });
        }
        brandId = Number(big);
      } catch (e) {
        return res.status(400).json({
          status: 400,
          code: 'INVALID_REQUEST',
          message: 'brandId overflow',
          path: req.originalUrl.split('?')[0],
          fieldErrors: []
        });
      }
    }

    // เรียกใช้งาน Product Service เพื่อดึงข้อมูลสินค้า
    const products = await productService.getAllProducts(brandId);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [GET] /api/v1/products/:id
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: ดึงข้อมูลสินค้าเดี่ยวตาม ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseAndValidateId(req.params.id, req);
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [POST] /api/v1/products
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: สร้างสินค้าใหม่ลงในระบบ
 * 
 * 💡 สิ่งที่ข้อสอบตรวจสอบ:
 * 1. ผ่าน Middleware `validateProductBody` เพื่อตรวจสอบชนิดข้อมูลและเงื่อนไขทั้งหมด
 * 2. ไม่อนุญาตให้มี Query Parameter ใดๆ ในการยิง POST
 * 3. ตอบกลับด้วย **HTTP Status 201 Created**
 * 4. ต้องแนบ Response Header **Location: /api/v1/products/:id** กลับไปด้วยเสมอ
 */
router.post('/', validateProductBody, async (req, res, next) => {
  try {
    // ตรวจสอบ Query String ในคำขอ POST
    const url = new URL(req.originalUrl, 'http://localhost');
    if (url.search !== '') {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Query parameters are not allowed on POST /products',
        path: req.originalUrl.split('?')[0],
        fieldErrors: []
      });
    }

    // เรียก Service เพื่อทำการบันทึกข้อมูลสินค้า
    const created = await productService.createProduct(req.body);

    // 💡 ตั้งค่า Response Header "Location" ตามมาตรฐาน RESTful (RFC 7231)
    res.set('Location', `/api/v1/products/${created.id}`);

    // คืนค่า HTTP 201 Created พร้อมออบเจกต์ข้อมูลสินค้าที่เพิ่งสร้าง
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [PUT] /api/v1/products/:id
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: แก้ไขข้อมูลสินค้าเดิมแบบแทนที่ทั้งหมด (Full Replacement)
 */
router.put('/:id', validateProductBody, async (req, res, next) => {
  try {
    const id = parseAndValidateId(req.params.id, req);
    const updated = await productService.updateProduct(id, req.body);
    res.json(updated); // ตอบกลับด้วย HTTP 200 OK
  } catch (err) {
    next(err);
  }
});

/**
 * ----------------------------------------------------------------------------------------------
 * 📌 [DELETE] /api/v1/products/:id
 * ----------------------------------------------------------------------------------------------
 * วัตถุประสงค์: ลบสินค้าออกจากระบบ
 * 
 * 💡 จุดตรวจข้อสอบที่นักศึกษาตกม้าตายบ่อยที่สุด:
 * 1. เมื่อลบสำเร็จ ต้องคืนค่า **HTTP 204 No Content**
 * 2. **ต้องไม่มี Response Body เด็ดขาด!** (ห้ามเผลอใส่ .json(...) หรือข้อความใดๆ)
 *    👉 ใช้คำสั่ง `res.status(204).end();` เท่านั้น
 * 3. หากเรียกซ้ำเป็นครั้งที่ 2 ด้วย ID เดิม จะต้องตอบกลับเป็น **HTTP 404 Not Found**
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseAndValidateId(req.params.id, req);
    await productService.deleteProduct(id);
    
    // คืนสถานะ 204 No Content พร้อมตัดจบการส่งข้อมูลทันทีโดยไม่มี Body
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
