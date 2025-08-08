import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export const generateToken = (user: Pick<User, 'id' | 'email'>): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return {
    token,
    hashedToken,
    expiresAt
  };
};

/**
 * Hash token (for storing in database)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate 2FA secret
 */
export const generate2FASecret = (): string => {
  return crypto.randomBytes(20).toString('base32');
};

/**
 * Verify 2FA token
 */
export const verify2FAToken = (token: string, secret: string): boolean => {
  // Simple TOTP implementation - in production, use a library like 'speakeasy'
  const timeStep = Math.floor(Date.now() / 30000);
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(Buffer.from(timeStep.toString()));
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0') === token;
};