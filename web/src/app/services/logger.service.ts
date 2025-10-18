import { Injectable } from '@angular/core';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLogLevel: LogLevel = LogLevel.Debug;

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  }

  private formatMessage(level: string, emoji: string, message: string, ...args: any[]): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] ${emoji} ${level}`;
    
    if (args.length > 0) {
      console.group(prefix + ' ' + message);
      args.forEach(arg => {
        if (typeof arg === 'object') {
          console.dir(arg);
        } else {
          console.log(arg);
        }
      });
      console.groupEnd();
    } else {
      console.log(prefix + ' ' + message);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.currentLogLevel <= LogLevel.Debug) {
      this.formatMessage('DEBUG', '🔍', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.currentLogLevel <= LogLevel.Info) {
      this.formatMessage('INFO', 'ℹ️', message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.currentLogLevel <= LogLevel.Info) {
      this.formatMessage('SUCCESS', '✅', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.currentLogLevel <= LogLevel.Warn) {
      this.formatMessage('WARN', '⚠️', message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.currentLogLevel <= LogLevel.Error) {
      this.formatMessage('ERROR', '❌', message, ...args);
    }
  }

  // Security & Auth specific logs
  authSuccess(email: string, role: string): void {
    this.success(`Login successful`, { email, role });
  }

  authFailed(email: string, reason: string): void {
    this.error(`Login failed`, { email, reason });
  }

  permissionDenied(permissions: string[], userPermissions: string[]): void {
    this.warn(`Access denied - insufficient permissions`, {
      required: permissions,
      userHas: userPermissions,
      missing: permissions.filter(p => !userPermissions.includes(p))
    });
  }

  formValidationError(formName: string, errors: any): void {
    this.warn(`📝 Form validation failed: ${formName}`, errors);
  }

  // HTTP Request logs
  httpRequest(method: string, url: string, body?: any): void {
    this.debug(`HTTP ${method}`, { url, body: this.sanitizeBody(body) });
  }

  httpResponse(method: string, url: string, status: number, duration?: number): void {
    const emoji = status < 400 ? '✅' : '❌';
    this.debug(`${emoji} HTTP ${method} ${status}`, { 
      url, 
      status,
      duration: duration ? `${duration}ms` : 'N/A'
    });
  }

  httpError(method: string, url: string, error: any): void {
    this.error(`HTTP ${method} failed`, { 
      url, 
      status: error.status,
      message: error.message,
      error: error.error 
    });
  }

  // Navigation logs
  routeChange(from: string, to: string): void {
    this.info(`Route change: ${from} → ${to}`);
  }

  // Component lifecycle logs
  componentInit(componentName: string): void {
    this.debug(`🔧 Component initialized: ${componentName}`);
  }

  componentDestroy(componentName: string): void {
    this.debug(`🗑️ Component destroyed: ${componentName}`);
  }

  // Data operations
  dataLoaded(entity: string, count?: number): void {
    this.success(`Loaded ${entity}`, count !== undefined ? { count } : undefined);
  }

  dataError(entity: string, error: any): void {
    this.error(`Failed to load ${entity}`, error);
  }

  // Form operations
  formSubmit(formName: string, data: any): void {
    this.info(`Form submitted: ${formName}`, this.sanitizeBody(data));
  }

  // Private helper to sanitize sensitive data
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'password_hash'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    this.info(`Log level changed to: ${LogLevel[level]}`);
  }

  // Performance logging
  startTimer(label: string): void {
    console.time(`⏱️ ${label}`);
  }

  endTimer(label: string): void {
    console.timeEnd(`⏱️ ${label}`);
  }

  // Table logging for better data visualization
  table(label: string, data: any[]): void {
    if (this.currentLogLevel <= LogLevel.Debug) {
      console.log(`📊 ${label}`);
      console.table(data);
    }
  }
}
