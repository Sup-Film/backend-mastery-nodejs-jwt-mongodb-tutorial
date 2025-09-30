/**
 * Node modules
 */
import winston from "winston";

/**
 * Custom modules
 */
import config from "@/config";

const { combine, timestamp, json, errors, align, printf, colorize } = winston.format;

// กำหนดอาร์เรย์ `transports` สำหรับเก็บรูปแบบการส่งออก log ที่หลากหลาย
const transports: winston.transport[] = [];

// หากแอปไม่ได้รันในโหมด production ให้เพิ่มการส่งออก log ผ่านคอนโซล
if (config.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // เพิ่มสีสันให้กับข้อความ log ทั้งหมด
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // กำหนดรูปแบบของ timestamp
        align(), // จัดข้อความให้ตรงกัน
        printf(({ timestamp, level, message, ...meta}) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta)}` : '';

          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  )
}

// Create a logger instance using Winston
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info', // กำหนดค่าเริ่มต้นของระดับ log
  format: combine(timestamp(), errors({ stack: true}), json()), // กำหนดรูปแบบของ log ให้เป็น JSON
  transports, // ใช้อาร์เรย์ `transports` ที่กำหนดไว้ก่อนหน้า
  silent: config.NODE_ENV === 'test', // ปิดการทำงานของ logger ในโหมดทดสอบ
})

export { logger };