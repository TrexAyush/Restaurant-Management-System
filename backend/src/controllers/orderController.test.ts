import { Request, Response } from 'express';
import { orderController } from './orderController';
import { orderService } from '../services/orderService';
import { OrderStatus, UserRole } from '../models/enums';
import { Order, OrderItem } from '../models/Order';

// Mock the order service
jest.mock('../services/orderService');
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('OrderController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { userId: 'user-1', username: 'testuser', role: UserRole.WAITER }
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PLACED,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'order-1' };
      mockOrderService.getOrderById.mockResolvedValue(mockOrder);

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockOrder
      });
    });

    it('should return 404 when order not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockOrderService.getOrderById.mockResolvedValue(null);

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const orderData = {
        tableId: 'table-1',
        waiterId: 'waiter-1',
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            unitPrice: 12.75,
            specialInstructions: 'No onions'
          }
        ]
      };

      const mockOrderItems: OrderItem[] = [
        {
          id: 'item-1',
          orderId: 'order-1',
          menuItemId: 'item-1',
          quantity: 2,
          unitPrice: 12.75,
          specialInstructions: 'No onions',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockCreatedOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PLACED,
        items: mockOrderItems,
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = orderData;
      mockOrderService.createOrder.mockResolvedValue(mockCreatedOrder);

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(orderData, 'user-1');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedOrder
      });
    });

    it('should return 400 for validation errors', async () => {
      const invalidOrderData = {
        tableId: '',
        waiterId: 'waiter-1',
        items: []
      };

      mockRequest.body = invalidOrderData;
      mockOrderService.createOrder.mockRejectedValue(new Error('Validation failed: Table ID is required'));

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed: Table ID is required'
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const statusData = { status: OrderStatus.PREPARING };
      const mockUpdatedOrder = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PREPARING,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'order-1' };
      mockRequest.body = statusData;
      mockOrderService.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('order-1', statusData, 'user-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder
      });
    });

    it('should return 400 for invalid status transition', async () => {
      const statusData = { status: OrderStatus.PLACED };

      mockRequest.params = { id: 'order-1' };
      mockRequest.body = statusData;
      mockOrderService.updateOrderStatus.mockRejectedValue(new Error('Invalid status transition from served to placed'));

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status transition from served to placed'
      });
    });
  });
});