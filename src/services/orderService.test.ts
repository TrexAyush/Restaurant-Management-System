import { orderService } from './orderService';
import { orderRepository } from '../repositories/orderRepository';
import { menuService } from './menuService';
import { tableService } from './tableService';
import { OrderStatus } from '../models/enums';
import { Order } from '../models/Order';

// Mock dependencies
jest.mock('../repositories/orderRepository');
jest.mock('./menuService');
jest.mock('./tableService');
jest.mock('./websocketService', () => ({
  getWebSocketService: () => ({
    broadcastOrderCreated: jest.fn(),
    broadcastOrderUpdated: jest.fn(),
    broadcastOrderStatusUpdate: jest.fn()
  })
}));

const mockOrderRepository = orderRepository as jest.Mocked<typeof orderRepository>;
const mockMenuService = menuService as jest.Mocked<typeof menuService>;
const mockTableService = tableService as jest.Mocked<typeof tableService>;

describe('OrderService - Kitchen Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startPreparingOrder', () => {
    it('should transition order from PLACED to PREPARING', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PLACED,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedOrder: Order = {
        ...mockOrder,
        status: OrderStatus.PREPARING
      };

      mockOrderRepository.findOrderById.mockResolvedValue(mockOrder);
      mockOrderRepository.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      const result = await orderService.startPreparingOrder('order-1', 'kitchen-staff-1');

      expect(mockOrderRepository.findOrderById).toHaveBeenCalledWith('order-1');
      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', { status: OrderStatus.PREPARING });
      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('should throw error if order is not in PLACED status', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PREPARING,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderRepository.findOrderById.mockResolvedValue(mockOrder);

      await expect(orderService.startPreparingOrder('order-1', 'kitchen-staff-1'))
        .rejects.toThrow('Cannot start preparing order with status: preparing');
    });
  });

  describe('markOrderReady', () => {
    it('should transition order from PREPARING to READY', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PREPARING,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedOrder: Order = {
        ...mockOrder,
        status: OrderStatus.READY
      };

      mockOrderRepository.findOrderById.mockResolvedValue(mockOrder);
      mockOrderRepository.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      const result = await orderService.markOrderReady('order-1', 'kitchen-staff-1');

      expect(mockOrderRepository.findOrderById).toHaveBeenCalledWith('order-1');
      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', { status: OrderStatus.READY });
      expect(result.status).toBe(OrderStatus.READY);
    });

    it('should throw error if order is not in PREPARING status', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PLACED,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderRepository.findOrderById.mockResolvedValue(mockOrder);

      await expect(orderService.markOrderReady('order-1', 'kitchen-staff-1'))
        .rejects.toThrow('Cannot mark order as ready with status: placed');
    });
  });

  describe('markOrderServed', () => {
    it('should transition order from READY to SERVED', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.READY,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedOrder: Order = {
        ...mockOrder,
        status: OrderStatus.SERVED
      };

      mockOrderRepository.findOrderById.mockResolvedValue(mockOrder);
      mockOrderRepository.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);
      mockTableService.getTableById.mockResolvedValue({
        id: 'table-1',
        number: 1,
        capacity: 4,
        status: 'occupied' as any,
        currentOrderId: 'order-1',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockTableService.updateTableStatus.mockResolvedValue({} as any);

      const result = await orderService.markOrderServed('order-1', 'waiter-1');

      expect(mockOrderRepository.findOrderById).toHaveBeenCalledWith('order-1');
      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', { status: OrderStatus.SERVED });
      expect(result.status).toBe(OrderStatus.SERVED);
    });
  });

  describe('getKitchenWorkflowSummary', () => {
    it('should return kitchen workflow summary', async () => {
      const placedOrders: Order[] = [{
        id: 'order-1',
        tableId: 'table-1',
        waiterId: 'waiter-1',
        status: OrderStatus.PLACED,
        items: [],
        totalAmount: 25.50,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        updatedAt: new Date()
      }];

      const preparingOrders: Order[] = [{
        id: 'order-2',
        tableId: 'table-2',
        waiterId: 'waiter-1',
        status: OrderStatus.PREPARING,
        items: [],
        totalAmount: 35.75,
        createdAt: new Date(Date.now() - 600000), // 10 minutes ago
        updatedAt: new Date()
      }];

      const readyOrders: Order[] = [{
        id: 'order-3',
        tableId: 'table-3',
        waiterId: 'waiter-2',
        status: OrderStatus.READY,
        items: [],
        totalAmount: 42.25,
        createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        updatedAt: new Date()
      }];

      mockOrderRepository.findOrdersByStatus
        .mockResolvedValueOnce(placedOrders)
        .mockResolvedValueOnce(preparingOrders)
        .mockResolvedValueOnce(readyOrders);

      const result = await orderService.getKitchenWorkflowSummary();

      expect(result.ordersToStart).toHaveLength(1);
      expect(result.ordersInProgress).toHaveLength(1);
      expect(result.ordersReadyToServe).toHaveLength(1);
      expect(result.totalActiveOrders).toBe(3);
      expect(result.averagePreparationTime).toBeDefined();
      expect(typeof result.averagePreparationTime).toBe('number');
    });
  });
});