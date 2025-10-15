import { Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { customerService } from "../services/customer.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import HttpException from "../utils/http-exception";
import logger from "../config/logger";

export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.createCustomer(req.body, req);

    logger.info(
      {
        userId: req.user!.userId,
        customerId: customer.id,
        customerCode: customer.customer_code,
      },
      "Customer created"
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string,
      kycStatus: req.query.kycStatus as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await customerService.getCustomers(req, filters);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req);

    if (!customer) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Customer not found"
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.updateCustomer(
      req.params.id,
      req.body,
      req
    );

    if (!customer) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Customer not found"
      );
    }

    logger.info(
      {
        userId: req.user!.userId,
        customerId: customer.id,
      },
      "Customer updated"
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCustomerKYC = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, notes } = req.body;

    if (!status || !["verified", "rejected"].includes(status)) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Invalid KYC status. Must be 'verified' or 'rejected'"
      );
    }

    const customer = await customerService.verifyKYC(
      req.params.id,
      status,
      notes || "",
      req
    );

    if (!customer) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Customer not found"
      );
    }

    logger.info(
      {
        userId: req.user!.userId,
        customerId: customer.id,
        kycStatus: status,
      },
      "Customer KYC updated"
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};
