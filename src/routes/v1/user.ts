/**
 * Node modules
 */
import { Router } from 'express';
import { param, query, body } from 'express-validator';

/**
 * Middlewares
 */
import authenticate from '@/middlewares/authenticate';
import validationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';

/**
 * Controllers
 */
import getCurrentUser from '@/controllers/v1/user/get_current_user';

/**
 * Models
 */
import User from '@/models/user';

const router = Router();

// authenticate ตรวจสอบ token เพื่อยืนยันตัวตนของผู้ใช้ก่อนให้เข้าถึงเส้นทาง
// authorize จำกัดสิทธิ์ให้เฉพาะบทบาทที่ถูกระบุเท่านั้น
router.get('/current', authenticate, authorize(['admin', 'user']), getCurrentUser);

export default router;
