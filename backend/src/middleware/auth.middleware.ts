import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { authService, TokenPayload } from "../services/auth.service";
import HttpException from "../utils/http-exception";
import logger from "../config/logger";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        "No token provided"
      );
    }

    const token = authHeader.substring(7);

    try {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired token"
      );
    }
  } catch (error) {
    next(error);
  }
};

export const requirePermissions = (requiredPermissions: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new HttpException(
          StatusCodes.UNAUTHORIZED,
          "Authentication required"
        );
      }

      const userPermissions = await authService.getUserPermissions(
        req.user.roleId
      );

      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn(
          {
            userId: req.user.userId,
            requiredPermissions,
            userPermissions,
          },
          "Permission denied"
        );

        throw new HttpException(
          StatusCodes.FORBIDDEN,
          "Insufficient permissions"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireOU = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        "Authentication required"
      );
    }

    // Super Admin can access all OUs
    if (req.user.roleName === "Super Admin") {
      next();
      return;
    }

    // For other roles, they can only access their own OU
    const requestedOuId = req.params.ouId || req.body.organizationalUnitId;

    if (requestedOuId && requestedOuId !== req.user.organizationalUnitId) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        "Access denied to this organizational unit"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
