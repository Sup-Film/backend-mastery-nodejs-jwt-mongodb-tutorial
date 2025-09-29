/**
 * Node modules
 */
import { rateLimit } from 'express-rate-limit';

// มิดเดิลแวร์จำกัดจำนวนคำขอ ช่วยกันไม่ให้บริการถูกยิงถี่เกินไป
// กำหนดโควต้าในช่วงเวลาที่ชัดเจนเพื่อลดพฤติกรรมใช้งานผิดปกติหรือการโจมตี
const limiter = rateLimit({
  windowMs: 60000, // จับจำนวนคำขอทั้งหมดภายในกรอบเวลา 1 นาที
  limit: 60, // ให้แต่ละ IP ส่งคำขอได้ไม่เกิน 60 ครั้งในกรอบเวลาด้านบน
  standardHeaders: 'draft-8', // ส่งสถานะโควต้าตามสเปกระบุอัตราการจำกัดล่าสุด
  legacyHeaders: false, // ไม่ส่งเฮดเดอร์ X-RateLimit แบบเดิมที่เลิกใช้งานแล้ว
  message: {
    error:
      'You have sent too many request in a given amount of time. Please try again later.',
  },
});

export default limiter;
