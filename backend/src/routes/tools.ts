import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '@/index';
import { authenticate, requirePlan } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = express.Router();

/**
 * GET /api/tools
 * Get all available tools with filtering and pagination
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('planId').optional().isInt().withMessage('Plan ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const search = req.query.search as string;
  const planId = req.query.planId ? parseInt(req.query.planId as string) : null;

  // Build where clause
  const whereClause: any = {
    ativo: true
  };

  if (category) {
    whereClause.categoria = {
      slug: category
    };
  }

  if (search) {
    whereClause.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (planId) {
    whereClause.planosPermitidos = {
      has: planId
    };
  }

  // Get tools with pagination
  const [tools, totalCount] = await Promise.all([
    prisma.tool.findMany({
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
      ],
      skip: offset,
      take: limit
    }),
    prisma.tool.count({ where: whereClause })
  ]);

  // Add availability status for each tool
  const toolsWithStatus = tools.map(tool => ({
    ...tool,
    activeSessions: tool._count.accessLogs,
    isAvailable: tool._count.accessLogs < tool.limiteUsuarios
  }));

  const pagination = {
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    hasNext: page < Math.ceil(totalCount / limit),
    hasPrev: page > 1
  };

  res.json({
    success: true,
    data: {
      tools: toolsWithStatus,
      pagination
    }
  });
}));

/**
 * GET /api/tools/categories
 * Get all tool categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.toolCategory.findMany({
    where: { ativo: true },
    include: {
      _count: {
        select: {
          tools: {
            where: { ativo: true }
          }
        }
      }
    },
    orderBy: { ordem: 'asc' }
  });

  res.json({
    success: true,
    data: { categories }
  });
}));

/**
 * GET /api/tools/:id
 * Get specific tool details
 */
router.get('/:id', [
  param('id').isInt().withMessage('Tool ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const toolId = parseInt(req.params.id);

  const tool = await prisma.tool.findUnique({
    where: { id: toolId, ativo: true },
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
      proxy: {
        select: {
          id: true,
          nome: true,
          regiao: true,
          latenciaMedia: true,
          uptimePercentage: true
        }
      },
      _count: {
        select: {
          accessLogs: {
            where: {
              status: 'active'
            }
          },
          toolAccounts: {
            where: { ativo: true }
          }
        }
      }
    }
  });

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found'
    });
  }

  // Get recent usage statistics
  const recentStats = await prisma.accessLog.groupBy({
    by: ['status'],
    where: {
      toolId: tool.id,
      startedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    _count: {
      id: true
    }
  });

  const statsMap = recentStats.reduce((acc, stat) => {
    acc[stat.status || 'unknown'] = stat._count.id;
    return acc;
  }, {} as Record<string, number>);

  const toolWithStats = {
    ...tool,
    activeSessions: tool._count.accessLogs,
    availableAccounts: tool._count.toolAccounts,
    isAvailable: tool._count.accessLogs < tool.limiteUsuarios,
    recentStats: {
      active: statsMap.active || 0,
      completed: statsMap.completed || 0,
      failed: statsMap.failed || 0,
      timeout: statsMap.timeout || 0
    }
  };

  res.json({
    success: true,
    data: { tool: toolWithStats }
  });
}));

/**
 * POST /api/tools/:id/access
 * Request access to a tool
 */
router.post('/:id/access', authenticate, [
  param('id').isInt().withMessage('Tool ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const toolId = parseInt(req.params.id);
  const userId = req.user!.id;

  // Get tool with plan requirements
  const tool = await prisma.tool.findUnique({
    where: { id: toolId, ativo: true },
    include: {
      proxy: true,
      categoria: {
        select: { nome: true }
      }
    }
  });

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found'
    });
  }

  // Get user with plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true }
  });

  if (!user || !user.plan) {
    return res.status(403).json({
      success: false,
      message: 'Valid subscription plan required'
    });
  }

  // Check if user's plan allows access to this tool
  if (!tool.planosPermitidos.includes(user.plan.id)) {
    return res.status(403).json({
      success: false,
      message: 'Your current plan does not include access to this tool',
      requiredPlans: tool.planosPermitidos
    });
  }

  // Check if user already has an active session for this tool
  const existingSession = await prisma.accessLog.findFirst({
    where: {
      userId,
      toolId,
      status: 'active'
    }
  });

  if (existingSession) {
    return res.status(409).json({
      success: false,
      message: 'You already have an active session for this tool',
      sessionId: existingSession.id
    });
  }

  // Check tool availability
  const activeSessions = await prisma.accessLog.count({
    where: {
      toolId,
      status: 'active'
    }
  });

  if (activeSessions >= tool.limiteUsuarios) {
    return res.status(503).json({
      success: false,
      message: 'Tool is currently at maximum capacity. Please try again later.',
      waitTime: 'estimated 5-10 minutes'
    });
  }

  // Check user's session limits
  const userActiveSessions = await prisma.accessLog.count({
    where: {
      userId,
      status: 'active'
    }
  });

  if (userActiveSessions >= (user.plan.limiteSessoes || 0)) {
    return res.status(403).json({
      success: false,
      message: 'You have reached your concurrent session limit',
      limit: user.plan.limiteSessoes
    });
  }

  // Resolve proxy (implement proxy hierarchy)
  let selectedProxy = tool.proxy;

  // TODO: Implement proxy hierarchy resolution
  // 1. User-specific proxy
  // 2. Team-specific proxy  
  // 3. Tool default proxy
  // 4. Global proxy

  if (!selectedProxy) {
    return res.status(503).json({
      success: false,
      message: 'No proxy available for this tool'
    });
  }

  // Get available tool account
  const availableAccount = await prisma.toolAccount.findFirst({
    where: {
      toolId,
      ativo: true
    },
    orderBy: {
      ultimoUso: 'asc' // Use least recently used account
    }
  });

  if (!availableAccount) {
    return res.status(503).json({
      success: false,
      message: 'No accounts available for this tool'
    });
  }

  // Create access log
  const accessLog = await prisma.accessLog.create({
    data: {
      userId,
      toolId,
      proxyId: selectedProxy.id,
      status: 'active',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        accountId: availableAccount.id,
        requestedAt: new Date().toISOString()
      }
    }
  });

  // Update tool account last use
  await prisma.toolAccount.update({
    where: { id: availableAccount.id },
    data: { ultimoUso: new Date() }
  });

  logger.info(`User ${user.email} started session for tool ${tool.nome}`, {
    toolId,
    userId,
    sessionId: accessLog.id,
    proxyId: selectedProxy.id
  });

  // Generate access URL or return connection details
  const accessInfo = {
    sessionId: accessLog.id,
    tool: {
      id: tool.id,
      nome: tool.nome,
      urlAcesso: tool.urlAcesso,
      icone: tool.icone
    },
    proxy: {
      host: selectedProxy.host,
      porta: selectedProxy.porta,
      tipo: selectedProxy.tipo,
      regiao: selectedProxy.regiao
    },
    account: {
      email: availableAccount.email,
      // Don't send actual password/tokens to client
    },
    timeoutSeconds: tool.timeoutSessao,
    startedAt: accessLog.startedAt
  };

  res.status(201).json({
    success: true,
    message: `Access granted to ${tool.nome}`,
    data: accessInfo
  });
}));

