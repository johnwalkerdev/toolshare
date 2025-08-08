import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/index';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/utils/auth';
import { logger } from '@/utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        nome: string;
        planId?: number;
        ativo: boolean;
        role?: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify JWT token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Check if token is blacklisted (user session)
    const session = await prisma.userSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked or expired'
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nome: true,
        planId: true,
        ativo: true,
        emailVerificado: true,
        expiresAt: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user is active
    if (!user.ativo) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
      return;
    }

    // Check if user's plan has expired
    if (user.expiresAt && user.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        message: 'Account subscription has expired'
      });
      return;
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      planId: user.planId || undefined,
      ativo: user.ativo
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin privileges
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin role (you can implement this based on your needs)
    // For now, we'll check if user has Enterprise plan or is owner of a team
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        plan: true,
        ownedTeams: true
      }
    });

    if (!user) {
      res.status(403).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user has admin privileges (Enterprise plan or team owner)
    const isAdmin = user.plan?.slug === 'enterprise' || 
                   user.ownedTeams.length > 0 ||
                   user.email.includes('@toolshare.com'); // Internal users

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
      return;
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    logger.error('Admin authorization middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Plan-based authorization middleware
 * Requires user to have a specific plan or higher
 */
export const requirePlan = (minPlanLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { plan: true }
      });

      if (!user || !user.plan) {
        res.status(403).json({
          success: false,
          message: 'Valid subscription plan required'
        });
        return;
      }

      if (user.plan.ordem < minPlanLevel) {
        res.status(403).json({
          success: false,
          message: `This feature requires ${getPlanName(minPlanLevel)} plan or higher`,
          requiredPlan: getPlanName(minPlanLevel),
          currentPlan: user.plan.nome
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Plan authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during plan verification'
      });
    }
  };
};

/**
 * Team authorization middleware
 * Requires user to be member of a specific team
 */
export const requireTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const teamId = parseInt(req.params.teamId);
    if (!teamId) {
      res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
      return;
    }

    // Check if user is member of the team
    const teamMember = await prisma.teamUser.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: req.user.id
        }
      },
      include: {
        team: true
      }
    });

    if (!teamMember || !teamMember.ativo) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
      return;
    }

    // Add team info to request
    req.user.role = teamMember.role;
    next();
  } catch (error) {
    logger.error('Team authorization middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during team verification'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          nome: true,
          planId: true,
          ativo: true
        }
      });

      if (user && user.ativo) {
        req.user = {
          id: user.id,
          email: user.email,
          nome: user.nome,
          planId: user.planId || undefined,
          ativo: user.ativo
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

/**
 * Helper function to get plan name by level
 */
const getPlanName = (level: number): string => {
  const planNames = {
    1: 'Starter',
    2: 'Team',
    3: 'Business',
    4: 'Enterprise'
  };
  return planNames[level as keyof typeof planNames] || 'Unknown';
};