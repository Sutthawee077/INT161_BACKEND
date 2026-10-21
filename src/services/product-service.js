/**
 * ==============================================================================================
 * 📁 File: src/services/product-service.js
 * 🏷️ Layer: Service (ชั้นตรรกะทางธุรกิจของสินค้า - Business Logic Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Service Layer ในโมดูลสินค้า:
 * 1. ตรวจสอบความถูกต้องของตรรกะทางธุรกิจ (Business Rules Validation)
 * 2. ตรวจสอบความสัมพันธ์ข้ามตาราง (Cross-entity Validation เช่น ตรวจว่า Brand มีอยู่จริงก่อนสร้าง Product)
 * 3. ตรวจสอบเงื่อนไขความไม่ซ้ำซ้อน (Uniqueness Validation เช่น ตรวจสอบ SKU ซ้ำ)
 * 4. จัดการลำดับขั้นตอนการตรวจสอบ (Precedence Order) ให้ถูกต้องตามเกณฑ์ข้อสอบ
 * 5. โยน Custom Error (พร้อม property status, code) เมื่อเงื่อนไขไม่ผ่าน เพื่อให้ Express Error Handler จัดการ
 * 
 * ----------------------------------------------------------------------------------------------
 * ⚠️ กับดักข้อสอบที่ห้ามพลาดเด็ดขาด (Critical Exam Traps):
 * ----------------------------------------------------------------------------------------------
 * 🪤 กับดักที่ 1: Filter ด้วย brandId ที่ไม่มีอยู่จริง (GET /products?brandId=999999)
 *    - หลายคนมักเขียนให้ query หา products ทันที ซึ่งจะได้อาร์เรย์ว่างเปล่า `[]` ตอบกลับไป
 *    - ❌ แต่โจทย์ข้อสอบกำหนดว่า: หาก brandId ไม่มีอยู่ในระบบ จะต้องตอบ **`HTTP 404 Not Found`**
 *    - 👉 วิธีแก้: ต้องใช้ `brandRepo.existsById(brandId)` เช็คก่อนเสมอ หาก false ให้ throw 404 ทันที!
 * 
 * 🪤 กับดักที่ 2: ลำดับการตรวจสอบในคำสั่ง POST (POST /products)
 *    - ลำดับที่ 1: เช็ค SKU ซ้ำก่อน $\rightarrow$ ถ้าซ้ำ ตอบ **`HTTP 409 Conflict`**
 *    - ลำดับที่ 2: เช็คว่า brandId มีอยู่จริงหรือไม่ $\rightarrow$ ถ้าไม่มี ตอบ **`HTTP 404 Not Found`**
 *    - ลำดับที่ 3: บันทึกลงฐานข้อมูล $\rightarrow$ ตอบ **`HTTP 201 Created`**
 * 
 * 🪤 กับดักที่ 3: กับดักมหาโหดของ PUT (PUT /products/:id)
 *    - ในคำสั่ง PUT ถ้า Client ส่ง SKU ค่าเดิมของสินค้านั้นกลับมา (ไม่ได้เปลี่ยน SKU)
 *      ระบบต้อง **"อนุญาตให้อัปเดตได้"** (200 OK) ห้ามไปฟ้องว่า SKU ซ้ำกับตัวเอง!
 *    - แต่ถ้า Client เปลี่ยน SKU เป็นค่าใหม่ แล้วค่านั้นไปซ้ำกับสินค้าตัวอื่นในระบบ $\rightarrow$ ต้องตอบ **`409 Conflict`**
 *    - 👉 วิธีแก้: ตรวจสอบเงื่อนไข `if (existing.sku !== data.sku)` ก่อนที่จะไปค้นหาว่า SKU ซ้ำหรือไม่!
 * ==============================================================================================
 */

import * as productRepo from '../repositories/product-repo.js';
import * as brandRepo from '../repositories/brand-repo.js';

/**
 * ดึงรายการสินค้าทั้งหมด หรือกรองตามแบรนด์ที่กำหนด (?brandId=...)
 * 
 * @async
 * @function getAllProducts
 * @param {number|null} brandId - รหัสแบรนด์ที่ต้องการกรอง (ถ้ามี)
 * @returns {Promise<Array<Object>>} รายการสินค้าทั้งหมดที่ตรงตามเงื่อนไข
 * @throws {Error} HTTP 404 BRAND_NOT_FOUND หากระบุ brandId แต่ไม่มีแบรนด์นั้นในระบบ
 */
export async function getAllProducts(brandId) {
  // ตรวจสอบว่ามีการส่ง brandId มาใน Query หรือไม่
  if (brandId !== null && brandId !== undefined) {
    // --------------------------------------------------------------------------
    // จุดสำคัญ: ต้องตรวจว่าแบรนด์นี้มีอยู่จริงในตาราง brands หรือไม่ก่อน
    // --------------------------------------------------------------------------
    const brandExists = await brandRepo.existsById(brandId);
    if (!brandExists) {
      const err = new Error(`Brand not found with id: ${brandId}`);
      err.status = 404;
      err.code = 'BRAND_NOT_FOUND';
      throw err; // โยน Error ออกไปเพื่อให้ Express Error Handler ตอบกลับเป็น JSON 404
    }

    // เมื่อพบแบรนด์อยู่จริง จึงดึงสินค้าเฉพาะของแบรนด์นี้
    return await productRepo.findByBrandId(brandId);
  }

  // หากไม่ได้ระบุ brandId ให้ดึงรายการสินค้าทั้งหมดในระบบ
  return await productRepo.findAll();
}

