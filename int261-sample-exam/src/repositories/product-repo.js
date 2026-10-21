/**
 * ==============================================================================================
 * 📁 File: src/repositories/product-repo.js
 * 🏷️ Layer: Repository (ชั้นการเข้าถึงฐานข้อมูลสินค้า - Data Access Layer)
 * ==============================================================================================
 * 
 * 📖 หน้าที่และความรับผิดชอบของ Repository Layer ในโมดูลสินค้า:
 * 1. รันคำสั่ง SQL สำหรับ CRUD (Create, Read, Update, Delete) บนตาราง 'products'
 * 2. ทำการ INNER JOIN กับตาราง 'brands' เพื่อดึงชื่อแบรนด์ (brand_name) ใน Query เดียว 
 *    (แก้ปัญหา N+1 Query Problem ที่ทำให้ฐานข้อมูลทำงานช้าและกินทรัพยากร)
 * 3. แปลงรูปแบบชื่อฟิลด์จาก Snake Case ของ MySQL (เช่น brand_id, ram_gb, storage_gb)
 *    ไปเป็น Camel Case ของ JavaScript Object (เช่น brandId, ramGb, storageGb)
 * 4. จัดกลุ่ม (Nest) ข้อมูลของแบรนด์ให้อยู่ในรูป Object ซ้อน: `brand: { id, name }`
 *    ตามข้อกำหนดมาตรฐาน JSON Response ของวิชา INT161
 * 
 * ----------------------------------------------------------------------------------------------
 * ⚠️ กับดักข้อสอบยอดฮิต (Exam Pitfalls):
 * ----------------------------------------------------------------------------------------------
 * 🪤 กับดักที่ 1: การคืนค่าหลังคำสั่ง INSERT
 *    - เมื่อรันคำสั่ง `INSERT INTO products ...` ไดรเวอร์ mysql2 จะคืนค่าผลลัพธ์เป็น `ResultSetHeader`
 *      ซึ่งมีคุณสมบัติ `result.insertId` บรรจุรหัส Auto-increment ID ของแถวที่เพิ่งถูกเพิ่มเข้าไป
 *    - 💡 เทคนิค: อย่าเพิ่งรีบคืนค่าเฉพาะ ID แต่ให้เรียก `findById(result.insertId)` 
 *      เพื่อดึงข้อมูลแถวนั้นกลับมาแบบครบถ้วนพร้อมข้อมูลตารางที่ JOIN มาด้วยเสมอ!
 * 
 * 🪤 กับดักที่ 2: ค่า `description` ที่เป็นค่าว่าง
 *    - ในโจทย์ข้อสอบ ฟิลด์ description อนุญาตให้เป็น null หรือไม่ส่งมาก็ได้ (Optional)
 *    - หากส่ง `undefined` เข้าไปในคำสั่ง SQL ตรงๆ อาจทำให้เกิด MySQL syntax error หรือ null constraint
 *    - 👉 ทางแก้: ใช้ `product.description !== undefined ? product.description : null`
 * 
 * 🪤 กับดักที่ 3: ฟิลด์ Boolean ใน MySQL
 *    - MySQL ไม่ได้มีชนิดข้อมูล Boolean แท้จริง แต่จะเก็บเป็น `TINYINT(1)` โดยที่ 1 = true, 0 = false
 *    - 👉 ตอน INSERT/UPDATE: แปลงจาก boolean เป็นตัวเลข `product.active ? 1 : 0`
 *    - 👉 ตอนอ่านข้อมูล (SELECT): แปลงกลับเป็น boolean ด้วย `Boolean(row.active)`
 * ==============================================================================================
 */

import db from '../configs/db-config.js';

/**
 * ฟังก์ชันผู้ช่วยส่วนตัว (Helper) สำหรับจัดรูปแถวข้อมูลดิบจาก MySQL ให้เป็น Clean JavaScript Object
 * แปลง snake_case $\rightarrow$ camelCase และแปลง Data Types ให้ตรงตาม Specification
 * 
 * @function formatRow
 * @param {Object} row - แถวข้อมูลดิบที่ได้จากตารางฐานข้อมูล
 * @returns {Object|null} ออบเจกต์สินค้าในโครงสร้าง JSON ที่สะอาด หรือ null
 */
