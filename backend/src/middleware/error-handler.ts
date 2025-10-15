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

  logger.error({
    err,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

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
