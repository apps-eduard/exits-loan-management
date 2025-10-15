import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import HttpException from "../utils/http-exception";
import logger from "../config/logger";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Email and password are required"
      );
    }

    const user = await authService.validateCredentials(email, password);

    if (!user) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        "Invalid credentials"
      );
    }

    const tokens = authService.generateTokens(user);
    const permissions = await authService.getUserPermissions(user.roleId);

    logger.info({ userId: user.id, email: user.email }, "User logged in");

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleName,
          organizationalUnit: {
            id: user.organizationalUnitId,
            name: user.organizationalUnitName,
          },
          permissions,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Refresh token is required"
      );
    }

    try {
      const payload = authService.verifyRefreshToken(refreshToken);
      const user = await authService.getUserById(payload.userId);

      if (!user) {
        throw new HttpException(
          StatusCodes.UNAUTHORIZED,
          "Invalid refresh token"
        );
      }

      const tokens = authService.generateTokens(user);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired refresh token"
      );
    }
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
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

    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "User not found"
      );
    }

    const permissions = await authService.getUserPermissions(user.roleId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleName,
          organizationalUnit: {
            id: user.organizationalUnitId,
            name: user.organizationalUnitName,
          },
          permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      logger.info({ userId: req.user.userId }, "User logged out");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
