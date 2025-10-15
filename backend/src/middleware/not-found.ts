import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export default notFound;
