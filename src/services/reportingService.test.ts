import { reportingService } from './reportingService';
import { billRepository } from '../repositories/billRepository';
import { orderRepository } from '../repositories/orderRepository';

// Mock dependencies
jest.mock('../repositories/billRepository');
jest.mock('../repositories/orderRepository');
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    raw: jest.fn()
  }
}));

const mockBillRepository = billRepository as jest.Mocked<typeof billRepository>;
const mockOrderRepository = orderRepository as jest.Mocked<typeof orderRepository>;

describe('ReportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDailySalesReport', () => {
    it('should generate a daily sales report for a given date', async () => {
      const testDate = new Date('2024-01-15');
      const mockBills = [
        {
          id: 'bill-1',
          orderId: 'order-1',
          subtotal: 20.00,
          taxAmount: 2.00,
          totalAmount: 22.00,
          paymentMethod: 'card' as any,
          paymentStatus: 'paid' as any,
          generatedAt: new Date('2024-01-15T12:00:00Z'),
          paidAt: new Date('2024-01-15T12:05:00Z'),
          createdAt: new Date('2024-01-15T12:00:00Z'),
          updatedAt: new Date('2024-01-15T12:05:00Z')
        }
      ];

      mockBillRepository.getBillsForDateRange.mockResolvedValue(mockBills);

      // Mock the database query for popular items
      const mockKnex = require('../config/database').default;
      mockKnex.raw.mockResolvedValue({ rows: [] });

      const report = await reportingService.generateDailySalesReport(testDate);

      expect(report).toBeDefined();
      expect(report.date).toEqual(testDate);
      expect(report.totalRevenue).toBe(22.00);
      expect(report.totalOrders).toBe(1);
      expect(report.averageOrderValue).toBe(22.00);
      expect(mockBillRepository.getBillsForDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle empty data gracefully', async () => {
      const testDate = new Date('2024-01-15');
      mockBillRepository.getBillsForDateRange.mockResolvedValue([]);

      // Mock the database query for popular items
      const mockKnex = require('../config/database').default;
      mockKnex.raw.mockResolvedValue({ rows: [] });

      const report = await reportingService.generateDailySalesReport(testDate);

      expect(report).toBeDefined();
      expect(report.totalRevenue).toBe(0);
      expect(report.totalOrders).toBe(0);
      expect(report.averageOrderValue).toBe(0);
      expect(report.popularItems).toEqual([]);
    });
  });

  describe('generateWeeklySalesReport', () => {
    it('should generate a weekly sales report with trend analysis', async () => {
      const weekStart = new Date('2024-01-15'); // Monday
      const mockBills = [
        {
          id: 'bill-1',
          orderId: 'order-1',
          subtotal: 20.00,
          taxAmount: 2.00,
          totalAmount: 22.00,
          paymentMethod: 'card' as any,
          paymentStatus: 'paid' as any,
          generatedAt: new Date('2024-01-15T12:00:00Z'),
          paidAt: new Date('2024-01-15T12:05:00Z'),
          createdAt: new Date('2024-01-15T12:00:00Z'),
          updatedAt: new Date('2024-01-15T12:05:00Z')
        }
      ];

      // Mock current week bills
      mockBillRepository.getBillsForDateRange
        .mockResolvedValueOnce(mockBills) // Current week
        .mockResolvedValueOnce([]); // Previous week

      // Mock the database query for popular items
      const mockKnex = require('../config/database').default;
      mockKnex.raw.mockResolvedValue({ rows: [] });

      const report = await reportingService.generateWeeklySalesReport(weekStart);

      expect(report).toBeDefined();
      expect(report.weekStart).toEqual(weekStart);
      expect(report.totalRevenue).toBe(22.00);
      expect(report.totalOrders).toBe(1);
      expect(report.dailyBreakdown).toHaveLength(7);
      expect(report.trendAnalysis).toBeDefined();
    });
  });

  describe('collectPerformanceMetrics', () => {
    it('should collect system performance metrics', async () => {
      const mockOrders = {
        data: [
          {
            id: 'order-1',
            tableId: 'table-1',
            waiterId: 'waiter-1',
            status: 'served' as any,
            items: [],
            totalAmount: 25.50,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            updatedAt: new Date(Date.now() - 5 * 60 * 1000)   // 5 minutes ago
          }
        ],
        pagination: {
          page: 1,
          limit: 1000,
          total: 1,
          totalPages: 1
        }
      };

      mockOrderRepository.findOrders.mockResolvedValue(mockOrders);

      // Mock the database query for database metrics
      const mockKnex = require('../config/database').default;
      mockKnex.raw.mockResolvedValue({ rows: [{ active_connections: '5' }] });

      const metrics = await reportingService.collectPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.averageOrderPreparationTime).toBeGreaterThanOrEqual(0);
      expect(metrics.orderThroughput).toBeDefined();
      expect(metrics.systemLoad).toBeDefined();
    });
  });

  describe('exportReport', () => {
    it('should export report data as JSON', async () => {
      const reportData = { test: 'data' };
      const options = { format: 'json' as const };

      const result = await reportingService.exportReport('daily', reportData, options);

      expect(typeof result).toBe('string');
      expect(JSON.parse(result as string)).toEqual(reportData);
    });

    it('should export report data as CSV', async () => {
      const reportData = {
        date: new Date('2024-01-15'),
        totalRevenue: 100,
        totalOrders: 5,
        averageOrderValue: 20,
        popularItems: [],
        revenueByPaymentMethod: { cash: 50, card: 50, digital: 0 },
        ordersByHour: []
      };
      const options = { format: 'csv' as const };

      const result = await reportingService.exportReport('daily', reportData, options);

      expect(typeof result).toBe('string');
      expect(result).toContain('Daily Sales Report');
      expect(result).toContain('Total Revenue,100');
    });

    it('should throw error for unsupported format', async () => {
      const reportData = { test: 'data' };
      const options = { format: 'xml' as any };

      await expect(
        reportingService.exportReport('daily', reportData, options)
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });
});