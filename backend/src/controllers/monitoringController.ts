import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService';

export class MonitoringController {
  /**
   * Get system health status
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = monitoringService.getOverallSystemHealth();
      const healthMetrics = monitoringService.getSystemHealth();
      
      res.status(200).json({
        success: true,
        data: {
          overall: health,
          components: healthMetrics.slice(0, 20) // Last 20 health checks
        }
      });
    } catch (error) {
      monitoringService.logError(
        'error',
        'Failed to get system health',
        error as Error,
        (req as any).user?.userId,
        'GET /api/monitoring/health'
      );
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system health'
      });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { name, startTime, endTime, summary } = req.query;
      
      if (summary === 'true' && name) {
        const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : 3600000; // 1 hour default
        const summaryData = monitoringService.getPerformanceSummary(name as string, timeRange);
        
        res.status(200).json({
          success: true,
          data: {
            metric: name,
            timeRange,
            summary: summaryData
          }
        });
        return;
      }

      const metrics = monitoringService.getPerformanceMetrics(
        name as string,
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: {
          metrics: metrics.slice(0, 100), // Limit to 100 most recent
          total: metrics.length
        }
      });
    } catch (error) {
      monitoringService.logError(
        'error',
        'Failed to get performance metrics',
        error as Error,
        (req as any).user?.userId,
        'GET /api/monitoring/metrics'
      );
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(req: Request, res: Response): Promise<void> {
    try {
      const { level, startTime, endTime, limit } = req.query;
      
      const logs = monitoringService.getErrorLogs(
        level as 'error' | 'warning' | 'info',
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined
      );

      const limitNum = limit ? parseInt(limit as string) : 50;
      
      res.status(200).json({
        success: true,
        data: {
          logs: logs.slice(0, limitNum),
          total: logs.length
        }
      });
    } catch (error) {
      monitoringService.logError(
        'error',
        'Failed to get error logs',
        error as Error,
        (req as any).user?.userId,
        'GET /api/monitoring/errors'
      );
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve error logs'
      });
    }
  }

  /**
   * Get system statistics dashboard
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : 3600000; // 1 hour default
      
      // Get performance summaries for key metrics
      const apiResponseTime = monitoringService.getPerformanceSummary('api_response_time', timeRange);
      const dbQueryTime = monitoringService.getPerformanceSummary('database_query_time', timeRange);
      const memoryUsage = monitoringService.getPerformanceSummary('memory_heap_used', timeRange);
      const wsConnections = monitoringService.getPerformanceSummary('websocket_connections', timeRange);
      
      // Get recent error counts
      const cutoffTime = new Date(Date.now() - timeRange);
      const errorCounts = {
        error: monitoringService.getErrorLogs('error', cutoffTime).length,
        warning: monitoringService.getErrorLogs('warning', cutoffTime).length,
        info: monitoringService.getErrorLogs('info', cutoffTime).length
      };
      
      // Get system health
      const systemHealth = monitoringService.getOverallSystemHealth();
      
      res.status(200).json({
        success: true,
        data: {
          timeRange,
          performance: {
            apiResponseTime,
            databaseQueryTime: dbQueryTime,
            memoryUsage,
            webSocketConnections: wsConnections
          },
          errors: errorCounts,
          systemHealth,
          timestamp: new Date()
        }
      });
    } catch (error) {
      monitoringService.logError(
        'error',
        'Failed to get system statistics',
        error as Error,
        (req as any).user?.userId,
        'GET /api/monitoring/stats'
      );
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system statistics'
      });
    }
  }

  /**
   * Clear old monitoring data
   */
  async clearOldData(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanHours } = req.body;
      const olderThanMs = (olderThanHours || 24) * 60 * 60 * 1000; // Default 24 hours
      
      monitoringService.clearOldData(olderThanMs);
      
      res.status(200).json({
        success: true,
        message: `Cleared monitoring data older than ${olderThanHours || 24} hours`
      });
    } catch (error) {
      monitoringService.logError(
        'error',
        'Failed to clear old monitoring data',
        error as Error,
        (req as any).user?.userId,
        'POST /api/monitoring/clear'
      );
      
      res.status(500).json({
        success: false,
        error: 'Failed to clear old monitoring data'
      });
    }
  }
}

export const monitoringController = new MonitoringController();