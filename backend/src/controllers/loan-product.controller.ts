import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { loanProductService } from "../services/loan-product.service";
import HttpException from "../utils/http-exception";

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      productType: req.query.productType as string,
    };

    const products = await loanProductService.getAllProducts(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await loanProductService.getProductById(req.params.id);

    if (!product) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Loan product not found");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
