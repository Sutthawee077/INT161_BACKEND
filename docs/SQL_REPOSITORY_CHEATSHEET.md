# 🗄️ SQL Repository Cheat Sheet & Snippets for INT161
### คลังคำสั่ง SQL และแม่แบบฟังก์ชัน Repository สำหรับ Node.js (`mysql2/promise`)

เอกสารนี้รวบรวมคำสั่ง SQL และรูปแบบฟังก์ชันในชั้น **Repository Layer** ที่พบบ่อยที่สุดในข้อสอบวิชา **INT161 Backend Development** ออกแบบมาเพื่อให้สามารถคัดลอก (Copy & Paste) และเปลี่ยนชื่อตาราง/คอลัมน์ไปใช้งานในห้องสอบได้ทันที

---

## 📌 สรุปพฤติกรรมของ `mysql2/promise` ที่ต้องจำก่อนเริ่ม

เมื่อสั่ง `const [result] = await db.query(SQL, [params]);`
| คำสั่ง SQL | สิ่งที่คืนค่าออกมาในตัวแปร | ตัวแปรสำคัญที่ต้องดึงไปใช้ |
|---|---|---|
| **SELECT** | Array ของแถวข้อมูล `[ { ... }, { ... } ]` | `rows.length`, `rows[0]`, `rows.map(...)` |
| **INSERT** | Object ประเภท `ResultSetHeader` | `result.insertId` (รหัส Auto-increment ล่าสุด) |
| **UPDATE** | Object ประเภท `ResultSetHeader` | `result.affectedRows` (จำนวนแถวที่ถูกแก้ไข), `result.changedRows` |
| **DELETE** | Object ประเภท `ResultSetHeader` | `result.affectedRows > 0` (เช็คว่ามีแถวถูกลบจริงหรือไม่) |

---

## 📑 สารบัญแม่แบบตามสถานการณ์ข้อสอบ