/**
 * PUT /api/tools/:id/access/:sessionId/end
 * End an active tool session
 */
router.put('/:id/access/:sessionId/end', authenticate, [
  param('id').isInt().withMessage('Tool ID must be an integer'),
  param('sessionId').isString().withMessage('Session ID must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const toolId = parseInt(req.params.id);
  const sessionId = req.params.sessionId;
  const userId = req.user!.id;

  // Find the session
  const session = await prisma.accessLog.findUnique({
    where: { id: sessionId },
    include: {
      tool: { select: { nome: true } },
      user: { select: { email: true } }
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if user owns the session or is admin
  if (session.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only end your own sessions'
    });
  }

  // Check if session is still active
  if (session.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Session is not active',
      currentStatus: session.status
    });
  }

  // Calculate duration
  const endedAt = new Date();
  const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

  // Update session
  await prisma.accessLog.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      endedAt,
      durationSeconds,
      metadata: {
        ...session.metadata as any,
        endedAt: endedAt.toISOString(),
        endedBy: 'user'
      }
    }
  });

  logger.info(`Session ended for tool ${session.tool?.nome}`, {
    toolId,
    userId,
    sessionId,
    durationSeconds
  });

  res.json({
    success: true,
    message: 'Session ended successfully',
    data: {
      sessionId,
      durationSeconds,
      endedAt
    }
  });
}));

/**
 * GET /api/tools/:id/queue
 * Get queue information for a tool
 */
router.get('/:id/queue', [
  param('id').isInt().withMessage('Tool ID must be an integer')
], asyncHandler(async (req, res) => {
  const toolId = parseInt(req.params.id);

  const tool = await prisma.tool.findUnique({
    where: { id: toolId, ativo: true },
    select: {
      id: true,
      nome: true,
      limiteUsuarios: true
    }
  });

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found'
    });
  }

  // Get current active sessions
  const activeSessions = await prisma.accessLog.count({
    where: {
      toolId,
      status: 'active'
    }
  });

  // Get average session duration for estimates
  const avgDuration = await prisma.accessLog.aggregate({
    where: {
      toolId,
      status: 'completed',
      durationSeconds: { not: null },
      startedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    _avg: {
      durationSeconds: true
    }
  });

  const queueInfo = {
    tool: {
      id: tool.id,
      nome: tool.nome
    },
    capacity: {
      limit: tool.limiteUsuarios,
      active: activeSessions,
      available: Math.max(0, tool.limiteUsuarios - activeSessions)
    },
    estimatedWaitTime: activeSessions >= tool.limiteUsuarios 
      ? Math.round((avgDuration._avg.durationSeconds || 1800) / 60) // Convert to minutes
      : 0,
    isAvailable: activeSessions < tool.limiteUsuarios
  };

  res.json({
    success: true,
    data: queueInfo
  });
}));

/**
 * GET /api/tools/popular
 * Get most popular tools
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('timeframe').optional().isIn(['24h', '7d', '30d']).withMessage('Timeframe must be 24h, 7d, or 30d')
], asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const timeframe = req.query.timeframe as string || '7d';

  // Calculate date range
  let startDate: Date;
  switch (timeframe) {
    case '24h':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  // Get tools with usage statistics
  const popularTools = await prisma.tool.findMany({
    where: { ativo: true },
    include: {
      categoria: {
        select: {
          id: true,
          nome: true,
          cor: true,
          icone: true
        }
      },
      _count: {
        select: {
          accessLogs: {
            where: {
              startedAt: { gte: startDate }
            }
          }
        }
      }
    },
    orderBy: {
      accessLogs: {
        _count: 'desc'
      }
    },
    take: limit
  });

  res.json({
    success: true,
    data: {
      tools: popularTools.map(tool => ({
        ...tool,
        usageCount: tool._count.accessLogs
      })),
      timeframe
    }
  });
}));

export default router;