function formatRow(row) {
  // หากไม่มีข้อมูลแถวส่งเข้ามา ให้คืนค่า null กลับไปทันที
  if (!row) return null;

  return {
    // 1. แปลง id ให้เป็น Number แน่นอน
    id: Number(row.id),

    // 2. รหัส SKU (String ตัวพิมพ์ใหญ่)
    sku: row.sku,

    // 3. ชื่อสินค้า (String)
    name: row.name,

    // 4. จัดกลุ่มข้อมูลแบรนด์ (Nested Object) ตาม REST API Specification
    brand: {
      id: Number(row.brand_id),
      name: row.brand_name
    },

    // 5. แปลงราคาเป็น Number (รองรับทศนิยม 2 ตำแหน่ง)
    price: Number(row.price),

    // 6. จำนวนสินค้าคงคลัง แปลงเป็นตัวเลขจำนวนเต็ม (Integer)
    stock: Number(row.stock),

    // 7. ขนาดหน่วยความจำ RAM (GB) แปลงเป็น Number
    ramGb: Number(row.ram_gb),

    // 8. ขนาดความจุ Storage (GB) แปลงเป็น Number
    storageGb: Number(row.storage_gb),

    // 9. สีของตัวเครื่อง (String)
    color: row.color,

    // 10. รายละเอียดสินค้า: หากไม่มีให้เป็น null
    description: row.description !== undefined ? row.description : null,

    // 11. สถานะเปิดใช้งาน: แปลงเลข 1 หรือ 0 จาก TINYINT ของ MySQL ให้เป็น Boolean แท้จริง
    active: Boolean(row.active)
  };
}

/**
 * ดึงรายการสินค้าทั้งหมดในระบบ พร้อมเชื่อมโยงข้อมูลแบรนด์ (JOIN brands)
 * จัดเรียงตาม ID ของสินค้าจากน้อยไปมาก
 * 
 * @async
 * @function findAll
 * @returns {Promise<Array<Object>>} อาร์เรย์ของสินค้าทั้งหมดพร้อมข้อมูลแบรนด์
 */
export async function findAll() {
  // สังเกตคำสั่ง JOIN brands b ON p.brand_id = b.id เพื่อดึงชื่อแบรนด์ออกมาด้วยในคราวเดียว
  const [rows] = await db.query(`
    SELECT p.id, p.sku, p.name, p.brand_id, p.price, p.stock, p.ram_gb, p.storage_gb, p.color, p.description, p.active,
           b.name as brand_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    ORDER BY p.id ASC
  `);

  // ส่งทุกแถวผ่านฟังก์ชัน formatRow เพื่อจัดโครงสร้างฟิลด์ให้ถูกต้อง
  return rows.map(formatRow);
}

/**
 * ดึงรายการสินค้าเฉพาะแบรนด์ที่กำหนด (Filter by brandId)
 * 
 * @async
 * @function findByBrandId
 * @param {number|string} brandId - รหัสของแบรนด์ที่ต้องการค้นหาสินค้า
 * @returns {Promise<Array<Object>>} อาร์เรย์ของสินค้าที่เป็นของแบรนด์นั้น
 */
export async function findByBrandId(brandId) {
  const [rows] = await db.query(`
    SELECT p.id, p.sku, p.name, p.brand_id, p.price, p.stock, p.ram_gb, p.storage_gb, p.color, p.description, p.active,
           b.name as brand_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    WHERE p.brand_id = ?
    ORDER BY p.id ASC
  `, [brandId]);

  return rows.map(formatRow);
}

/**
 * ค้นหาข้อมูลสินค้าเดี่ยวตามรหัส ID
 * 
 * @async
 * @function findById
 * @param {number|string} id - รหัส ID ของสินค้า
 * @returns {Promise<Object|null>} คืนค่าออบเจกต์สินค้า หรือ null หากไม่พบข้อมูล
 */
export async function findById(id) {
  const [rows] = await db.query(`
    SELECT p.id, p.sku, p.name, p.brand_id, p.price, p.stock, p.ram_gb, p.storage_gb, p.color, p.description, p.active,
           b.name as brand_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    WHERE p.id = ?
  `, [id]);

  // หากไม่มีแถวข้อมูล คืนค่า null เพื่อให้ Service Layer โยน HTTP 404
  if (rows.length === 0) return null;

  // คืนค่าเฉพาะแถวแรกที่พบ
  return formatRow(rows[0]);
}

