/**
 * ==============================================================================================
 * 📁 File: Practice2/src/configs/db-config.js
 * 🏷️ Layer: Config (การตั้งค่าเชื่อมต่อฐานข้อมูล MySQL)
 * ==============================================================================================
 * 
 * 📖 หน้าที่ของไฟล์นี้:
 * สร้าง Connection Pool ไปยังฐานข้อมูล 'classicmodels' โดยใช้ mysql2/promise
 * เพื่อให้สามารถใช้คำสั่ง await db.query(...) ได้ในทุกไฟล์ Repository
 * ==============================================================================================
 */

import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'DearDear.5',
  database: process.env.DB_NAME || 'classicmodels',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;
