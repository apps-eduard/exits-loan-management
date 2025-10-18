import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import HttpException from '../utils/http-exception';
import { StatusCodes } from 'http-status-codes';

// Extend the Request interface to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      isSuperAdmin?: boolean;
    }
  }
}

/**
 * Tenant Context Middleware
 * Ensures all database queries are scoped to the authenticated user's tenant
 * This prevents data leakage between different companies/organizations
 */
export const tenantContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for public routes
    if (!req.user) {
      return next();
    }

    // Get tenant ID from authenticated user
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        'User is not associated with any tenant'
      );
    }

    // Attach tenant ID and super admin flag to request for use in controllers/services
    req.tenantId = tenantId;
    req.isSuperAdmin = req.user.isSuperAdmin || false;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware alias for consistency with new implementation
 */
export const tenantMiddleware = tenantContext;

/**
 * Middleware to ensure user is a super admin
 * Must be used AFTER tenantContext/tenantMiddleware
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isSuperAdmin) {
    throw new HttpException(
      StatusCodes.FORBIDDEN,
      'Access denied. Super admin privileges required.'
    );
  }
  next();
};
