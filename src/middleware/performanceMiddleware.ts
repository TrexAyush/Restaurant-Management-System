import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { monitoringService } from '../services/monitoringService';

export interface PerformanceRequest extends Request {
  startTime?: number;
}

/**
 * Middleware to track API performance metrics
 * Requirement 8.5: Performance metrics collection
 */
export const performanceMiddleware = (req: PerformanceRequest, res: Response, next: NextFunction): void => {
  // Record start time
  req.startTime = performance.now();

  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    if (req.startTime) {
      const responseTime = performance.now() - req.startTime;
      
      // Record API response time metric
      monitoringService.recordApiResponseTime(
        `${req.method} ${req.route?.path || req.path}`,
        responseTime,
        res.statusCode
      );

      // Log slow requests
      if (responseTime > 1000) { // Requests taking more than 1 second
        monitoringService.logError(
          'warning',
          `Slow API request detected: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms`,
          undefined,
          (req as any).user?.userId,
          `${req.method} ${req.path}`,
          {
            responseTime,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        );
      }
    }

    // Call original end method
    return originalEnd(chunk, encoding, cb);
  };

  next();
};

/**
 * Middleware to track database query performance
 */
export const trackDatabaseQuery = (queryName: string) => {
  return async <T>(queryFunction: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const queryTime = performance.now() - startTime;
      
      monitoringService.recordDatabaseQueryTime(queryName, queryTime);
      
      // Log slow queries
      if (queryTime > 500) { // Queries taking more than 500ms
        monitoringService.logError(
          'warning',
          `Slow database query detected: ${queryName} took ${queryTime.toFixed(2)}ms`,
          undefined,
          undefined,
          undefined,
          {
            queryName,
            queryTime
          }
        );
      }
      
      return result;
    } catch (error) {
      const queryTime = performance.now() - startTime;
      
      monitoringService.logError(
        'error',
        `Database query failed: ${queryName}`,
        error as Error,
        undefined,
        undefined,
        {
          queryName,
          queryTime
        }
      );
      
      throw error;
    }
  };
};