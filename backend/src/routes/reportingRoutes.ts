import { Router } from 'express';
import { reportingController } from '../controllers/reportingController';
import { 
  authenticate, 
  requireManager, 
  requireAdmin,
  trackSession 
} from '../middleware/authMiddleware';

const router = Router();

// Reporting and Analytics Routes

/**
 * @route GET /api/reports/daily
 * @desc Generate daily sales report
 * @access Private (Manager only)
 * @query date - Optional date in YYYY-MM-DD format (defaults to today)
 */
router.get('/daily', authenticate, trackSession, requireManager, reportingController.getDailySalesReport.bind(reportingController));

/**
 * @route GET /api/reports/weekly
 * @desc Generate weekly sales report with trend analysis
 * @access Private (Manager only)
 * @query weekStart - Optional week start date in YYYY-MM-DD format (defaults to current week)
 */
router.get('/weekly', authenticate, trackSession, requireManager, reportingController.getWeeklySalesReport.bind(reportingController));

/**
 * @route GET /api/reports/popularity
 * @desc Get item popularity ranking
 * @access Private (Manager only)
 * @query startDate - Optional start date in YYYY-MM-DD format
 * @query endDate - Optional end date in YYYY-MM-DD format
 * @query limit - Optional limit for number of items (default: 50, max: 1000)
 */
router.get('/popularity', authenticate, trackSession, requireManager, reportingController.getItemPopularityRanking.bind(reportingController));

/**
 * @route GET /api/reports/revenue
 * @desc Generate revenue summary
 * @access Private (Manager only)
 * @query startDate - Required start date in YYYY-MM-DD format
 * @query endDate - Required end date in YYYY-MM-DD format
 * @query groupBy - Optional grouping: day|week|month (default: day)
 */
router.get('/revenue', authenticate, trackSession, requireManager, reportingController.getRevenueSummary.bind(reportingController));

/**
 * @route GET /api/reports/dashboard
 * @desc Get dashboard summary (combines multiple reports)
 * @access Private (Manager only)
 */
router.get('/dashboard', authenticate, trackSession, requireManager, reportingController.getDashboardSummary.bind(reportingController));

/**
 * @route GET /api/reports/recent-orders
 * @desc Get recent orders for dashboard display
 * @access Private (Manager or Waiter)
 * @query limit - Optional limit for number of orders (default: 10, max: 100)
 */
router.get('/recent-orders', authenticate, trackSession, reportingController.getRecentOrders.bind(reportingController));

/**
 * @route GET /api/reports/performance
 * @desc Get performance metrics
 * @access Private (Admin only)
 */
router.get('/performance', authenticate, trackSession, requireAdmin, reportingController.getPerformanceMetrics.bind(reportingController));

/**
 * @route POST /api/reports/export
 * @desc Export report data in various formats
 * @access Private (Manager only)
 * @body reportType - Type of report: daily|weekly|revenue|popularity
 * @body reportData - The report data to export
 * @body options - Export options: { format: 'json'|'csv'|'pdf', includeCharts?: boolean, dateRange?: DateRange }
 */
router.post('/export', authenticate, trackSession, requireManager, reportingController.exportReport.bind(reportingController));

export default router;