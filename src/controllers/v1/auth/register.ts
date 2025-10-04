/**
 * Custom modules
 */
import { logger } from '@/lib/winston';
import config from '@/config/index';
import { genUsername } from '@/utils';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

/**
 * Models
 */
import User from '@/models/user';
import Token from '@/models/token';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { IUser } from '@/models/user';

// Pick<Type, Keys> เป็นยูทิลิตี้ประเภทใน TypeScript ที่สร้างประเภทใหม่โดยเลือกเฉพาะคุณสมบัติที่ระบุจากประเภทที่มีอยู่
// ในที่นี้ เราสร้างประเภท UserData ที่มีเฉพาะคุณสมบัติ email, password, และ role จากประเภท IUser
type UserData = Pick<IUser, 'email' | 'password' | 'role'>;

// ฟังก์ชัน async จะถูกแปลงให้คืนค่าเป็น Promise อัตโนมัติ เพื่อแทนงานอะซิงโครนัสที่อาจสำเร็จหรือผิดพลาดในอนาคต
// Promise คืออ็อบเจ็กต์ที่ให้เรารอผลลัพธ์ (resolve) หรือจัดการข้อผิดพลาด (reject) ผ่าน then/catch หรือ await
// การกำหนดเป็น Promise<void> หมายความว่ารองานเสร็จเหมือนเดิม แต่ไม่คาดหวังข้อมูลใดถูกส่งกลับเมื่อสำเร็จ
const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body as UserData;
  console.log(req.body);
  if (role === 'admin' && !config.WHITELIST_ADMINS_MAIL.includes(email)) {
    res.status(403).json({
      code: 'AuthorizationError',
      message: 'You cannot register as an admin',
    });

    logger.warn(
      `User with email ${email} tried to register as an admin but is not in the whitelist.`,
    );
    return;
  }

  try {
    const username = genUsername();

    const newUser = await User.create({
      username,
      email,
      password,
      role,
    });

    // Generate access token and refresh token for new user
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    // Store refresh token in db
    await Token.create({ token: refreshToken, userId: newUser._id });
    logger.info('Refresh token created for user', {
      userId: newUser._id,
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(201).json({
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });

    logger.info('User registered successfully', {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error during user registration: ', err);
  }
};

export default register;
