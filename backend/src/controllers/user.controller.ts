import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { StatusCodes } from "http-status-codes";

const userService = new UserService();

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        roleId,
        organizationalUnitId,
        status,
        page = "1",
        limit = "10",
      } = req.query;

      const filters = {
        search: search as string,
        roleId: roleId as string,
        organizationalUnitId: organizationalUnitId as string,
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await userService.getUsers(filters);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: { user },
        message: "User created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await userService.updateUser(id, userData);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
        message: "User updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUserStatus(id, "suspended");

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
        message: "User suspended successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUserStatus(id, "active");

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
        message: "User activated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      await userService.resetUserPassword(id, newPassword);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await userService.getRoles();

      res.status(StatusCodes.OK).json({
        success: true,
        data: { roles },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await userService.getPermissions();

      res.status(StatusCodes.OK).json({
        success: true,
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;
      const permissions = await userService.getRolePermissions(roleId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