/**
 * ดึงข้อมูลสินค้าเดี่ยวตามรหัส ID
 * 
 * @async
 * @function getProductById
 * @param {number|string} id - รหัส ID ของสินค้า
 * @returns {Promise<Object>} ข้อมูลสินค้า
 * @throws {Error} HTTP 404 PRODUCT_NOT_FOUND หากไม่พบสินค้า
 */
export async function getProductById(id) {
  const product = await productRepo.findById(id);
  
  // หากผลลัพธ์เป็น null แสดงว่าไม่พบสินค้ารหัสนี้ในฐานข้อมูล
  if (!product) {
    const err = new Error(`Product not found with id: ${id}`);
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  return product;
}

/**
 * สร้างสินค้าใหม่ในระบบ
 * 
 * @async
 * @function createProduct
 * @param {Object} data - ข้อมูลสินค้าที่ผ่านการ Validate จาก Middleware เรียบร้อยแล้ว
 * @returns {Promise<Object>} ข้อมูลสินค้าที่เพิ่งถูกสร้างขึ้นมา
 * @throws {Error} HTTP 409 DUPLICATE_SKU หาก SKU ซ้ำกับที่มีอยู่แล้ว
 * @throws {Error} HTTP 404 BRAND_NOT_FOUND หาก brandId ที่อ้างถึงไม่มีอยู่จริง
 */
export async function createProduct(data) {
  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 1: ตรวจสอบความซ้ำซ้อนของ SKU (Uniqueness Check)
  // ----------------------------------------------------------------------------
  const existingSku = await productRepo.findBySku(data.sku);
  if (existingSku) {
    const err = new Error(`SKU already exists: ${data.sku}`);
    err.status = 409; // 409 Conflict ตามมาตรฐาน RESTful
    err.code = 'DUPLICATE_SKU';
    throw err;
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 2: ตรวจสอบว่าแบรนด์ที่ต้องการผูกด้วยมีอยู่จริงหรือไม่ (Foreign Key Validation)
  // ----------------------------------------------------------------------------
  const brandExists = await brandRepo.existsById(data.brandId);
  if (!brandExists) {
    const err = new Error(`Brand not found with id: ${data.brandId}`);
    err.status = 404; // 404 Not Found
    err.code = 'BRAND_NOT_FOUND';
    throw err;
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 3: เรียก Repository เพื่อ INSERT ข้อมูลลงฐานข้อมูล
  // ----------------------------------------------------------------------------
  return await productRepo.create(data);
}

/**
 * อัปเดตข้อมูลสินค้าเดิมตาม ID (แบบ Full Replacement - PUT Method)
 * 
 * @async
 * @function updateProduct
 * @param {number|string} id - รหัสสินค้าที่ต้องการอัปเดต
 * @param {Object} data - ข้อมูลสินค้าชุดใหม่ทั้งหมด
 * @returns {Promise<Object>} ข้อมูลสินค้าหลังการอัปเดต
 * @throws {Error} HTTP 404 PRODUCT_NOT_FOUND หากไม่พบสินค้าตาม ID ที่ระบุ
 * @throws {Error} HTTP 404 BRAND_NOT_FOUND หาก brandId ที่ระบุใหม่ไม่มีอยู่จริง
 * @throws {Error} HTTP 409 DUPLICATE_SKU หากเปลี่ยน SKU ไปซ้ำกับสินค้าตัวอื่น
 */
export async function updateProduct(id, data) {
  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 1: ตรวจสอบว่าสินค้าตัวที่จะอัปเดตมีตัวตนอยู่จริงหรือไม่
  // ----------------------------------------------------------------------------
  const existing = await productRepo.findById(id);
  if (!existing) {
    const err = new Error(`Product not found with id: ${id}`);
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 2: ตรวจสอบว่าแบรนด์ใหม่ที่ระบุมีอยู่จริงหรือไม่
  // ----------------------------------------------------------------------------
  const brandExists = await brandRepo.existsById(data.brandId);
  if (!brandExists) {
    const err = new Error(`Brand not found with id: ${data.brandId}`);
    err.status = 404;
    err.code = 'BRAND_NOT_FOUND';
    throw err;
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 3: ตรวจสอบ SKU ซ้ำ (ระวังกับดัก: ตรวจเฉพาะเมื่อเปลี่ยน SKU ใหม่เท่านั้น!)
  // ----------------------------------------------------------------------------
  if (existing.sku !== data.sku) {
    // ถ้าผู้ใช้เปลี่ยน SKU ให้ไปค้นหาว่ามีสินค้าตัวอื่นใช้ SKU นี้ไปแล้วหรือยัง
    const other = await productRepo.findBySku(data.sku);
    if (other) {
      const err = new Error(`SKU already exists: ${data.sku}`);
      err.status = 409;
      err.code = 'DUPLICATE_SKU';
      throw err;
    }
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 4: อัปเดตข้อมูลลงฐานข้อมูลผ่าน Repository
  // ----------------------------------------------------------------------------
  return await productRepo.update(id, data);
}

/**
 * ลบสินค้าออกจากระบบตามรหัส ID
 * 
 * @async
 * @function deleteProduct
 * @param {number|string} id - รหัสสินค้าที่ต้องการลบ
 * @throws {Error} HTTP 404 PRODUCT_NOT_FOUND หากไม่พบสินค้า
 */
export async function deleteProduct(id) {
  // 1. ตรวจสอบความมีอยู่ของสินค้าก่อนสั่งลบ
  const existing = await productRepo.findById(id);
  if (!existing) {
    // หากไม่พบ ให้ตอบ 404 เพื่อให้สอดคล้องกับกรณีลบซ้ำเป็นครั้งที่ 2 (Repeated Delete)
    const err = new Error(`Product not found with id: ${id}`);
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  // 2. สั่งลบข้อมูลออกจากฐานข้อมูลจริง
  await productRepo.remove(id);
}