/**
 * ค้นหาข้อมูลสินค้าตามรหัส SKU (ใช้สำหรับตรวจสอบความซ้ำซ้อนตอนสร้างหรือแก้ไขข้อมูล)
 * 
 * @async
 * @function findBySku
 * @param {string} sku - รหัส SKU ของสินค้า
 * @returns {Promise<Object|null>} คืนค่าสินค้าที่ใช้ SKU นี้ หรือ null ถ้ายังไม่มีใครใช้
 */
export async function findBySku(sku) {
  const [rows] = await db.query(`
    SELECT p.id, p.sku, p.name, p.brand_id, p.price, p.stock, p.ram_gb, p.storage_gb, p.color, p.description, p.active,
           b.name as brand_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    WHERE p.sku = ?
  `, [sku]);

  if (rows.length === 0) return null;
  return formatRow(rows[0]);
}

/**
 * บันทึกสินค้าใหม่ลงในตาราง products
 * 
 * @async
 * @function create
 * @param {Object} product - ข้อมูลสินค้าที่จะทำการบันทึก
 * @returns {Promise<Object>} ข้อมูลสินค้าที่เพิ่งถูกบันทึก พร้อม ID และ brand_name ที่ JOIN มา
 */
export async function create(product) {
  // สังเกตการส่ง Parameter เรียงตามลำดับเครื่องหมายคำถาม (?)
  const [result] = await db.query(`
    INSERT INTO products (sku, name, brand_id, price, stock, ram_gb, storage_gb, color, description, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    product.sku,
    product.name,
    product.brandId,
    product.price,
    product.stock,
    product.ramGb,
    product.storageGb,
    product.color,
    // หากไม่มี description ให้บันทึกเป็น NULL ในฐานข้อมูล
    product.description !== undefined ? product.description : null,
    // แปลง Boolean เป็นเลข 1 หรือ 0 สำหรับชนิดข้อมูล TINYINT ของ MySQL
    product.active ? 1 : 0
  ]);

  // result.insertId คือ Primary Key ล่าสุดที่สร้างโดย AUTO_INCREMENT
  // นำ ID นี้ไป Query ข้อมูลฉบับเต็มส่งกลับให้ Controller คืนค่าสถานะ 201 Created
  return findById(result.insertId);
}

/**
 * อัปเดตข้อมูลสินค้าเดิมตาม ID (แบบแทนที่ข้อมูลทั้งหมด - Full Replacement ตามมาตรฐาน PUT)
 * 
 * @async
 * @function update
 * @param {number|string} id - รหัสสินค้าที่ต้องการอัปเดต
 * @param {Object} product - ข้อมูลชุดใหม่ทั้งหมดที่จะนำไปแทนที่
 * @returns {Promise<Object>} ข้อมูลสินค้าหลังการอัปเดตเรียบร้อยแล้ว
 */
export async function update(id, product) {
  await db.query(`
    UPDATE products
    SET sku = ?, name = ?, brand_id = ?, price = ?, stock = ?, ram_gb = ?, storage_gb = ?, color = ?, description = ?, active = ?
    WHERE id = ?
  `, [
    product.sku,
    product.name,
    product.brandId,
    product.price,
    product.stock,
    product.ramGb,
    product.storageGb,
    product.color,
    product.description !== undefined ? product.description : null,
    product.active ? 1 : 0,
    id // ตัวแปรตัวสุดท้ายสำหรับ WHERE id = ?
  ]);

  // ดึงข้อมูลสินค้าที่อัปเดตเสร็จแล้วส่งกลับไปให้ Controller
  return findById(id);
}

/**
 * ลบสินค้าออกจากระบบตาม ID
 * 
 * @async
 * @function remove
 * @param {number|string} id - รหัสสินค้าที่ต้องการลบ
 * @returns {Promise<boolean>} true หากมีแถวถูกลบจริง (affectedRows > 0), false หากไม่มีแถวนั้น
 */
export async function remove(id) {
  const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  
  // result.affectedRows จะบอกว่ามีข้อมูลถูกลบไปกี่แถวในฐานข้อมูล
  // ถ้าเท่ากับ 0 แปลว่าไม่พบแถวที่ตรงกับ ID นั้น
  return result.affectedRows > 0;
}
