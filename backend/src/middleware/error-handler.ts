import type { ErrorRequestHandler } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import logger from "../config/logger";
import { env } from "../config/env";
import HttpException from "../utils/http-exception";

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = getReasonPhrase(statusCode);
  let details: unknown;

  if (err instanceof HttpException) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation error";
    details = err.issues;
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Malformed JSON payload";
  }

  // Enhanced error logging with more context
  const errorContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  if (env.isDevelopment) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ ERROR OCCURRED');
    console.log('='.repeat(80));
    console.log('📍 Request:', `${errorContext.method} ${errorContext.path}`);
    console.log('⏰ Time:', errorContext.timestamp);
    console.log('🔢 Status:', statusCode);
    console.log('💬 Message:', message);
    if (details) {
      console.log('📋 Details:', JSON.stringify(details, null, 2));
    }
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    if (err.stack) {
      console.log('📚 Stack Trace:');
      console.log(err.stack);
    }
    console.log('='.repeat(80) + '\n');
  } else {
    // Only log errors to pino in production
    logger.error({
      err,
      ...errorContext,
    });
  }

  const payload: Record<string, unknown> = { message };

  if (details) {
    payload.details = details;
  }

  if (env.isDevelopment) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
