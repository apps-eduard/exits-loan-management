import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const startTime = Date.now();

  // Log the outgoing request
  logger.httpRequest(req.method, req.url, req.body);

  return next(req).pipe(
    tap(event => {
      // Log successful responses
      if (event.type === 4) { // HttpResponse
        const duration = Date.now() - startTime;
        logger.httpResponse(req.method, req.url, 200, duration);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const duration = Date.now() - startTime;
      
      // Log error responses
      logger.httpError(req.method, req.url, {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        duration: `${duration}ms`
      });

      return throwError(() => error);
    })
  );
};
