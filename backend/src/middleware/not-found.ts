import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";

const notFound = (req: Request, res: Response, _next: NextFunction) => {
  if (env.isDevelopment) {
    console.log('\n' + '⚠️ '.repeat(40));
    console.log('🔍 ROUTE NOT FOUND');
    console.log('⚠️ '.repeat(40));
    console.log('📍 Attempted:', `${req.method} ${req.originalUrl}`);
    console.log('🌐 IP:', req.ip);
    console.log('💡 Tip: Check if the route is registered in routes/index.ts');
    console.log('⚠️ '.repeat(40) + '\n');
  }

  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export default notFound;
