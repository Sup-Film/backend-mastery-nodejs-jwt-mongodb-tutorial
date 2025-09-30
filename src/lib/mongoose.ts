/**
 * Node modules
 */
import mongoose from 'mongoose';

/**
 * Custom modules
 */
import config from '@/config';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { ConnectOptions } from 'mongoose';

/**
 * Client option
 */
const clientoptions: ConnectOptions = {
  dbName: 'blog-db',
  appName: 'Blog API',
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
};

/**
 * สร้างการเชื่อมต่อกับฐานข้อมูล MongoDB โดยใช้ Mongoose
 * หากเกิดข้อผิดพลาดระหว่างการเชื่อมต่อ ระบบจะโยนข้อผิดพลาด
 * พร้อมข้อความที่อธิบายได้ชัดเจน
 *
 * - ใช้ `MONGO_URI` เป็นสตริงสำหรับการเชื่อมต่อ
 * - `clientOptions` เก็บการตั้งค่าเพิ่มเติมสำหรับ Mongoose
 * - จัดการข้อผิดพลาดและโยนต่อเพื่อช่วยให้ดีบักง่ายขึ้น
 */
export const connectToDatabase = async (): Promise<void> => {
  if (!config.MONGO_URI) {
    throw new Error('MongoDB URI is not defined in the configuration.');
  }

  try {
    await mongoose.connect(config.MONGO_URI, clientoptions);

    logger.info('Connected to MongoDB successfully.', {
      uri: config.MONGO_URI,
      options: clientoptions,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    logger.error('Error connecting to the database', err);
  }
};

/**
 * ตัดการเชื่อมต่อจากฐานข้อมูล MongoDB ผ่าน Mongoose
 *
 * - เรียกใช้ `mongoose.disconnect()` แบบอะซิงโครนัสเพื่อปิดคอนเนกชันอย่างถูกต้อง
 * - หากตัดการเชื่อมต่อสำเร็จ จะแจ้งผลบนคอนโซลเพื่อให้มั่นใจว่าระบบทำงานเรียบร้อย
 * - หากเกิดข้อผิดพลาด จะโยนข้อผิดพลาดต่อเมื่อเป็นอินสแตนซ์ของ `Error` หรือบันทึกไว้เพื่อช่วยวิเคราะห์ปัญหา
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();

    logger.info('Disconnected from the database successfully.', {
      uri: config.MONGO_URI,
      options: clientoptions,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }

    logger.error('Error disconnecting from the database', err);
  }
};
