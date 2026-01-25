import { Request, Response } from 'express';
import { BillingController } from './billingController';
import { billingService } from '../services/billingService';
import { PaymentMethod, PaymentStatus } from '../models/enums';

// Mock the billing service
jest.mock('../services/billingService');
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

describe('BillingController', () => {
  let billingController: BillingController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    billingController = new BillingController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('generateBill', () => {
    it('should generate a bill successfully', async () => {
      const mockBill = {
        id: 'bill-123',
        orderId: 'order-123',
        subtotal: 100.00,
        taxAmount: 8.00,
        totalAmount: 108.00,
        paymentStatus: PaymentStatus.PENDING,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = { orderId: 'order-123', taxRate: 0.08 };
      mockBillingService.generateBill.mockResolvedValue(mockBill as any);

      await billingController.generateBill(mockRequest as Request, mockResponse as Response);

      expect(mockBillingService.generateBill).toHaveBeenCalledWith('order-123', 0.08);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBill
      });
    });

    it('should return error when orderId is missing', async () => {
      mockRequest.body = {};

      await billingController.generateBill(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID is required'
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = { orderId: 'order-123' };
      mockBillingService.generateBill.mockRejectedValue(new Error('Order not found'));

      await billingController.generateBill(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockBill = {
        id: 'bill-123',
        orderId: 'order-123',
        subtotal: 100.00,
        taxAmount: 8.00,
        totalAmount: 108.00,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PAID,
        generatedAt: new Date(),
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'bill-123' };
      mockRequest.body = { paymentMethod: PaymentMethod.CARD };
      mockBillingService.processPayment.mockResolvedValue(mockBill as any);

      await billingController.processPayment(mockRequest as Request, mockResponse as Response);

      expect(mockBillingService.processPayment).toHaveBeenCalledWith('bill-123', { 
        paymentMethod: PaymentMethod.CARD 
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBill
      });
    });

    it('should return error when bill ID is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { paymentMethod: PaymentMethod.CARD };

      await billingController.processPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bill ID is required'
      });
    });

    it('should return error when payment method is missing', async () => {
      mockRequest.params = { id: 'bill-123' };
      mockRequest.body = {};

      await billingController.processPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment method is required'
      });
    });
  });

  describe('calculateBillTotals', () => {
    it('should calculate bill totals successfully', async () => {
      const mockCalculation = {
        subtotal: 100.00,
        taxRate: 0.08,
        taxAmount: 8.00,
        totalAmount: 108.00
      };

      mockRequest.body = { subtotal: 100.00, taxRate: 0.08 };
      mockBillingService.calculateBillTotals.mockReturnValue(mockCalculation);

      await billingController.calculateBillTotals(mockRequest as Request, mockResponse as Response);

      expect(mockBillingService.calculateBillTotals).toHaveBeenCalledWith(100.00, 0.08);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCalculation
      });
    });

    it('should return error when parameters are missing', async () => {
      mockRequest.body = { subtotal: 100.00 };

      await billingController.calculateBillTotals(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Subtotal and tax rate are required'
      });
    });
  });

  describe('generatePDFInvoice', () => {
    it('should generate PDF invoice successfully', async () => {
      const mockPDFBuffer = Buffer.from('mock pdf content');

      mockRequest.params = { id: 'bill-123' };
      mockRequest.query = {};
      mockBillingService.generatePDFInvoice.mockResolvedValue(mockPDFBuffer);

      await billingController.generatePDFInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockBillingService.generatePDFInvoice).toHaveBeenCalledWith('bill-123', undefined, undefined);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="invoice-bill-123.pdf"');
      expect(mockResponse.send).toHaveBeenCalledWith(mockPDFBuffer);
    });

    it('should return error when bill ID is missing', async () => {
      mockRequest.params = {};

      await billingController.generatePDFInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bill ID is required'
      });
    });
  });
});