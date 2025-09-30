/**
 * Node modules
 */
import jwt from 'jsonwebtoken';

/**
 * Custom modules
 */
import config from '@/config/index';

/**
 * Types
 */
import { Types } from 'mongoose';

export const generateAccessToken = (userId: Types.ObjectId): string => {
  const secret = config.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT access secret is not defined in configuration.');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY,
    subject: 'accessApi',
  });
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  const secret = config.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT refresh secret is not defined in configuration.');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: config.REFRESH_TOKEN_EXPIRY,
    subject: 'refreshApi',
  });
};