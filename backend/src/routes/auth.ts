import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/index';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  validatePasswordStrength,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken
} from '@/utils/auth';
import { authenticate } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('nome').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('planId').optional().isInt().withMessage('Plan ID must be a valid integer')
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { nome, email, password, planId } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Validate plan if provided
  if (planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId, ativo: true }
    });

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate email verification token
  const verificationToken = generateEmailVerificationToken();

  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senhaHash: hashedPassword,
        planId: planId || null,
        emailVerificado: false, // Will be true after email verification
        // Store verification token in metadata or separate table
      },
      select: {
        id: true,
        nome: true,
        email: true,
        planId: true,
        ativo: true,
        emailVerificado: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();

    // Store session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user,
        token,
        refreshToken
      }
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(email, verificationToken);

  } catch (error) {
    logger.error('Registration error:', error);
    throw createError('Failed to register user', 500);
  }
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      plan: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.ativo) {
    return res.status(401).json({
      success: false,
      message: 'Account has been deactivated. Please contact support.'
    });
  }

  // Check if account has expired
  if (user.expiresAt && user.expiresAt < new Date()) {
    return res.status(401).json({
      success: false,
      message: 'Account subscription has expired. Please renew your subscription.'
    });
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.senhaHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken();

  // Create session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { ultimoLogin: new Date() }
  });

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        planId: user.planId,
        plan: user.plan,
        ativo: user.ativo,
        emailVerificado: user.emailVerificado
      },
      token,
      refreshToken
    }
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Find session with refresh token
  const session = await prisma.userSession.findFirst({
    where: {
      refreshToken,
      isActive: true,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }

  // Check if user is still active
  if (!session.user.ativo) {
    return res.status(401).json({
      success: false,
      message: 'Account has been deactivated'
    });
  }

  // Generate new tokens
  const newToken = generateToken(session.user);
  const newRefreshToken = generateRefreshToken();

  // Update session
  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      refreshToken: newRefreshToken
    }
  });
}));

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    // Deactivate session
    await prisma.userSession.updateMany({
      where: {
        userId: req.user!.id,
        token
      },
      data: {
        isActive: false
      }
    });
  }

  logger.info(`User logged out: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  // Deactivate all user sessions
  await prisma.userSession.updateMany({
    where: {
      userId: req.user!.id
    },
    data: {
      isActive: false
    }
  });

  logger.info(`User logged out from all devices: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      nome: true,
      email: true,
      planId: true,
      ativo: true,
      emailVerificado: true,
      twoFactorEnabled: true,
      expiresAt: true,
      ultimoLogin: true,
      createdAt: true
    },
    include: {
      plan: {
        select: {
          id: true,
          nome: true,
          slug: true,
          precoMensal: true,
          precoAnual: true,
          limiteUsuarios: true,
          limiteSessoes: true,
          limiteFerramentas: true,
          recursos: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  }

  // Generate reset token
  const { token, hashedToken, expiresAt } = generatePasswordResetToken();

  // Store reset token (you might want to create a separate table for this)
  // For now, we'll use system settings or user metadata
  await prisma.systemSetting.upsert({
    where: { key: `password_reset_${user.id}` },
    update: {
      value: {
        hashedToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      }
    },
    create: {
      key: `password_reset_${user.id}`,
      value: {
        hashedToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      }
    }
  });

  logger.info(`Password reset requested for: ${email}`);

  // TODO: Send password reset email
  // await emailService.sendPasswordResetEmail(email, token);

  res.json({
    success: true,
    message: 'If an account with that email exists, we have sent a password reset link.'
  });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: passwordValidation.errors
    });
  }

  const hashedToken = hashToken(token);

  // Find user with valid reset token
  const resetTokens = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: 'password_reset_'
      }
    }
  });

  let userId: string | null = null;
  for (const tokenRecord of resetTokens) {
    const tokenData = tokenRecord.value as any;
    if (tokenData.hashedToken === hashedToken && new Date(tokenData.expiresAt) > new Date()) {
      userId = tokenRecord.key.replace('password_reset_', '');
      break;
    }
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: { senhaHash: hashedPassword }
  });

  // Delete reset token
  await prisma.systemSetting.deleteMany({
    where: { key: `password_reset_${userId}` }
  });

  // Invalidate all user sessions
  await prisma.userSession.updateMany({
    where: { userId },
    data: { isActive: false }
  });

  logger.info(`Password reset completed for user: ${userId}`);

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
}));

export default router;