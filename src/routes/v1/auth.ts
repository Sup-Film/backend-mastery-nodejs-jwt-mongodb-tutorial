/**
 * Node moduels
 */
import { Router } from 'express';
import { body, cookie } from 'express-validator';
import bcrypt from 'bcryptjs';

/**
 * Controllers
 */
import register from '@/controllers/v1/auth/register';
import login from '@/controllers/v1/auth/login';
import refreshToken from '@/controllers/v1/auth/refresh_token';
import logout from '@/controllers/v1/auth/logout';

/**
 * Middlewares
 */
import validationError from '@/middlewares/validationError';
import authenticate from '@/middlewares/authenticate';

/**
 * Models
 */
import User from '@/models/user';

const router = Router();

// แกนหลักของ validationError คือทำให้ทุกเส้นทางที่ใช้ express-validator ส่งมาตรฐาน error response เดียวกัน (code: 'ValidationError' พร้อม object รายละเอียดแต่ละ field)
router.post(
  '/register',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isLength({ max: 50 })
    .withMessage('Email must be less than 50 characters')
    .isEmail()
    .withMessage('Invalid email address')
    // Custom validator สำหรับตรวจสอบว่ามี email นี้ในระบบหรือไม่
    .custom(async (value) => {
      const userExists = await User.exists({ email: value });
      if (userExists) {
        throw new Error('User email or password is invalid');
      }
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .optional()
    .isString()
    .withMessage('Role must be a string')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  validationError,
  register,
);

router.post(
  '/login',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isLength({ max: 50 })
    .withMessage('Email must be less than 50 characters')
    .isEmail()
    .withMessage('Invalid email address')
    // Custom validator สำหรับตรวจสอบว่ามี email นี้ในระบบหรือไม่
    .custom(async (value) => {
      const userExists = await User.exists({ email: value });
      if (!userExists) {
        throw new Error('User email or password is invalid');
      }
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    // Custom validator สำหรับตรวจสอบความถูกต้องของรหัสผ่าน
    .custom(async (value, { req }) => {
      const { email } = req.body as { email: string };
      const user = await User.findOne({ email })
        .select('password')
        .lean()
        .exec();

      if (!user) {
        throw new Error('User email or password is invalid');
      }

      const passwordMatch = await bcrypt.compare(value, user.password);
      if (!passwordMatch) {
        throw new Error('User email or password is invalid');
      }
    }),
  validationError,
  login,
);

router.post(
  '/refresh-token',
  cookie('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token'),
  validationError,
  refreshToken,
);

router.post('/logout', authenticate,logout);

export default router;
