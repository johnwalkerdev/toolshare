import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '@/index';
import { authenticate, requireAdmin, requirePlan } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/proxies
 * Get all proxies (admin only)
 */
router.get('/', authenticate, requireAdmin, [
  query('region').optional().isString().withMessage('Region must be a string'),
  query('active').optional().isBoolean().withMessage('Active must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const { region, active } = req.query;

  const whereClause: any = {};
  if (region) whereClause.regiao = region;
  if (active !== undefined) whereClause.ativo = active === 'true';

  const proxies = await prisma.proxy.findMany({
    where: whereClause,
    select: {
      id: true,
      nome: true,
      host: true,
      porta: true,
      tipo: true,
      ativo: true,
      regiao: true,
      latenciaMedia: true,
      uptimePercentage: true,
      ultimaVerificacao: true,
      createdAt: true,
      _count: {
        select: {
          tools: true,
          accessLogs: {
            where: {
              status: 'active'
            }
          }
        }
      }
    },
    orderBy: [
      { ativo: 'desc' },
      { regiao: 'asc' },
      { nome: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: { proxies }
  });
}));

/**
 * GET /api/proxies/:id
 * Get specific proxy details (admin only)
 */
router.get('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Proxy ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const proxyId = parseInt(req.params.id);

  const proxy = await prisma.proxy.findUnique({
    where: { id: proxyId },
    include: {
      tools: {
        select: {
          id: true,
          nome: true,
          ativo: true
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
    }
  });

  if (!proxy) {
    return res.status(404).json({
      success: false,
      message: 'Proxy not found'
    });
  }

  // Get recent performance statistics
  const recentStats = await prisma.accessLog.groupBy({
    by: ['status'],
    where: {
      proxyId: proxy.id,
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

  const proxyWithStats = {
    ...proxy,
    activeSessions: proxy._count.accessLogs,
    recentStats: {
      active: statsMap.active || 0,
      completed: statsMap.completed || 0,
      failed: statsMap.failed || 0,
      timeout: statsMap.timeout || 0
    }
  };

  res.json({
    success: true,
    data: { proxy: proxyWithStats }
  });
}));

/**
 * GET /api/proxies/regions
 * Get available proxy regions
 */
router.get('/regions', authenticate, asyncHandler(async (req, res) => {
  const regions = await prisma.proxy.groupBy({
    by: ['regiao'],
    where: {
      ativo: true,
      regiao: { not: null }
    },
    _count: {
      id: true
    },
    _avg: {
      latenciaMedia: true,
      uptimePercentage: true
    },
    orderBy: {
      regiao: 'asc'
    }
  });

  const regionStats = regions.map(region => ({
    region: region.regiao,
    proxyCount: region._count.id,
    averageLatency: Math.round(region._avg.latenciaMedia || 0),
    averageUptime: Math.round((region._avg.uptimePercentage || 0) * 100) / 100
  }));

  res.json({
    success: true,
    data: { regions: regionStats }
  });
}));

/**
 * GET /api/proxies/health
 * Get proxy health status
 */
router.get('/health', authenticate, requirePlan(3), asyncHandler(async (req, res) => {
  const proxies = await prisma.proxy.findMany({
    where: { ativo: true },
    select: {
      id: true,
      nome: true,
      host: true,
      porta: true,
      regiao: true,
      latenciaMedia: true,
      uptimePercentage: true,
      ultimaVerificacao: true,
      _count: {
        select: {
          accessLogs: {
            where: {
              status: 'active'
            }
          }
        }
      }
    }
  });

  // Calculate health scores
  const proxiesWithHealth = proxies.map(proxy => {
    const lastCheck = proxy.ultimaVerificacao;
    const isStale = lastCheck ? (Date.now() - lastCheck.getTime()) > 10 * 60 * 1000 : true; // 10 minutes
    
    let healthScore = 0;
    if (proxy.uptimePercentage) healthScore += proxy.uptimePercentage * 0.4;
    if (proxy.latenciaMedia) healthScore += Math.max(0, (200 - proxy.latenciaMedia) / 200) * 100 * 0.3;
    if (!isStale) healthScore += 30;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 80) status = 'healthy';
    else if (healthScore >= 50) status = 'degraded';
    else status = 'unhealthy';

    return {
      ...proxy,
      healthScore: Math.round(healthScore),
      status,
      isStale,
      activeSessions: proxy._count.accessLogs
    };
  });

  // Calculate overall health
  const totalProxies = proxiesWithHealth.length;
  const healthyProxies = proxiesWithHealth.filter(p => p.status === 'healthy').length;
  const degradedProxies = proxiesWithHealth.filter(p => p.status === 'degraded').length;
  const unhealthyProxies = proxiesWithHealth.filter(p => p.status === 'unhealthy').length;

  const overallHealth = {
    totalProxies,
    healthy: healthyProxies,
    degraded: degradedProxies,
    unhealthy: unhealthyProxies,
    healthPercentage: Math.round((healthyProxies / totalProxies) * 100)
  };

  res.json({
    success: true,
    data: {
      proxies: proxiesWithHealth,
      overall: overallHealth
    }
  });
}));

/**
 * POST /api/proxies/:id/test
 * Test proxy connection (admin only)
 */
router.post('/:id/test', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Proxy ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  const proxyId = parseInt(req.params.id);

  const proxy = await prisma.proxy.findUnique({
    where: { id: proxyId }
  });

  if (!proxy) {
    return res.status(404).json({
      success: false,
      message: 'Proxy not found'
    });
  }

  // TODO: Implement actual proxy testing logic
  // This would involve making a test request through the proxy
  const testStartTime = Date.now();
  
  try {
    // Simulate proxy test (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const latency = Date.now() - testStartTime;
    const isSuccessful = Math.random() > 0.1; // 90% success rate simulation

    if (isSuccessful) {
      // Update proxy statistics
      await prisma.proxy.update({
        where: { id: proxyId },
        data: {
          latenciaMedia: latency,
          ultimaVerificacao: new Date(),
          uptimePercentage: Math.min(100, (proxy.uptimePercentage || 0) * 0.9 + 10) // Improve uptime gradually
        }
      });

      res.json({
        success: true,
        message: 'Proxy test successful',
        data: {
          proxyId,
          latency,
          status: 'online',
          timestamp: new Date()
        }
      });
    } else {
      throw new Error('Connection failed');
    }
  } catch (error) {
    // Update proxy with failure
    await prisma.proxy.update({
      where: { id: proxyId },
      data: {
        ultimaVerificacao: new Date(),
        uptimePercentage: Math.max(0, (proxy.uptimePercentage || 0) * 0.9) // Decrease uptime on failure
      }
    });

    res.status(503).json({
      success: false,
      message: 'Proxy test failed',
      data: {
        proxyId,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    });
  }
}));

/**
 * GET /api/proxies/stats
 * Get proxy usage statistics (admin only)
 */
router.get('/stats', authenticate, requireAdmin, [
  query('timeframe').optional().isIn(['24h', '7d', '30d']).withMessage('Timeframe must be 24h, 7d, or 30d')
], asyncHandler(async (req, res) => {
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

  // Get proxy usage statistics
  const [proxyUsage, totalSessions, regionStats] = await Promise.all([
    // Usage by proxy
    prisma.accessLog.groupBy({
      by: ['proxyId'],
      where: {
        proxyId: { not: null },
        startedAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { durationSeconds: true }
    }),

    // Total sessions
    prisma.accessLog.count({
      where: { startedAt: { gte: startDate } }
    }),

    // Usage by region
    prisma.accessLog.findMany({
      where: {
        proxyId: { not: null },
        startedAt: { gte: startDate }
      },
      include: {
        proxy: {
          select: {
            regiao: true
          }
        }
      }
    })
  ]);

  // Get proxy details
  const proxyIds = proxyUsage.map(p => p.proxyId).filter(Boolean) as number[];
  const proxies = await prisma.proxy.findMany({
    where: { id: { in: proxyIds } },
    select: {
      id: true,
      nome: true,
      regiao: true,
      latenciaMedia: true,
      uptimePercentage: true
    }
  });

  // Merge proxy data with usage stats
  const proxyStatsWithDetails = proxyUsage.map(usage => {
    const proxy = proxies.find(p => p.id === usage.proxyId);
    return {
      proxy,
      sessions: usage._count.id,
      totalDuration: usage._sum.durationSeconds || 0,
      averageDuration: usage._count.id > 0 ? Math.round((usage._sum.durationSeconds || 0) / usage._count.id) : 0
    };
  }).sort((a, b) => b.sessions - a.sessions);

  // Calculate region statistics
  const regionUsage = regionStats.reduce((acc, session) => {
    const region = session.proxy?.regiao || 'unknown';
    if (!acc[region]) {
      acc[region] = { sessions: 0, totalDuration: 0 };
    }
    acc[region].sessions++;
    acc[region].totalDuration += session.durationSeconds || 0;
    return acc;
  }, {} as Record<string, { sessions: number; totalDuration: number }>);

  const regionStatsArray = Object.entries(regionUsage).map(([region, stats]) => ({
    region,
    sessions: stats.sessions,
    totalDuration: stats.totalDuration,
    averageDuration: stats.sessions > 0 ? Math.round(stats.totalDuration / stats.sessions) : 0,
    percentage: Math.round((stats.sessions / totalSessions) * 100 * 100) / 100
  })).sort((a, b) => b.sessions - a.sessions);

  res.json({
    success: true,
    data: {
      timeframe,
      totalSessions,
      proxyUsage: proxyStatsWithDetails,
      regionUsage: regionStatsArray,
      summary: {
        totalProxies: proxies.length,
        activeProxies: proxyStatsWithDetails.length,
        topProxy: proxyStatsWithDetails[0]?.proxy?.nome || 'N/A',
        topRegion: regionStatsArray[0]?.region || 'N/A'
      }
    }
  });
}));

export default router;