import request from 'supertest';
import express from 'express';
import { reportingController } from './reportingController';
import { reportingService } from '../services/reportingService';

// Mock the reporting service
jest.mock('../services/reportingService');

const mockReportingService = reportingService as jest.Mocked<typeof reportingService>;

// Create test app
const app = express();
app.use(express.json());

// Add routes for testing
app.get('/api/reports/daily', reportingController.getDailySalesReport.bind(reportingController));
app.get('/api/reports/weekly', reportingController.getWeeklySalesReport.bind(reportingController));
app.get('/api/reports/popularity', reportingController.getItemPopularityRanking.bind(reportingController));
app.get('/api/reports/revenue', reportingController.getRevenueSummary.bind(reportingController));
app.get('/api/reports/performance', reportingController.getPerformanceMetrics.bind(reportingController));
app.get('/api/reports/dashboard', reportingController.getDashboardSummary.bind(reportingController));
app.post('/api/reports/export', reportingController.exportReport.bind(reportingController));

describe('ReportingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/daily', () => {
    it('should return daily sales report for specified date', async () => {
      const mockReport = {
        date: new Date('2024-01-15'),
        totalRevenue: 500.00,
        totalOrders: 25,
        averageOrderValue: 20.00,
        popularItems: [],
        revenueByPaymentMethod: { cash: 250, card: 250, digital: 0 },
        ordersByHour: []
      };

      mockReportingService.generateDailySalesReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/daily?date=2024-01-15')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        totalRevenue: 500.00,
        totalOrders: 25
      }));
      expect(mockReportingService.generateDailySalesReport).toHaveBeenCalledWith(
        new Date('2024-01-15')
      );
    });

    it('should return daily sales report for today when no date specified', async () => {
      const mockReport = {
        date: new Date(),
        totalRevenue: 300.00,
        totalOrders: 15,
        averageOrderValue: 20.00,
        popularItems: [],
        revenueByPaymentMethod: { cash: 150, card: 150, digital: 0 },
        ordersByHour: []
      };

      mockReportingService.generateDailySalesReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/daily')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReportingService.generateDailySalesReport).toHaveBeenCalled();
    });

    it('should return error for invalid date format', async () => {
      const response = await request(app)
        .get('/api/reports/daily?date=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid date format');
    });
  });

  describe('GET /api/reports/weekly', () => {
    it('should return weekly sales report for specified week', async () => {
      const mockReport = {
        weekStart: new Date('2024-01-15'),
        weekEnd: new Date('2024-01-21'),
        totalRevenue: 3500.00,
        totalOrders: 175,
        averageOrderValue: 20.00,
        dailyBreakdown: [],
        trendAnalysis: {
          revenueGrowth: 5.5,
          orderGrowth: 3.2,
          averageOrderValueGrowth: 2.1
        },
        popularItems: []
      };

      mockReportingService.generateWeeklySalesReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/weekly?weekStart=2024-01-15')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRevenue).toBe(3500.00);
      expect(mockReportingService.generateWeeklySalesReport).toHaveBeenCalledWith(
        new Date('2024-01-15')
      );
    });
  });

  describe('GET /api/reports/popularity', () => {
    it('should return item popularity ranking', async () => {
      const mockPopularItems = [
        {
          menuItemId: 'item-1',
          menuItemName: 'Burger',
          categoryName: 'Main Course',
          totalQuantitySold: 50,
          totalRevenue: 750.00,
          orderFrequency: 25,
          averageQuantityPerOrder: 2.0
        }
      ];

      mockReportingService.getItemPopularityRanking.mockResolvedValue(mockPopularItems);

      const response = await request(app)
        .get('/api/reports/popularity?startDate=2024-01-01&endDate=2024-01-31&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].menuItemName).toBe('Burger');
    });

    it('should return error for invalid date range', async () => {
      const response = await request(app)
        .get('/api/reports/popularity?startDate=2024-01-31&endDate=2024-01-01')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Start date must be before or equal to end date');
    });
  });

  describe('GET /api/reports/revenue', () => {
    it('should return revenue summary', async () => {
      const mockSummary = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        },
        totalRevenue: 15000.00,
        totalOrders: 750,
        averageOrderValue: 20.00,
        revenueByPaymentMethod: { cash: 7500, card: 7500, digital: 0 },
        revenueByCategory: [],
        revenueByTimePeriod: []
      };

      mockReportingService.generateRevenueSummary.mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/api/reports/revenue?startDate=2024-01-01&endDate=2024-01-31&groupBy=day')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRevenue).toBe(15000.00);
    });

    it('should return error when dates are missing', async () => {
      const response = await request(app)
        .get('/api/reports/revenue')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Both startDate and endDate are required');
    });
  });

  describe('GET /api/reports/performance', () => {
    it('should return performance metrics', async () => {
      const mockMetrics = {
        timestamp: new Date(),
        averageOrderPreparationTime: 15.5,
        averageResponseTime: 120,
        activeUsers: 25,
        systemLoad: {
          cpu: 45.2,
          memory: 68.7,
          database: {
            activeConnections: 8,
            averageQueryTime: 25.3
          }
        },
        orderThroughput: {
          ordersPerHour: 12.5,
          peakHourOrders: 25,
          averageOrdersPerDay: 150
        }
      };

      mockReportingService.collectPerformanceMetrics.mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/reports/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageOrderPreparationTime).toBe(15.5);
    });
  });

  describe('POST /api/reports/export', () => {
    it('should export report as JSON', async () => {
      const reportData = { test: 'data' };
      const exportedData = JSON.stringify(reportData, null, 2);

      mockReportingService.exportReport.mockResolvedValue(exportedData);

      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportType: 'daily',
          reportData,
          options: { format: 'json' }
        })
        .expect(200);

      expect(response.text).toBe(exportedData);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should export report as CSV', async () => {
      const reportData = { test: 'data' };
      const exportedData = 'CSV,Data\ntest,data';

      mockReportingService.exportReport.mockResolvedValue(exportedData);

      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportType: 'daily',
          reportData,
          options: { format: 'csv' }
        })
        .expect(200);

      expect(response.text).toBe(exportedData);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportType: 'daily'
          // Missing reportData and options
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('reportType, reportData, and options are required');
    });
  });

  describe('GET /api/reports/dashboard', () => {
    it('should return dashboard summary', async () => {
      const mockTodayReport = {
        date: new Date(),
        totalRevenue: 500.00,
        totalOrders: 25,
        averageOrderValue: 20.00,
        popularItems: [],
        revenueByPaymentMethod: { cash: 250, card: 250, digital: 0 },
        ordersByHour: []
      };

      const mockYesterdayReport = {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        totalRevenue: 450.00,
        totalOrders: 23,
        averageOrderValue: 19.57,
        popularItems: [],
        revenueByPaymentMethod: { cash: 225, card: 225, digital: 0 },
        ordersByHour: []
      };

      const mockWeeklyReport = {
        weekStart: new Date(),
        weekEnd: new Date(),
        totalRevenue: 3500.00,
        totalOrders: 175,
        averageOrderValue: 20.00,
        dailyBreakdown: [],
        trendAnalysis: {
          revenueGrowth: 5.5,
          orderGrowth: 3.2,
          averageOrderValueGrowth: 2.1
        },
        popularItems: []
      };

      const mockPopularItems: any[] = [];
      const mockMetrics = {
        timestamp: new Date(),
        averageOrderPreparationTime: 15.5,
        averageResponseTime: 120,
        activeUsers: 25,
        systemLoad: {
          cpu: 45.2,
          memory: 68.7,
          database: {
            activeConnections: 8,
            averageQueryTime: 25.3
          }
        },
        orderThroughput: {
          ordersPerHour: 12.5,
          peakHourOrders: 25,
          averageOrdersPerDay: 150
        }
      };

      mockReportingService.generateDailySalesReport
        .mockResolvedValueOnce(mockTodayReport)
        .mockResolvedValueOnce(mockYesterdayReport);
      mockReportingService.generateWeeklySalesReport.mockResolvedValue(mockWeeklyReport);
      mockReportingService.getItemPopularityRanking.mockResolvedValue(mockPopularItems);
      mockReportingService.collectPerformanceMetrics.mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/reports/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.today).toBeDefined();
      expect(response.body.data.yesterday).toBeDefined();
      expect(response.body.data.weeklyTrends).toBeDefined();
      expect(response.body.data.performance).toBeDefined();
    });
  });
});