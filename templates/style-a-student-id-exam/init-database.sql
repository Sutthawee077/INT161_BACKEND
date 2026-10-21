-- ====================================================================
-- Complete Database Initialization Script (Schema + Test Seed Data)
-- Case: Mobile Phone Distributor Ltd.
-- Run with: mysql -u <user> -p < init-database.sql
-- ====================================================================

-- ====================================================================
-- Database Schema for Node.js + Express.js RESTful API Practice Exam
-- Case: Mobile Phone Distributor Ltd.
-- Entity: brands, products
-- ====================================================================

-- 1. Create database if not exists
CREATE DATABASE IF NOT EXISTS mobile_distributor
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE mobile_distributor;

-- 2. Drop tables in correct order (child table first)
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;

-- 3. Create 'brands' table
CREATE TABLE brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country_of_origin VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create 'products' table
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    brand_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'FLAGSHIP', 'MID_RANGE', 'BUDGET', 'FOLDABLE'
    price DECIMAL(10, 2) NOT NULL,
    ram_gb INT NOT NULL,
    storage_gb INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Indexes for query & search performance
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);


-- ====================================================================
-- Test Seed Data for Node.js + Express.js RESTful API Practice Exam
-- Case: Mobile Phone Distributor Ltd.
-- Entity: brands (22 records), products (75 records)
-- ====================================================================

USE mobile_distributor;

-- Disable Foreign Key Checks during seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
TRUNCATE TABLE brands;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- 1. Brands Seed Data (22 Records)
-- Notes:
--   - ID 1-21: Active brands with associated products
--   - ID 21 (Fairphone): European sustainable phone brand
--   - ID 22 (Meizu): Inactive brand with NO products (Can test DELETE brand successfully)
-- --------------------------------------------------------------------
INSERT INTO brands (id, name, country_of_origin, website, is_active, created_at) VALUES
(1, 'Apple', 'United States', 'https://www.apple.com', TRUE, '2024-01-01 00:00:00'),
(2, 'Samsung', 'South Korea', 'https://www.samsung.com', TRUE, '2024-01-01 00:00:00'),
(3, 'Xiaomi', 'China', 'https://www.mi.com', TRUE, '2024-01-01 00:00:00'),
(4, 'Google', 'United States', 'https://store.google.com', TRUE, '2024-01-01 00:00:00'),
(5, 'Sony', 'Japan', 'https://www.sony.com', TRUE, '2024-01-01 00:00:00'),
(6, 'OnePlus', 'China', 'https://www.oneplus.com', TRUE, '2024-01-01 00:00:00'),
(7, 'Oppo', 'China', 'https://www.oppo.com', TRUE, '2024-01-01 00:00:00'),
(8, 'Vivo', 'China', 'https://www.vivo.com', TRUE, '2024-01-01 00:00:00'),
(9, 'Realme', 'China', 'https://www.realme.com', TRUE, '2024-01-01 00:00:00'),
(10, 'Asus', 'Taiwan', 'https://www.asus.com', TRUE, '2024-01-01 00:00:00'),
(11, 'Motorola', 'United States', 'https://www.motorola.com', TRUE, '2024-01-01 00:00:00'),
(12, 'Huawei', 'China', 'https://consumer.huawei.com', TRUE, '2024-01-01 00:00:00'),
(13, 'Honor', 'China', 'https://www.honor.com', TRUE, '2024-01-01 00:00:00'),
(14, 'Nothing', 'United Kingdom', 'https://nothing.tech', TRUE, '2024-01-01 00:00:00'),
(15, 'Infinix', 'Hong Kong', 'https://www.infinixmobility.com', TRUE, '2024-01-01 00:00:00'),
(16, 'Tecno', 'Hong Kong', 'https://www.tecno-mobile.com', TRUE, '2024-01-01 00:00:00'),
(17, 'Poco', 'China', 'https://www.po.co', TRUE, '2024-01-01 00:00:00'),
(18, 'Nokia', 'Finland', 'https://www.nokia.com', TRUE, '2024-01-01 00:00:00'),
(19, 'ZTE', 'China', 'https://www.ztedevices.com', TRUE, '2024-01-01 00:00:00'),
(20, 'Lenovo', 'China', 'https://www.lenovo.com', TRUE, '2024-01-01 00:00:00'),
(21, 'Fairphone', 'Netherlands', 'https://www.fairphone.com', TRUE, '2024-01-01 00:00:00'),
(22, 'Meizu', 'China', 'https://www.meizu.com', FALSE, '2024-01-01 00:00:00');

