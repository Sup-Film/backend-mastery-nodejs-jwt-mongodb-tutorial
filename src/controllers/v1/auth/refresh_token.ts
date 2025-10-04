/**
 * Node moduels
 */
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom modules
 */
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';

/**
 * Models
 */
import Token from '@/models/token';

/**
 * Types
 */
import type { Request, Response } from 'express';
import { Types } from 'mongoose';

const refreshToken = async (req: Request, res: Response) => {
  // อ่าน refresh token ที่ฝั่งไคลเอนต์ส่งมาทางคุกกี้
  const refreshToken = req.cookies.refreshToken as string;

  try {
    // ตรวจสอบว่า refresh token ยังมีอยู่ในที่จัดเก็บโทเคน
    const tokenExists = await Token.exists({ token: refreshToken });

    if (!tokenExists) {
      // หากไม่พบโทเคน ให้ปฏิเสธคำขอและหยุดการประมวลผลทันที
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Invalid refresh token',
      });
      return;
    }

    // ตรวจสอบลายเซ็นของ refresh token และดึง payload เพื่อหา user id
    const jwtPayload = verifyRefreshToken(refreshToken) as {
      userId: Types.ObjectId;
    };

    // ออก access token ใหม่ที่อ้างอิงกับ user id เดิม
    const accessToken = generateAccessToken(jwtPayload.userId);

    // ส่งกลับ access token ตัวใหม่ให้ฝั่งไคลเอนต์
    res.status(200).json({
      accessToken,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      // ส่งสถานะ 401 หาก refresh token ยังถูกต้องแต่หมดอายุแล้ว
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Refresh token has expired, please login again',
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      // จัดการกรณีโทเคนไม่ถูกต้องและปฏิเสธคำขอ
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Invalid refresh token',
      });
      return;
    }

    // หากเกิดข้อผิดพลาดอื่น ให้ตอบกลับเป็นข้อผิดพลาดฝั่งเซิร์ฟเวอร์และบันทึกรายละเอียดไว้
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error during refresh token', err);
  }
};

export default refreshToken;

