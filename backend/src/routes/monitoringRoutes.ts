import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController';
import { authenticate } from '../middleware/authMiddleware';
import { UserRole } from '../models/enums';

const router = Router();

// Apply authentication middleware to all monitoring routes
router.use(authenticate);

// Middleware to check admin/manager access for monitoring endpoints
const requireAdminOrManager = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === UserRole.ADMIN || req.user.role === UserRole.MANAGER)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin or Manager role required.'
    });
  }
};

// Apply role-based access control to all routes
router.use(requireAdminOrManager);

/**
 * @route GET /api/monitoring/health
 * @desc Get system health status
 * @access Admin, Manager
 */
router.get('/health', monitoringController.getSystemHealth);

/**
 * @route GET /api/monitoring/metrics
 * @desc Get performance metrics
 * @query name - Filter by metric name
 * @query startTime - Filter by start time (ISO string)
 * @query endTime - Filter by end time (ISO string)
 * @query summary - Return summary statistics (true/false)
 * @query timeRange - Time range in milliseconds for summary (default: 3600000)
 * @access Admin, Manager
 */
router.get('/metrics', monitoringController.getPerformanceMetrics);

/**
 * @route GET /api/monitoring/errors
 * @desc Get error logs
 * @query level - Filter by error level (error/warning/info)
 * @query startTime - Filter by start time (ISO string)
 * @query endTime - Filter by end time (ISO string)
 * @query limit - Limit number of results (default: 50)
 * @access Admin, Manager
 */
router.get('/errors', monitoringController.getErrorLogs);

/**
 * @route GET /api/monitoring/stats
 * @desc Get comprehensive system statistics dashboard
 * @query timeRange - Time range in milliseconds (default: 3600000)
 * @access Admin, Manager
 */
router.get('/stats', monitoringController.getSystemStats);

/**
 * @route POST /api/monitoring/clear
 * @desc Clear old monitoring data
 * @body olderThanHours - Clear data older than specified hours (default: 24)
 * @access Admin only
 */
router.post('/clear', (req: any, res: any, next: any) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
}, monitoringController.clearOldData);

export default router;