1. [SELECT ทั้งหมด (Find All)](#1-select-ทั้งหมด-find-all)
2. [SELECT เดี่ยวตาม ID (Find by ID)](#2-select-เดี่ยวตาม-id-find-by-id)
3. [SELECT ตรวจสอบความมีอยู่ (Fast Existence Check)](#3-select-ตรวจสอบความมีอยู่-fast-existence-check)
4. [SELECT ตรวจสอบฟิลด์ซ้ำ (Uniqueness Check เช่น SKU, Email, Name)](#4-select-ตรวจสอบฟิลด์ซ้ำ-uniqueness-check-เช่น-sku-email-name)
5. [SELECT แบบแบ่งหน้า (Pagination: LIMIT & OFFSET)](#5-select-แบบแบ่งหน้า-pagination-limit--offset)
6. [SELECT นับจำนวนทั้งหมด (COUNT for Pagination)](#6-select-นับจำนวนทั้งหมด-count-for-pagination)
7. [SELECT กรองข้อมูล (Filter by Foreign Key เช่น ?brandId=)](#7-select-กรองข้อมูล-filter-by-foreign-key-เช่น-brandid)
8. [SELECT แบบเชื่อมตาราง (JOIN Relationship)](#8-select-แบบเชื่อมตาราง-join-relationship)
9. [INSERT สร้างข้อมูลใหม่ (Auto-Increment PK)](#9-insert-สร้างข้อมูลใหม่-auto-increment-pk)
10. [INSERT สร้างข้อมูลใหม่ (String PK เช่น ProductLine, OfficeCode)](#10-insert-สร้างข้อมูลใหม่-string-pk-เช่น-productline-officecode)
11. [INSERT & SELECT แบบ Composite Primary Key (PK คู่ เช่น Payments)](#11-insert--select-แบบ-composite-primary-key-pk-คู่-เช่น-payments)
12. [UPDATE แก้ไขข้อมูลเดิมแบบแทนที่ทั้งหมด (Full Replacement - PUT)](#12-update-แก้ไขข้อมูลเดิมแบบแทนที่ทั้งหมด-full-replacement---put)
13. [DELETE ลบข้อมูลตาม ID](#13-delete-ลบข้อมูลตาม-id)
14. [DATABASE TRANSACTION (การทำงานแบบหลายตารางพร้อมกัน)](#14-database-transaction-การทำงานแบบหลายตารางพร้อมกัน)

---

### 1. SELECT ทั้งหมด (Find All)
```javascript
/**
 * ดึงข้อมูลทั้งหมด เรียงลำดับตาม ID จากน้อยไปมาก
 */
export async function findAll() {
  const [rows] = await db.query('SELECT * FROM products ORDER BY id ASC');
  return rows;
}
```

---

### 2. SELECT เดี่ยวตาม ID (Find by ID)
```javascript
/**
 * ค้นหาข้อมูลเดี่ยวตาม ID (ถ้าไม่เจอคืน null)
 */
export async function findById(id) {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}
```

---

### 3. SELECT ตรวจสอบความมีอยู่ (Fast Existence Check)
💡 **เทคนิคข้อสอบ:** ใช้ `SELECT 1 ... LIMIT 1` แทน `SELECT *` เพราะเร็วกว่า ไม่กินแรม และฐานข้อมูลหยุดสแกนทันทีที่พบ 1 แถว

```javascript
/**
 * เช็คว่ามีข้อมูลรหัสนี้อยู่ในฐานข้อมูลหรือไม่ (คืน true / false)
 */
export async function existsById(id) {
  const [rows] = await db.query('SELECT 1 FROM brands WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0;
}
```

---

### 4. SELECT ตรวจสอบฟิลด์ซ้ำ (Uniqueness Check เช่น SKU, Email, Name)
```javascript
/**
 * ค้นหาข้อมูลตามฟิลด์ Unique (ใช้เช็คตอน POST หรือ PUT ว่าซ้ำหรือไม่)
 */
export async function findBySku(sku) {
  const [rows] = await db.query('SELECT * FROM products WHERE sku = ?', [sku]);
  return rows.length > 0 ? rows[0] : null;
}

export async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM employees WHERE email = ?', [email]);
  return rows.length > 0 ? rows[0] : null;
}
```

---

### 5. SELECT แบบแบ่งหน้า (Pagination: LIMIT & OFFSET)
สูตรการคำนวณ: `offset = (page - 1) * limit`
* หน้า 1 (`page = 1, limit = 10`): `offset = 0` (แถวที่ 1-10)
* หน้า 2 (`page = 2, limit = 10`): `offset = 10` (แถวที่ 11-20)

```javascript
/**
 * ดึงข้อมูลแบบแบ่งหน้า
 * @param {number} limit - จำนวนรายการต่อหน้า
 * @param {number} offset - จุดเริ่มต้น
 */
export async function findWithPagination(limit, offset) {
  const [rows] = await db.query(
    'SELECT * FROM products ORDER BY id ASC LIMIT ? OFFSET ?',
    [Number(limit), Number(offset)]
  );
  return rows;
}
```

---

### 6. SELECT นับจำนวนทั้งหมด (COUNT for Pagination)
```javascript
/**
 * นับจำนวนแถวทั้งหมดในตาราง เพื่อนำไปคำนวณ totalPages = Math.ceil(total / limit)
 */
export async function countTotal() {
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM products');
  return Number(total);
}
```

---

### 7. SELECT กรองข้อมูล (Filter by Foreign Key เช่น ?brandId=)
```javascript
/**
 * ดึงสินค้าเฉพาะแบรนด์ที่กำหนด
 */
export async function findByBrandId(brandId) {
  const [rows] = await db.query(
    'SELECT * FROM products WHERE brand_id = ? ORDER BY id ASC',
    [brandId]
  );
  return rows;
}
```

---

### 8. SELECT แบบเชื่อมตาราง (JOIN Relationship)
💡 **แก้ปัญหา N+1 Query:** ดึงข้อมูลตารางหลักพร้อมชื่อของตารางที่สัมพันธ์กันในคำสั่ง SQL เดียว

```javascript
/**
 * ดึงสินค้าพร้อมชื่อแบรนด์ (JOIN brands)
 */
export async function findProductWithBrand(id) {
  const [rows] = await db.query(`
    SELECT p.id, p.sku, p.name, p.price, p.stock,
           b.id AS brand_id, b.name AS brand_name, b.country AS brand_country
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = ?
  `, [id]);

  if (rows.length === 0) return null;

  const r = rows[0];
  // แปลงให้เป็น Nested Object ตามมาตรฐาน RESTful DTO
  return {
    id: Number(r.id),
    sku: r.sku,
    name: r.name,
    price: Number(r.price),
    stock: Number(r.stock),
    brand: {
      id: Number(r.brand_id),
      name: r.brand_name
    }
  };
}
```

---

### 9. INSERT สร้างข้อมูลใหม่ (Auto-Increment PK)
```javascript
/**
 * สร้างสินค้าใหม่ และคืนค่าข้อมูลที่เพิ่งสร้างโดยอาศัย result.insertId
 */
export async function create(product) {
  const [result] = await db.query(`
    INSERT INTO products (sku, name, brand_id, price, stock, active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    product.sku,
    product.name,
    product.brandId,
    product.price,
    product.stock,
    product.active ? 1 : 0, // แปลง boolean เป็น tinyint(1)
    product.description !== undefined ? product.description : null
  ]);

  // result.insertId คือ Primary Key ที่ถูกสร้างขึ้นมาใหม่
  return await findById(result.insertId);
}
```

---

### 10. INSERT สร้างข้อมูลใหม่ (String PK เช่น ProductLine, OfficeCode)
```javascript
/**
 * สร้างข้อมูลที่ Primary Key เป็น String รับมาจาก Client โดยตรง
 */
export async function createProductLine(data) {
  await db.query(`
    INSERT INTO productlines (productLine, textDescription, htmlDescription)
    VALUES (?, ?, ?)
  `, [
    data.productLine,
    data.textDescription ?? null,
    data.htmlDescription ?? null
  ]);

  return await findByProductLine(data.productLine);
}
```

---

### 11. INSERT & SELECT แบบ Composite Primary Key (PK คู่ เช่น Payments)
```javascript
/**
 * ค้นหาข้อมูลด้วย Composite Key (customerNumber + checkNumber)
 */
export async function findPayment(customerNumber, checkNumber) {
  const [rows] = await db.query(`
    SELECT customerNumber, checkNumber, DATE_FORMAT(paymentDate, '%Y-%m-%d') AS paymentDate, amount
    FROM payments
    WHERE customerNumber = ? AND checkNumber = ?
  `, [customerNumber, checkNumber]);

  return rows.length > 0 ? rows[0] : null;
}

/**
 * บันทึกข้อมูลที่มี Composite Key
 */
export async function createPayment(data) {
  await db.query(`
    INSERT INTO payments (customerNumber, checkNumber, paymentDate, amount)
    VALUES (?, ?, ?, ?)
  `, [
    data.customerNumber,
    data.checkNumber,
    data.paymentDate,
    data.amount
  ]);

  return await findPayment(data.customerNumber, data.checkNumber);
}
```

---

### 12. UPDATE แก้ไขข้อมูลเดิมแบบแทนที่ทั้งหมด (Full Replacement - PUT)
```javascript
/**
 * แก้ไขข้อมูลสินค้าเดิมตาม ID
 */
export async function update(id, product) {
  await db.query(`
    UPDATE products
    SET sku = ?, name = ?, brand_id = ?, price = ?, stock = ?, active = ?, description = ?
    WHERE id = ?
  `, [
    product.sku,
    product.name,
    product.brandId,
    product.price,
    product.stock,
    product.active ? 1 : 0,
    product.description !== undefined ? product.description : null,
    id
  ]);

  return await findById(id);
}

/**
 * ทางเลือกพิเศษ: ใช้ SET ? ของ mysql2 (เหมาะสำหรับกรณีฟิลด์เยอะ)
 */
export async function updateObject(id, updateData) {
  await db.query('UPDATE employees SET ? WHERE employeeNumber = ?', [updateData, id]);
  return await findById(id);
}
```

---

### 13. DELETE ลบข้อมูลตาม ID
💡 **ข้อควรระวัง:** ตรวจสอบ `result.affectedRows > 0` เพื่อดูว่ามีแถวถูกลบจริงหรือไม่

```javascript
/**
 * ลบข้อมูลออกจากฐานข้อมูล
 * @returns {Promise<boolean>} true ถ้าลบสำเร็จ, false ถ้าไม่มีแถวนั้น
 */
export async function remove(id) {
  const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
```

---

### 14. DATABASE TRANSACTION (การทำงานแบบหลายตารางพร้อมกัน)
ใช้เมื่อต้องรันหลายคำสั่งพร้อมกัน ถ้าอันใดอันหนึ่งล้มเหลว ให้ยกเลิกทั้งหมด (Rollback)

```javascript
/**
 * ตัวอย่าง Transaction: สั่งซื้อสินค้า (ตัดสต็อก + สร้าง Order)
 */
export async function placeOrder(orderData, items) {
  // 1. ดึง connection เดี่ยวออกมาจาก pool
  const conn = await db.getConnection();

  try {
    // 2. เริ่มต้น Transaction
    await conn.beginTransaction();

    // 3. บันทึกหัวบิล Order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (orderDate, customerNumber, status) VALUES (NOW(), ?, ?)',
      [orderData.customerNumber, 'In Process']
    );
    const orderId = orderResult.insertId;

    // 4. บันทึกรายการสินค้าและตัดสต็อก
    for (const item of items) {
      await conn.query(
        'INSERT INTO orderdetails (orderNumber, productCode, quantityOrdered, priceEach) VALUES (?, ?, ?, ?)',
        [orderId, item.productCode, item.quantity, item.price]
      );

      // ตัดสต็อกสินค้า
      const [updateStock] = await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.quantity, item.productId, item.quantity]
      );

      // ถ้าสต็อกไม่พอ จะ update ไม่สำเร็จ (affectedRows === 0)
      if (updateStock.affectedRows === 0) {
        throw new Error(`Insufficient stock for product ID: ${item.productId}`);
      }
    }

    // 5. บันทึกทุกอย่างสำเร็จ สั่ง Commit
    await conn.commit();
    return { orderId, success: true };

  } catch (error) {
    // 6. หากเกิดข้อผิดพลาดใดๆ สั่ง Rollback ยกเลิกทุกคำสั่งที่ทำไป
    await conn.rollback();
    throw error;
  } finally {
    // 7. คืน Connection กลับเข้า Pool เสมอ!
    conn.release();
  }
}
```

---

## 🛠️ Generic Repository Template (เทมเพลตสำเร็จรูปสำหรับสร้างตารางใหม่)

หากในห้องสอบมีตารางใหม่ เช่น `categories`, `suppliers`, `orders` ให้ก๊อปปี้เทมเพลตนี้ไปวาง เปลี่ยนแค่ `TABLE_NAME` และ `PRIMARY_KEY` ใช้งานได้ทันที:

```javascript
import db from '../configs/db-config.js';

const TABLE_NAME = 'products';
const PRIMARY_KEY = 'id';

export async function findAll() {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} ORDER BY ${PRIMARY_KEY} ASC`);
  return rows;
}

export async function findById(id) {
  const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE ${PRIMARY_KEY} = ?`, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function existsById(id) {
  const [rows] = await db.query(`SELECT 1 FROM ${TABLE_NAME} WHERE ${PRIMARY_KEY} = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

export async function create(data) {
  const [result] = await db.query(`INSERT INTO ${TABLE_NAME} SET ?`, [data]);
  const newId = result.insertId || data[PRIMARY_KEY];
  return await findById(newId);
}

export async function update(id, data) {
  await db.query(`UPDATE ${TABLE_NAME} SET ? WHERE ${PRIMARY_KEY} = ?`, [data, id]);
  return await findById(id);
}

export async function remove(id) {
  const [result] = await db.query(`DELETE FROM ${TABLE_NAME} WHERE ${PRIMARY_KEY} = ?`, [id]);
  return result.affectedRows > 0;
}
```
