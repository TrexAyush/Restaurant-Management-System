import { performance } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealthMetric {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = [];
  private systemHealthMetrics: SystemHealthMetric[] = [];
  private errorLogs: ErrorLog[] = [];
  private maxMetricsHistory = 1000;
  private maxErrorLogsHistory = 500;

  /**
   * Record a performance metric
   * Requirement 8.5: Performance metrics collection
   */
  public recordPerformanceMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      ...(metadata && { metadata })
    };

    this.performanceMetrics.push(metric);

    // Keep only the most recent metrics to prevent memory issues
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }

    console.log(`Performance metric recorded: ${name} = ${value} ${unit}`);
  }

  /**
   * Record API response time
   */
  public recordApiResponseTime(endpoint: string, responseTime: number, statusCode: number): void {
    this.recordPerformanceMetric(
      'api_response_time',
      responseTime,
      'ms',
      {
        endpoint,
        statusCode,
        category: 'api_performance'
      }
    );
  }

  /**
   * Record database query time
   */
  public recordDatabaseQueryTime(query: string, responseTime: number): void {
    this.recordPerformanceMetric(
      'database_query_time',
      responseTime,
      'ms',
      {
        query: query.substring(0, 100), // Truncate long queries
        category: 'database_performance'
      }
    );
  }

  /**
   * Record WebSocket connection count
   */
  public recordWebSocketConnections(count: number): void {
    this.recordPerformanceMetric(
      'websocket_connections',
      count,
      'count',
      {
        category: 'websocket_performance'
      }
    );
  }

  /**
   * Record memory usage
   */
  public recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    this.recordPerformanceMetric(
      'memory_heap_used',
      memoryUsage.heapUsed / 1024 / 1024, // Convert to MB
      'MB',
      {
        category: 'system_performance',
        heapTotal: memoryUsage.heapTotal / 1024 / 1024,
        external: memoryUsage.external / 1024 / 1024,
        rss: memoryUsage.rss / 1024 / 1024
      }
    );
  }

  /**
   * Record system health status
   */
  public recordSystemHealth(
    component: string,
    status: 'healthy' | 'warning' | 'error',
    message?: string,
    details?: Record<string, any>
  ): void {
    const healthMetric: SystemHealthMetric = {
      component,
      status,
      timestamp: new Date(),
      ...(message && { message }),
      ...(details && { details })
    };

    this.systemHealthMetrics.push(healthMetric);

    // Keep only recent health metrics
    if (this.systemHealthMetrics.length > this.maxMetricsHistory) {
      this.systemHealthMetrics = this.systemHealthMetrics.slice(-this.maxMetricsHistory);
    }

    console.log(`System health recorded: ${component} - ${status}${message ? ': ' + message : ''}`);
  }

  /**
   * Log an error with tracking
   */
  public logError(
    level: 'error' | 'warning' | 'info',
    message: string,
    error?: Error,
    userId?: string,
    endpoint?: string,
    metadata?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      level,
      message,
      timestamp: new Date(),
      ...(error?.stack && { stack: error.stack }),
      ...(userId && { userId }),
      ...(endpoint && { endpoint }),
      ...(metadata && { metadata })
    };

    this.errorLogs.push(errorLog);

    // Keep only recent error logs
    if (this.errorLogs.length > this.maxErrorLogsHistory) {
      this.errorLogs = this.errorLogs.slice(-this.maxErrorLogsHistory);
    }

    // Log to console based on level
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logMethod(`[${level.toUpperCase()}] ${message}`, error ? error.stack : '');
  }

  /**
   * Get performance metrics by name and time range
   */
  public getPerformanceMetrics(
    name?: string,
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let metrics = this.performanceMetrics;

    if (name) {
      metrics = metrics.filter(m => m.name === name);
    }

    if (startTime) {
      metrics = metrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      metrics = metrics.filter(m => m.timestamp <= endTime);
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): SystemHealthMetric[] {
    return this.systemHealthMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Return last 50 health checks
  }

  /**
   * Get error logs
   */
  public getErrorLogs(
    level?: 'error' | 'warning' | 'info',
    startTime?: Date,
    endTime?: Date
  ): ErrorLog[] {
    let logs = this.errorLogs;

    if (level) {
      logs = logs.filter(l => l.level === level);
    }

    if (startTime) {
      logs = logs.filter(l => l.timestamp >= startTime);
    }

    if (endTime) {
      logs = logs.filter(l => l.timestamp <= endTime);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get performance summary statistics
   */
  public getPerformanceSummary(metricName: string, timeRange: number = 3600000): {
    average: number;
    min: number;
    max: number;
    count: number;
    p95: number;
    p99: number;
  } {
    const cutoffTime = new Date(Date.now() - timeRange);
    const metrics = this.getPerformanceMetrics(metricName, cutoffTime);

    if (metrics.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        p95: 0,
        p99: 0
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      average: sum / values.length,
      min: values[0] || 0,
      max: values[values.length - 1] || 0,
      count: values.length,
      p95: values[Math.floor(values.length * 0.95)] || 0,
      p99: values[Math.floor(values.length * 0.99)] || 0
    };
  }

  /**
   * Check overall system health
   */
  public getOverallSystemHealth(): {
    status: 'healthy' | 'warning' | 'error';
    components: Record<string, 'healthy' | 'warning' | 'error'>;
    lastChecked: Date;
  } {
    const recentHealthChecks = this.systemHealthMetrics
      .filter(m => m.timestamp > new Date(Date.now() - 300000)) // Last 5 minutes
      .reduce((acc, metric) => {
        const existing = acc[metric.component];
        if (!existing || existing.timestamp < metric.timestamp) {
          acc[metric.component] = metric;
        }
        return acc;
      }, {} as Record<string, SystemHealthMetric>);

    const components: Record<string, 'healthy' | 'warning' | 'error'> = {};
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

    for (const [component, metric] of Object.entries(recentHealthChecks)) {
      components[component] = metric.status;
      
      if (metric.status === 'error') {
        overallStatus = 'error';
      } else if (metric.status === 'warning' && overallStatus !== 'error') {
        overallStatus = 'warning';
      }
    }

    return {
      status: overallStatus,
      components,
      lastChecked: new Date()
    };
  }

  /**
   * Start periodic system monitoring
   */
  public startPeriodicMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.recordMemoryUsage();
      this.checkSystemHealth();
    }, intervalMs);
  }

  /**
   * Check system health components
   */
  private checkSystemHealth(): void {
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) {
      this.recordSystemHealth('memory', 'error', `High memory usage: ${heapUsedMB.toFixed(2)}MB`);
    } else if (heapUsedMB > 300) {
      this.recordSystemHealth('memory', 'warning', `Elevated memory usage: ${heapUsedMB.toFixed(2)}MB`);
    } else {
      this.recordSystemHealth('memory', 'healthy', `Memory usage: ${heapUsedMB.toFixed(2)}MB`);
    }

    // Check error rate
    const recentErrors = this.getErrorLogs('error', new Date(Date.now() - 300000)); // Last 5 minutes
    if (recentErrors.length > 10) {
      this.recordSystemHealth('error_rate', 'error', `High error rate: ${recentErrors.length} errors in 5 minutes`);
    } else if (recentErrors.length > 5) {
      this.recordSystemHealth('error_rate', 'warning', `Elevated error rate: ${recentErrors.length} errors in 5 minutes`);
    } else {
      this.recordSystemHealth('error_rate', 'healthy', `Error rate normal: ${recentErrors.length} errors in 5 minutes`);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear old metrics and logs
   */
  public clearOldData(olderThanMs: number = 86400000): void { // Default: 24 hours
    const cutoffTime = new Date(Date.now() - olderThanMs);
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffTime);
    this.systemHealthMetrics = this.systemHealthMetrics.filter(m => m.timestamp > cutoffTime);
    this.errorLogs = this.errorLogs.filter(l => l.timestamp > cutoffTime);
    
    console.log(`Cleared monitoring data older than ${new Date(cutoffTime).toISOString()}`);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();