/**
 * Node modules
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

/**
 * Custom modules
 */
import config from '@/config';
import limiter from '@/lib/express_rate_limit';

/**
 * Router
 */
import v1Router from '@/routes/v1';

/**
 * Types
 */
import type { CorsOptions } from 'cors';

/**
 * Express app initial
 */
const app = express();

// Configure CORS options
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // callback จะต้องมีสองพารามิเตอร์ คือ error และ allowed
    // ถ้า allow เป็น false จะไม่อนุญาตให้เข้าถึง
    // ถ้า allow เป็น true จะอนุญาตให้เข้าถึง
    // callback(new Error('CORS Error'), false);

    if (
      config.NODE_ENV === 'development' ||
      !origin ||
      config.WHITELIST_ORIGINS.includes(origin)
    ) {
      callback(null, true); // อนุญาตให้เข้าถึง
    } else {
      callback(
        new Error(`CORS error: ${origin} is not allowed by CORS`),
        false,
      ); // ไม่อนุญาตให้เข้าถึง
      console.log(`CORS error: ${origin} is not allowed by CORS`);
    }
  },
};

// Apply CORS middleware
// ใช้เพื่ออนุญาตการเข้าถึงจากโดเมนอื่น
app.use(cors(corsOptions));

// Enable JSON request body parsing
app.use(express.json());

// Enable URL-encoded request body parsing with extended mode
// `extended: true` ตั้งค่า extended เป็น true ทำให้ Express ใช้ไลบรารี qs ในการแปลงข้อมูลจากฟอร์ม/คิวรีสตริง จึงสามารถตีความค่าเป็นวัตถุหรืออาร์เรย์ซ้อนกัน (เช่น user[name]=John หรือ items[]=1&items[]=2) ได้. ถ้าตั้งเป็น false จะใช้ไลบรารี querystring ของ Node ที่รองรับเฉพาะคู่ key-value แบบพื้นๆ.
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Enable response compression to reduce payload size and improve preformance
// ใช้เพื่อลดขนาดของข้อมูลที่ส่งกลับไปยังไคลเอนต์ เพื่อเพิ่มประสิทธิภาพในการโหลดหน้าเว็บ
app.use(
  compression({
    threshold: 1024, // ขนาดไฟล์ขั้นต่ำที่ต้องการบีบอัด (หน่วยเป็นไบต์) ถ้าไฟล์มีขนาดเล็กกว่านี้จะไม่บีบอัด (ในที่นี้คือ 1KB)
  }),
);

// Use Helmet to enhance security by setting various HTTP headers
// ใช้เพื่อเพิ่มความปลอดภัยให้กับแอปพลิเคชันโดยการตั้งค่า HTTP headers ที่เกี่ยวข้องกับความปลอดภัยต่างๆ
app.use(helmet());

// Apply rate limiting middleware to prevent excessive requests and enhance security
// ใช้เพื่อลดความเสี่ยงจากการโจมตีแบบ brute-force หรือ denial-of-service (DoS) โดยการจำกัดจำนวนคำขอที่ไคลเอนต์สามารถส่งมาในช่วงเวลาที่กำหนด
app.use(limiter);

/**
 * ฟังก์ชัน Async แบบ IIFE ที่เรียกทันทีเพื่อเริ่มต้นเซิร์ฟเวอร์
 *
 * - พยายามเชื่อมต่อฐานข้อมูลก่อนเปิดเซิร์ฟเวอร์
 * - กำหนดเส้นทาง API (`/api/v1`)
 * - เปิดเซิร์ฟเวอร์ด้วย PORT ที่ตั้งไว้และพิมพ์ URL ที่กำลังทำงาน
 * - หากเริ่มต้นล้มเหลวจะแสดงข้อผิดพลาดและออกจากโปรเซสด้วยสถานะ 1
 */
(async () => {
  try {
    app.use('/api/v1', v1Router);

    app.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.log('Failed to start the server', error);

    if (config.NODE_ENV === 'production') {
      process.exit(1); // ออกจากโปรเซสด้วยรหัส 1 เพื่อไม่ให้โปรเซสค้างในสถานะผิดพลาด และทำการรีสตาร์ทโดยระบบจัดการโปรเซส เช่น PM2 หรือ Docker
    }
  }
})();

/**
 * ปิดเซิร์ฟเวอร์อย่างปลอดภัยด้วยการตัดคอนเนกชันฐานข้อมูลก่อน
 *
 * - พยายามตัดการเชื่อมต่อจากฐานข้อมูลเพื่อไม่ให้มีคอนเนกชันค้าง
 * - ตัดสำเร็จแล้วพิมพ์ข้อความยืนยันบนคอนโซลให้รู้ว่างานเรียบร้อย
 * - ถ้าเจอปัญหาระหว่างตัดการเชื่อมต่อให้บันทึกข้อผิดพลาดไว้
 * - ปิดโปรเซสด้วยรหัสสถานะ `0` เพื่อสื่อว่าปิดระบบจบอย่างปกติ
 */
const handleServerShutdown = async () => {
  try {
    console.log('Server SHUTDOWN');
    process.exit(0);
  } catch (err) {
    console.log('Error during server shutdown', err)
  }
};

/**
 * ฟังสัญญาณสั่งหยุดโปรเซส (`SIGTERM` และ `SIGINT`)
 *
 * - `SIGTERM`: มักถูกส่งเมื่อมีการสั่งหยุดโปรเซส (เช่นคำสั่ง `kill` หรือปิดคอนเทนเนอร์)
 * - `SIGINT`: เกิดเมื่อผู้ใช้ขัดจังหวะโปรเซส (เช่นกด `Ctrl+C` บนเทอร์มินัล)
 * - เมื่อรับสัญญาณใดสัญญาณหนึ่งจะเรียก `handleServerShutdown` เพื่อทำความสะอาดและปิดระบบให้ถูกต้อง
 */
process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);