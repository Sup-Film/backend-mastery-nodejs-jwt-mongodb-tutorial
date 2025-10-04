/**
 * Node modules
 */
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom modules
 */
import { verifyAccessToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';

/**
 * @function authenticate
 * @description มิดเดิลแวร์สำหรับตรวจสอบโทเคนจากหัวข้อ Authorization หากโทเคนถูกต้องจะผูก ID ของผู้ใช้ไว้กับออบเจ็กต์ request หากไม่ถูกต้องจะคืนข้อความผิดพลาดที่เหมาะสม
 *
 * @param {Request} req - ออบเจ็กต์ Request ของ Express ที่คาดว่าจะมีโทเคน Bearer ในหัวข้อ Authorization
 * @param {Response} res - ออบเจ็กต์ Response ของ Express ใช้ส่งกลับเมื่อการยืนยันตัวตนล้มเหลว
 * @param {NextFunction} next - ฟังก์ชัน next ของ Express เพื่อส่งต่อไปยังมิดเดิลแวร์ถัดไป
 * @returns {void}
 */
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // If there's no Bearer token, response with 401 Unauthorized
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'AuthenticationError',
      message: 'Access denied, no token provided',
    });
    return;
  }

  // Split out the token from the 'Bearer' prefix
  const [_, token] = authHeader.split(' ');

  try {
    // Verify the token and extract the userId from the payload
    const jwtPayload = verifyAccessToken(token) as { userId: Types.ObjectId };

    // Attact the userId to the request object for later use
    req.userId = jwtPayload.userId;

    // Process to the next middleware or route handler
    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Access token expired, request a new one with refresh token',
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Access token invalid',
      });
      return;
    }

    // Catch-all for other errors
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error during authentication', err);
  }
};

export default authenticate;
