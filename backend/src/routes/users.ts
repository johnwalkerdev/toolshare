import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/index';
import { authenticate, requirePlan } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { hashPassword, validatePasswordStrength } from '@/utils/auth';
import { logger } from '@/utils/logger';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      uuid: true,
      nome: true,
      email: true,
      planId: true,
      ativo: true,
      emailVerificado: true,
      twoFactorEnabled: true,
      expiresAt: true,
      ultimoLogin: true,
      createdAt: true,
      updatedAt: true
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
      },
      teamUsers: {
        where: { ativo: true },
        include: {
          team: {
            select: {
              id: true,
              nome: true,
              slug: true,
              ativo: true
            }
          }
        }
      },
      ownedTeams: {
        select: {
          id: true,
          nome: true,
          slug: true,
          ativo: true,
          limiteUsuarios: true,
          _count: {
            select: {
              teamUsers: {
                where: { ativo: true }
              }
            }
          }
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
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, [
  body('nome').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
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

  const { nome, email } = req.body;
  const updateData: any = {};

  if (nome) updateData.nome = nome;
  if (email) {
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: req.user!.id }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use by another account'
      });
    }

    updateData.email = email;
    updateData.emailVerificado = false; // Reset verification when email changes
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
    select: {
      id: true,
      nome: true,
      email: true,
      planId: true,
      ativo: true,
      emailVerificado: true,
      updatedAt: true
    }
  });

  logger.info(`User profile updated: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
}));

/**
 * PUT /api/users/change-password
 * Change user password
 */
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
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

  const { currentPassword, newPassword } = req.body;

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      senhaHash: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const { comparePassword } = await import('@/utils/auth');
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.senhaHash);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'New password does not meet security requirements',
      errors: passwordValidation.errors
    });
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { senhaHash: hashedNewPassword }
  });

  // Invalidate all other sessions (keep current session active)
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  await prisma.userSession.updateMany({
    where: {
      userId: req.user!.id,
      token: { not: currentToken }
    },
    data: { isActive: false }
  });

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully. Other sessions have been logged out.'
  });
}));

/**
 * GET /api/users/usage-stats
 * Get user usage statistics
 */
router.get('/usage-stats', authenticate, asyncHandler(async (req, res) => {
  const { timeframe = '30d' } = req.query;

  // Calculate date range
  let startDate: Date;
  switch (timeframe) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get usage statistics
  const [totalSessions, completedSessions, totalDuration, toolUsage, recentSessions] = await Promise.all([
    // Total sessions
    prisma.accessLog.count({
      where: {
        userId: req.user!.id,
        startedAt: { gte: startDate }
      }
    }),

    // Completed sessions
    prisma.accessLog.count({
      where: {
        userId: req.user!.id,
        startedAt: { gte: startDate },
        status: 'completed'
      }
    }),

    // Total duration
    prisma.accessLog.aggregate({
      where: {
        userId: req.user!.id,
        startedAt: { gte: startDate },
        durationSeconds: { not: null }
      },
      _sum: {
        durationSeconds: true
      }
    }),

    // Tool usage breakdown
    prisma.accessLog.groupBy({
      by: ['toolId'],
      where: {
        userId: req.user!.id,
        startedAt: { gte: startDate },
        toolId: { not: null }
      },
      _count: {
        id: true
      },
      _sum: {
        durationSeconds: true
      }
    }),

    // Recent sessions
    prisma.accessLog.findMany({
      where: {
        userId: req.user!.id,
        startedAt: { gte: startDate }
      },
      include: {
        tool: {
          select: {
            id: true,
            nome: true,
            icone: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    })
  ]);

  // Get tool details for usage breakdown
  const toolIds = toolUsage.map(usage => usage.toolId).filter(Boolean) as number[];
  const tools = await prisma.tool.findMany({
    where: { id: { in: toolIds } },
    select: {
      id: true,
      nome: true,
      icone: true,
      categoria: {
        select: {
          id: true,
          nome: true,
          cor: true
        }
      }
    }
  });

  // Merge tool data with usage stats
  const toolUsageWithDetails = toolUsage.map(usage => {
    const tool = tools.find(t => t.id === usage.toolId);
    return {
      tool,
      sessions: usage._count.id,
      totalDuration: usage._sum.durationSeconds || 0
    };
  });

  const stats = {
    summary: {
      totalSessions,
      completedSessions,
      failedSessions: totalSessions - completedSessions,
      totalDuration: totalDuration._sum.durationSeconds || 0,
      averageSessionDuration: totalSessions > 0 ? Math.round((totalDuration._sum.durationSeconds || 0) / totalSessions) : 0
    },
    toolUsage: toolUsageWithDetails.sort((a, b) => b.sessions - a.sessions),
    recentSessions,
    timeframe
  };

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/users/sessions
 * Get user active sessions
 */
router.get('/sessions', authenticate, asyncHandler(async (req, res) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId: req.user!.id,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { sessions }
  });
}));

/**
 * DELETE /api/users/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId: req.user!.id
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Session revoked successfully'
  });
}));

/**
 * GET /api/users/available-tools
 * Get tools available to current user based on their plan
 */
router.get('/available-tools', authenticate, asyncHandler(async (req, res) => {
  const { category } = req.query;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { plan: true }
  });

  if (!user || !user.plan) {
    return res.status(403).json({
      success: false,
      message: 'Valid subscription plan required'
    });
  }

  // Build where clause
  const whereClause: any = {
    ativo: true,
    planosPermitidos: {
      has: user.plan.id
    }
  };

  if (category) {
    whereClause.categoria = {
      slug: category
    };
  }

  const tools = await prisma.tool.findMany({
    where: whereClause,
    include: {
      categoria: {
        select: {
          id: true,
          nome: true,
          slug: true,
          cor: true,
          icone: true
        }
      },
      _count: {
        select: {
          accessLogs: {
            where: {
              status: 'active'
            }
          }
        }
      }
    },
    orderBy: [
      { categoria: { ordem: 'asc' } },
      { nome: 'asc' }
    ]
  });

  // Check current active sessions for each tool
  const toolsWithStatus = await Promise.all(
    tools.map(async (tool) => {
      const activeSessions = await prisma.accessLog.count({
        where: {
          toolId: tool.id,
          status: 'active'
        }
      });

      const userActiveSession = await prisma.accessLog.findFirst({
        where: {
          toolId: tool.id,
          userId: req.user!.id,
          status: 'active'
        }
      });

      return {
        ...tool,
        activeSessions,
        isUserActive: !!userActiveSession,
        isAvailable: activeSessions < tool.limiteUsuarios
      };
    })
  );

  res.json({
    success: true,
    data: { tools: toolsWithStatus }
  });
}));

/**
 * GET /api/users/plan-limits
 * Get current user's plan limits and usage
 */
router.get('/plan-limits', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { plan: true }
  });

  if (!user || !user.plan) {
    return res.status(403).json({
      success: false,
      message: 'Valid subscription plan required'
    });
  }

  // Get current usage
  const [activeSessions, totalTeamMembers] = await Promise.all([
    prisma.accessLog.count({
      where: {
        userId: req.user!.id,
        status: 'active'
      }
    }),
    prisma.teamUser.count({
      where: {
        team: {
          ownerUserId: req.user!.id
        },
        ativo: true
      }
    })
  ]);

  const limits = {
    plan: user.plan,
    usage: {
      activeSessions,
      totalTeamMembers,
      maxSessions: user.plan.limiteSessoes || 0,
      maxUsers: user.plan.limiteUsuarios || 0,
      maxTools: user.plan.limiteFerramentas || null // null means unlimited
    },
    available: {
      sessions: Math.max(0, (user.plan.limiteSessoes || 0) - activeSessions),
      teamSlots: Math.max(0, (user.plan.limiteUsuarios || 0) - totalTeamMembers - 1) // -1 for owner
    }
  };

  res.json({
    success: true,
    data: limits
  });
}));

export default router;