-- --------------------------------------------------------------------
-- 2. Products Seed Data (75 Records)
-- Test scenarios covered:
--   - Categories: FLAGSHIP, MID_RANGE, BUDGET, FOLDABLE, STANDARD
--   - Stock statuses: AVAILABLE, OUT_OF_STOCK, DISCONTINUED
--   - Price ranges: 3,490 to 65,900 THB
--   - Stock quantities: 0 (out of stock/discontinued), 3-50 (available)
-- --------------------------------------------------------------------
INSERT INTO products (id, sku, name, brand_id, category, price, ram_gb, storage_gb, color, stock_quantity, status, release_date, created_at, updated_at) VALUES
(1, 'APL-IP15PM-256-NT', 'iPhone 15 Pro Max', 1, 'FLAGSHIP', 48900.00, 8, 256, 'Natural Titanium', 15, 'AVAILABLE', '2023-09-22', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(2, 'APL-IP15P-128-BLU', 'iPhone 15 Pro', 1, 'FLAGSHIP', 41900.00, 8, 128, 'Blue Titanium', 10, 'AVAILABLE', '2023-09-22', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(3, 'APL-IP15-128-PNK', 'iPhone 15', 1, 'STANDARD', 32900.00, 6, 128, 'Pink', 22, 'AVAILABLE', '2023-09-22', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(4, 'APL-IP15P-256-BLK', 'iPhone 15 Plus', 1, 'STANDARD', 37900.00, 6, 256, 'Black', 8, 'AVAILABLE', '2023-09-22', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(5, 'APL-IP13-128-MID', 'iPhone 13', 1, 'BUDGET', 19900.00, 4, 128, 'Midnight', 0, 'OUT_OF_STOCK', '2021-09-24', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(6, 'SAM-S24U-512-TI', 'Galaxy S24 Ultra', 2, 'FLAGSHIP', 52900.00, 12, 512, 'Titanium Gray', 14, 'AVAILABLE', '2024-01-31', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(7, 'SAM-S24P-256-VIO', 'Galaxy S24 Plus', 2, 'FLAGSHIP', 38900.00, 12, 256, 'Cobalt Violet', 12, 'AVAILABLE', '2024-01-31', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(8, 'SAM-S24-256-BLK', 'Galaxy S24', 2, 'FLAGSHIP', 33900.00, 8, 256, 'Onyx Black', 18, 'AVAILABLE', '2024-01-31', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(9, 'SAM-ZFL5-256-MNT', 'Galaxy Z Flip 5', 2, 'FOLDABLE', 39900.00, 8, 256, 'Mint', 6, 'AVAILABLE', '2023-08-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(10, 'SAM-ZFD5-512-ICY', 'Galaxy Z Fold 5', 2, 'FOLDABLE', 65900.00, 12, 512, 'Icy Blue', 4, 'AVAILABLE', '2023-08-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(11, 'SAM-A55-128-LIL', 'Galaxy A55 5G', 2, 'MID_RANGE', 13999.00, 8, 128, 'Awesome Lilac', 35, 'AVAILABLE', '2024-03-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(12, 'SAM-A35-128-NAV', 'Galaxy A35 5G', 2, 'MID_RANGE', 10999.00, 8, 128, 'Awesome Navy', 25, 'AVAILABLE', '2024-03-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(13, 'SAM-A15-128-BLU', 'Galaxy A15', 2, 'BUDGET', 5999.00, 4, 128, 'Blue', 40, 'AVAILABLE', '2023-12-16', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(14, 'XIA-14U-512-WHT', 'Xiaomi 14 Ultra', 3, 'FLAGSHIP', 44990.00, 16, 512, 'White', 7, 'AVAILABLE', '2024-02-22', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(15, 'XIA-14P-512-BLK', 'Xiaomi 14 Pro', 3, 'FLAGSHIP', 34990.00, 12, 512, 'Black', 11, 'AVAILABLE', '2023-11-01', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(16, 'XIA-14-256-GRN', 'Xiaomi 14', 3, 'FLAGSHIP', 29990.00, 12, 256, 'Jade Green', 16, 'AVAILABLE', '2023-10-26', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(17, 'XIA-RN13P-256-PRP', 'Redmi Note 13 Pro+ 5G', 3, 'MID_RANGE', 12990.00, 8, 256, 'Aurora Purple', 30, 'AVAILABLE', '2024-01-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(18, 'XIA-RN13-128-BLK', 'Redmi Note 13', 3, 'BUDGET', 6999.00, 6, 128, 'Midnight Black', 45, 'AVAILABLE', '2024-01-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(19, 'XIA-13C-128-CLV', 'Redmi 13C', 3, 'BUDGET', 3999.00, 6, 128, 'Clover Green', 50, 'AVAILABLE', '2023-11-10', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(20, 'GOO-PX8P-256-BAY', 'Pixel 8 Pro', 4, 'FLAGSHIP', 37900.00, 12, 256, 'Bay', 9, 'AVAILABLE', '2023-10-12', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(21, 'GOO-PX8-128-OBS', 'Pixel 8', 4, 'FLAGSHIP', 28900.00, 8, 128, 'Obsidian', 14, 'AVAILABLE', '2023-10-12', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(22, 'GOO-PX8A-128-ALO', 'Pixel 8a', 4, 'MID_RANGE', 17900.00, 8, 128, 'Aloe', 20, 'AVAILABLE', '2024-05-14', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(23, 'GOO-PX7A-128-SEA', 'Pixel 7a', 4, 'MID_RANGE', 13900.00, 8, 128, 'Sea', 0, 'OUT_OF_STOCK', '2023-05-10', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(24, 'SON-XP1VI-256-BLK', 'Xperia 1 VI', 5, 'FLAGSHIP', 49990.00, 12, 256, 'Black', 5, 'AVAILABLE', '2024-06-05', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(25, 'SON-XP5V-128-BLU', 'Xperia 5 V', 5, 'FLAGSHIP', 34990.00, 8, 128, 'Blue', 8, 'AVAILABLE', '2023-09-01', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(26, 'SON-XP10VI-128-WHT', 'Xperia 10 VI', 5, 'MID_RANGE', 17990.00, 8, 128, 'White', 15, 'AVAILABLE', '2024-06-10', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(27, 'SON-XP10V-128-SGE', 'Xperia 10 V', 5, 'MID_RANGE', 15990.00, 6, 128, 'Sage Green', 0, 'DISCONTINUED', '2023-06-16', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(28, 'OPL-12-512-EMR', 'OnePlus 12', 6, 'FLAGSHIP', 34990.00, 16, 512, 'Emerald Green', 12, 'AVAILABLE', '2024-01-23', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(29, 'OPL-12R-256-IRN', 'OnePlus 12R', 6, 'MID_RANGE', 21990.00, 16, 256, 'Iron Gray', 18, 'AVAILABLE', '2024-02-06', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(30, 'OPL-OPEN-512-VOY', 'OnePlus Open', 6, 'FOLDABLE', 59990.00, 16, 512, 'Voyager Black', 3, 'AVAILABLE', '2023-10-19', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(31, 'OPL-NORD3-128-MST', 'OnePlus Nord 3 5G', 6, 'MID_RANGE', 14990.00, 8, 128, 'Misty Green', 22, 'AVAILABLE', '2023-07-05', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(32, 'OPP-FNDX7U-512-BRN', 'Find X7 Ultra', 7, 'FLAGSHIP', 42990.00, 16, 512, 'Sepia Brown', 6, 'AVAILABLE', '2024-01-08', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(33, 'OPP-RENO12P-512-SLV', 'Reno 12 Pro 5G', 7, 'MID_RANGE', 19990.00, 12, 512, 'Space Brown', 24, 'AVAILABLE', '2024-06-18', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(34, 'OPP-RENO12-256-AST', 'Reno 12 5G', 7, 'MID_RANGE', 14990.00, 12, 256, 'Astro Silver', 28, 'AVAILABLE', '2024-06-18', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(35, 'OPP-A79-128-PUR', 'Oppo A79 5G', 7, 'BUDGET', 7999.00, 8, 128, 'Dazzling Purple', 33, 'AVAILABLE', '2023-10-28', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(36, 'VIV-X100P-512-SUN', 'Vivo X100 Pro', 8, 'FLAGSHIP', 37999.00, 16, 512, 'Sunset Orange', 8, 'AVAILABLE', '2023-11-21', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(37, 'VIV-V30P-512-PCE', 'Vivo V30 Pro', 8, 'MID_RANGE', 19999.00, 12, 512, 'Petals White', 20, 'AVAILABLE', '2024-02-28', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(38, 'VIV-V30E-256-GLD', 'Vivo V30e 5G', 8, 'MID_RANGE', 11999.00, 8, 256, 'Coco Brown', 25, 'AVAILABLE', '2024-05-02', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(39, 'VIV-Y28-128-GRN', 'Vivo Y28', 8, 'BUDGET', 5499.00, 6, 128, 'Agate Green', 40, 'AVAILABLE', '2024-01-08', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(40, 'RLM-GT5P-512-RED', 'Realme GT5 Pro', 9, 'FLAGSHIP', 29999.00, 16, 512, 'Red Rock', 10, 'AVAILABLE', '2023-12-07', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(41, 'RLM-12P-256-BLU', 'Realme 12 Pro+ 5G', 9, 'MID_RANGE', 13999.00, 8, 256, 'Submarine Blue', 26, 'AVAILABLE', '2024-01-29', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(42, 'RLM-12-128-GRN', 'Realme 12 5G', 9, 'MID_RANGE', 8999.00, 8, 128, 'Twilight Purple', 35, 'AVAILABLE', '2024-03-06', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(43, 'RLM-C67-128-SUN', 'Realme C67', 9, 'BUDGET', 5499.00, 6, 128, 'Sunny Oasis', 45, 'AVAILABLE', '2023-12-19', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(44, 'ASU-ROG8P-512-BLK', 'ROG Phone 8 Pro', 10, 'FLAGSHIP', 39990.00, 16, 512, 'Phantom Black', 5, 'AVAILABLE', '2024-01-08', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(45, 'ASU-ZF11U-256-BLU', 'Zenfone 11 Ultra', 10, 'FLAGSHIP', 32990.00, 12, 256, 'Skyline Blue', 8, 'AVAILABLE', '2024-03-14', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(46, 'ASU-ZF10-128-RED', 'Zenfone 10', 10, 'FLAGSHIP', 24990.00, 8, 128, 'Eclipse Red', 0, 'OUT_OF_STOCK', '2023-06-29', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(47, 'MOT-RZ50U-512-PCH', 'Razr 50 Ultra', 11, 'FOLDABLE', 39990.00, 12, 512, 'Peach Fuzz', 7, 'AVAILABLE', '2024-06-25', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(48, 'MOT-ED50P-256-BLK', 'Edge 50 Pro', 11, 'MID_RANGE', 17990.00, 12, 256, 'Black Beauty', 15, 'AVAILABLE', '2024-04-03', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(49, 'MOT-G84-256-VIV', 'Moto G84 5G', 11, 'BUDGET', 7990.00, 12, 256, 'Viva Magenta', 25, 'AVAILABLE', '2023-09-08', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(50, 'HUA-PURA70U-512-BRN', 'Pura 70 Ultra', 12, 'FLAGSHIP', 49990.00, 16, 512, 'Chanson Green', 6, 'AVAILABLE', '2024-04-18', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(51, 'HUA-M60P-512-GRN', 'Mate 60 Pro', 12, 'FLAGSHIP', 39990.00, 12, 512, 'Green', 4, 'AVAILABLE', '2023-08-29', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(52, 'HUA-NOV12-256-BLU', 'Nova 12 SE', 12, 'MID_RANGE', 9990.00, 8, 256, 'Color No. 12', 18, 'AVAILABLE', '2024-03-20', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(53, 'HON-MG6P-512-EPI', 'Honor Magic 6 Pro', 13, 'FLAGSHIP', 39990.00, 12, 512, 'Epi Green', 9, 'AVAILABLE', '2024-01-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(54, 'HON-200P-512-OAS', 'Honor 200 Pro', 13, 'MID_RANGE', 19990.00, 12, 512, 'Ocean Cyan', 20, 'AVAILABLE', '2024-05-27', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(55, 'HON-X9B-256-ORG', 'Honor X9b 5G', 13, 'BUDGET', 9990.00, 12, 256, 'Sunrise Orange', 30, 'AVAILABLE', '2023-11-01', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(56, 'NOT-PH2-256-DRK', 'Nothing Phone (2)', 14, 'FLAGSHIP', 24990.00, 12, 256, 'Dark Grey', 12, 'AVAILABLE', '2023-07-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(57, 'NOT-PH2A-128-MIL', 'Nothing Phone (2a)', 14, 'MID_RANGE', 11490.00, 8, 128, 'Milk', 25, 'AVAILABLE', '2024-03-05', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(58, 'NOT-PH2AP-256-BLK', 'Nothing Phone (2a) Plus', 14, 'MID_RANGE', 13990.00, 12, 256, 'Metallic Grey', 18, 'AVAILABLE', '2024-07-31', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(59, 'INF-GT20P-256-MECH', 'Infinix GT 20 Pro', 15, 'MID_RANGE', 12999.00, 12, 256, 'Mecha Silver', 22, 'AVAILABLE', '2024-04-26', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(60, 'INF-NOT40P-256-GLD', 'Infinix Note 40 Pro 5G', 15, 'MID_RANGE', 8999.00, 8, 256, 'Vintage Green', 28, 'AVAILABLE', '2024-03-18', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(61, 'INF-HOT40-128-BLU', 'Infinix Hot 40 Pro', 15, 'BUDGET', 5499.00, 8, 128, 'Horizon Gold', 42, 'AVAILABLE', '2023-12-05', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(62, 'TEC-CMN30P-512-SLV', 'Camon 30 Premier 5G', 16, 'MID_RANGE', 14999.00, 12, 512, 'Alps Snowy Silver', 14, 'AVAILABLE', '2024-04-01', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(63, 'TEC-POVA6P-256-CYB', 'Pova 6 Pro 5G', 16, 'MID_RANGE', 8999.00, 12, 256, 'Comet Green', 24, 'AVAILABLE', '2024-02-26', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(64, 'TEC-SPK20P-128-GLD', 'Spark 20 Pro', 16, 'BUDGET', 4999.00, 8, 128, 'Sunset Blush', 38, 'AVAILABLE', '2023-12-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(65, 'POC-F6P-512-BLK', 'Poco F6 Pro', 17, 'FLAGSHIP', 17990.00, 12, 512, 'Black', 15, 'AVAILABLE', '2024-05-23', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(66, 'POC-X6P-256-YEL', 'Poco X6 Pro 5G', 17, 'MID_RANGE', 12290.00, 8, 256, 'Yellow', 28, 'AVAILABLE', '2024-01-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(67, 'POC-M6P-128-BLU', 'Poco M6 Pro', 17, 'BUDGET', 6499.00, 8, 128, 'Blue', 35, 'AVAILABLE', '2024-01-11', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(68, 'NOK-G42-128-SOO', 'Nokia G42 5G', 18, 'BUDGET', 6790.00, 6, 128, 'So Purple', 18, 'AVAILABLE', '2023-06-28', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(69, 'NOK-XR21-128-PIN', 'Nokia XR21', 18, 'MID_RANGE', 16900.00, 6, 128, 'Midnight Black', 10, 'AVAILABLE', '2023-05-03', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(70, 'NOK-C32-64-CHL', 'Nokia C32', 18, 'BUDGET', 3490.00, 4, 64, 'Charcoal', 0, 'DISCONTINUED', '2023-02-25', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(71, 'ZTE-NBZ60U-512-SLV', 'Nubia Z60 Ultra', 19, 'FLAGSHIP', 27990.00, 16, 512, 'Silver', 8, 'AVAILABLE', '2023-12-19', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(72, 'ZTE-RED9P-512-CYC', 'RedMagic 9 Pro', 19, 'FLAGSHIP', 31990.00, 16, 512, 'Cyclone', 11, 'AVAILABLE', '2023-11-23', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(73, 'LEN-LEG-Y90-256-GRY', 'Legion Y90', 20, 'FLAGSHIP', 23900.00, 12, 256, 'Titan Gray', 5, 'AVAILABLE', '2022-03-10', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(74, 'LEN-K14P-128-BLU', 'Lenovo K14 Plus', 20, 'BUDGET', 4290.00, 4, 128, 'Atmosphere Blue', 16, 'AVAILABLE', '2022-02-15', '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
(75, 'FAI-FP5-256-MBL', 'Fairphone 5', 21, 'MID_RANGE', 26900.00, 8, 256, 'Matte Black', 12, 'AVAILABLE', '2023-08-30', '2024-01-10 10:00:00', '2024-01-10 10:00:00');

