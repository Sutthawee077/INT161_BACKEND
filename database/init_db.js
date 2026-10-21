/**
 * ==============================================================================================
 * 📁 File: init_db.js
 * 🏷️ Layer: Database Tool & Seeding (เครื่องมือตั้งต้นฐานข้อมูล - Initial Database Seeding)
 * ==============================================================================================
 * 
 * 📖 วัตถุประสงค์ของสคริปต์นี้:
 * 1. ช่วยให้นักศึกษาสามารถสร้าง, ล้าง (Drop & Recreate) และใส่ข้อมูล Mock Data เริ่มต้น
 *    ให้พร้อมสำหรับการทดสอบและทำข้อสอบได้ในคำสั่งเดียว
 * 2. สร้างฐานข้อมูล `mobile_exam` ขึ้นมาอัตโนมัติหากยังไม่มี
 * 3. อ่านคำสั่ง SQL INSERT ทั้งหมดจากไฟล์ `schema.sql` มารันอย่างเป็นระเบียบ
 * 
 * ----------------------------------------------------------------------------------------------
 * 🔍 เจาะลึกโครงสร้างตาราง (DDL Schema Analysis):
 * ----------------------------------------------------------------------------------------------
 * 1. ตาราง `brands`:
 *    - `id BIGINT AUTO_INCREMENT PRIMARY KEY`: รหัสแบรนด์ตัวเลขจำนวนเต็ม 64-bit
 *    - `name VARCHAR(60) NOT NULL UNIQUE`: ชื่อแบรนด์ต้องไม่ซ้ำกัน
 * 
 * 2. ตาราง `products`:
 *    - `sku VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE`:
 *      💡 ข้อสังเกตสำคัญ: การใช้ Collation `ascii_bin` จะทำให้ MySQL เปรียบเทียบรหัส SKU แบบ
 *      Case-Sensitive (เช่น 'SKU-001' จะไม่เหมือนกับ 'sku-001') ซึ่งตรงตามมาตรฐานข้อสอบ
 *    - `price DECIMAL(10,2) NOT NULL`: จัดเก็บราคาเป็นตัวเลขที่มีทศนิยม 2 ตำแหน่ง
 *    - `CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT`:
 *      💡 กฎ Foreign Key: ใช้ ON DELETE RESTRICT เพื่อป้องกันการลบแบรนด์หากยังมีสินค้าผูกอยู่
 *      ซึ่งจะส่งผลให้ MySQL โยน Error `ER_ROW_IS_REFERENCED_2 (1451)`
 *      ทำให้ API Server สามารถดักจับและส่ง HTTP 409 Conflict กลับไปยัง Client ได้ถูกต้อง!
 * 
 * ----------------------------------------------------------------------------------------------
 * 🚀 วิธีการเรียกใช้งาน:
 * ----------------------------------------------------------------------------------------------
 * รันคำสั่งใน Terminal:
 * `node init_db.js`
 * ==============================================================================================
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function init() {
  console.log('🔄 กำลังเชื่อมต่อไปยัง MySQL Server เพื่อตั้งค่าฐานข้อมูล...');

  // เชื่อมต่อไปยัง MySQL Server โดยตรง (ยังไม่ระบุชื่อ database เพื่อสร้าง Database ก่อน)
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'DearDear.5',
    // เปิด option multipleStatements เพื่อให้สามารถรันชุดคำสั่งหลายๆ คำสั่งพร้อมกันได้
    multipleStatements: true
  });

  console.log('✅ เชื่อมต่อ MySQL Server สำเร็จเรียบร้อย');

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 1: สร้างฐานข้อมูล mobile_exam (UTF-8 mb4)
  // ----------------------------------------------------------------------------
  await conn.query('CREATE DATABASE IF NOT EXISTS mobile_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  await conn.query('USE mobile_exam;');

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 2: ล้างตารางเดิมทิ้ง (ต้องลบ products ก่อน brands เนื่องจากมี Foreign Key)
  // ----------------------------------------------------------------------------
  await conn.query('DROP TABLE IF EXISTS products;');
  await conn.query('DROP TABLE IF EXISTS brands;');

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 3: สร้างตารางแบรนด์ (brands)
  // ----------------------------------------------------------------------------
  await conn.query(`
    CREATE TABLE brands (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL UNIQUE,
      country VARCHAR(60) NOT NULL
    );
  `);

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 4: สร้างตารางสินค้า (products) พร้อม Foreign Key Restrict
  // ----------------------------------------------------------------------------
  await conn.query(`
    CREATE TABLE products (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      brand_id BIGINT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL,
      ram_gb INT NOT NULL,
      storage_gb INT NOT NULL,
      color VARCHAR(40) NOT NULL,
      description VARCHAR(500) NULL,
      active BOOLEAN NOT NULL,
      CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
    );
  `);

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 5: อ่านคำสั่ง INSERT จากไฟล์ schema.sql และนำเข้าข้อมูล Mock Data
  // ----------------------------------------------------------------------------
  const sqlPath = fs.existsSync(path.resolve('database/schema.sql'))
    ? path.resolve('database/schema.sql')
    : path.resolve('schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const lines = sql.split('\n');
  let currentStatement = '';
  for (const line of lines) {
    const trimmed = line.trim();
    // ข้ามบรรทัดว่าง และบรรทัดที่เป็น Comment ของ SQL (-- ...)
    if (trimmed.startsWith('--') || !trimmed) continue;
    currentStatement += ' ' + trimmed;
    // หากพบบรรทัดที่ลงท้ายด้วยเครื่องหมายอัฒภาค (;) แปลว่าจบคีย์คำสั่ง SQL นั้นแล้ว
    if (trimmed.endsWith(';')) {
      await conn.query(currentStatement);
      currentStatement = '';
    }
  }

  // ----------------------------------------------------------------------------
  // ขั้นตอนที่ 6: นับจำนวนข้อมูลทั้งหมดเพื่อยืนยันความถูกต้อง
  // ----------------------------------------------------------------------------
  const [[brandsCount]] = await conn.query('SELECT COUNT(*) as c FROM brands;');
  const [[productsCount]] = await conn.query('SELECT COUNT(*) as c FROM products;');
  console.log(`🎉 ฐานข้อมูล mobile_exam ถูกติดตั้งเรียบร้อยแล้ว!`);
  console.log(`📊 แบรนด์ทั้งหมด: ${brandsCount.c} แบรนด์ | สินค้าทั้งหมด: ${productsCount.c} รายการ`);

  // ปิด Connection ของตัวติดตั้ง
  await conn.end();
}

// สั่งรันฟังก์ชันและดักจับ Error
init().catch(err => {
  console.error('❌ เกิดข้อผิดพลาดในการติดตั้งฐานข้อมูล:', err);
  process.exit(1);
});
