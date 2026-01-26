import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  validateCreateOrderRequest,
  validateUpdateOrderStatusRequest,
  isValidStatusTransition
} from '../models/Order';
import { OrderStatus, TableStatus } from '../models/enums';
import { PaginationParams, PaginatedResponse } from '../models';
import { orderRepository, OrderSearchFilters } from '../repositories/orderRepository';
import { menuService } from './menuService';
import { tableService } from './tableService';
import { inventoryService } from './inventoryService';
import { trackDatabaseQuery } from '../middleware/performanceMiddleware';
import { monitoringService } from './monitoringService';

export class OrderService {

  /**
   * Get all orders with optional filters and pagination
   */
  async getOrders(
    filters: OrderSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return trackDatabaseQuery('getOrdersWithDetails')(() => 
      orderRepository.findOrdersWithDetails(filters, pagination)
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    return orderRepository.findOrderById(id);
  }

  /**
   * Get orders by table ID
   */
  async getOrdersByTableId(tableId: string): Promise<Order[]> {
    return orderRepository.findOrdersByTableId(tableId);
  }

  /**
   * Get orders by waiter ID
   */
  async getOrdersByWaiterId(waiterId: string): Promise<Order[]> {
    return orderRepository.findOrdersByWaiterId(waiterId);
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return orderRepository.findOrdersByStatus(status);
  }

  /**
   * Get current active order for a table
   */
  async getActiveOrderByTableId(tableId: string): Promise<Order | null> {
    return orderRepository.findActiveOrderByTableId(tableId);
  }

  /**
   * Create a new order
   * Requirement 4.1: Order creation and table association
   */
  async createOrder(orderData: CreateOrderRequest, createdBy?: string): Promise<Order> {
    // Validate request
    const validationErrors = validateCreateOrderRequest(orderData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Verify table exists and is available for ordering
    const table = await tableService.getTableById(orderData.tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table can accept orders
    if (table.status === TableStatus.OUT_OF_SERVICE) {
      throw new Error('Cannot create order for table that is out of service');
    }

    // Check if table already has an active order
    const existingOrder = await this.getActiveOrderByTableId(orderData.tableId);
    if (existingOrder) {
      throw new Error('Table already has an active order');
    }

    // Validate menu items and availability
    await this.validateOrderItems(orderData.items);

    // Create the order
    const order = await orderRepository.createOrder(orderData);

    // Update table status to occupied if it's not already
    if (table.status === TableStatus.AVAILABLE) {
      try {
        await tableService.updateTableStatus(orderData.tableId, {
          status: TableStatus.OCCUPIED,
          currentOrderId: order.id
        }, createdBy);
      } catch (error) {
        console.warn('Failed to update table status after order creation:', error);
      }
    }

    return order;
  }

  /**
   * Update order (modify items before kitchen preparation)
   * Requirement 4.3: Order modification capabilities
   */
  async updateOrder(id: string, updateData: UpdateOrderRequest, updatedBy?: string): Promise<Order> {
    // Check if order exists
    const existingOrder = await orderRepository.findOrderById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if order can be modified (only PLACED orders can be modified)
    if (existingOrder.status !== OrderStatus.PLACED) {
      throw new Error(`Cannot modify order with status: ${existingOrder.status}. Only orders with status 'placed' can be modified.`);
    }

    // Validate menu items if items are being updated
    if (updateData.items) {
      await this.validateOrderItemUpdates(updateData.items);
    }

    const updatedOrder = await orderRepository.updateOrder(id, updateData);
    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    return updatedOrder;
  }

  /**
   * Update order status
   * Requirement 4.4: Order status transition system (Placed → Preparing → Ready → Served)
   */
  async updateOrderStatus(id: string, statusData: UpdateOrderStatusRequest, updatedBy?: string): Promise<Order> {
    // Validate request
    const validationErrors = validateUpdateOrderStatusRequest(statusData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if order exists
    const existingOrder = await orderRepository.findOrderById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!isValidStatusTransition(existingOrder.status, statusData.status)) {
      throw new Error(`Invalid status transition from ${existingOrder.status} to ${statusData.status}`);
    }

    const updatedOrder = await orderRepository.updateOrderStatus(id, statusData);
    if (!updatedOrder) {
      throw new Error('Failed to update order status');
    }

    // Handle table status updates when order is served
    if (statusData.status === OrderStatus.SERVED) {
      try {
        // Clear the table's current order reference
        const table = await tableService.getTableById(updatedOrder.tableId);
        if (table && table.currentOrderId === id) {
          await tableService.updateTableStatus(updatedOrder.tableId, {
            status: TableStatus.AVAILABLE
          }, updatedBy);
        }
      } catch (error) {
        console.warn('Failed to update table status after order completion:', error);
      }
    }

    return updatedOrder;
  }

  /**
   * Delete order item
   */
  async deleteOrderItem(orderId: string, itemId: string, deletedBy?: string): Promise<Order> {
    // Check if order exists
    const existingOrder = await orderRepository.findOrderById(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if order can be modified
    if (existingOrder.status !== OrderStatus.PLACED) {
      throw new Error(`Cannot modify order with status: ${existingOrder.status}. Only orders with status 'placed' can be modified.`);
    }

    // Check if this is the last item
    if (existingOrder.items.length <= 1) {
      throw new Error('Cannot delete the last item from an order. Delete the entire order instead.');
    }

    const updatedOrder = await orderRepository.deleteOrderItem(orderId, itemId);
    if (!updatedOrder) {
      throw new Error('Failed to delete order item');
    }

    return updatedOrder;
  }

  /**
   * Validate order items and their availability
   * Requirement 4.2: Order item management with availability validation
   */
  private async validateOrderItems(items: Array<{ menuItemId: string; quantity: number; unitPrice: number }>): Promise<void> {
    for (const item of items) {
      // Check if menu item exists
      const menuItem = await menuService.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      // Check if menu item is available
      if (!menuItem.isAvailable) {
        throw new Error(`Menu item is not available: ${menuItem.name}`);
      }

      // Validate unit price matches menu item price
      if (Math.abs(item.unitPrice - menuItem.price) > 0.01) {
        throw new Error(`Unit price mismatch for item ${menuItem.name}. Expected: ${menuItem.price}, Provided: ${item.unitPrice}`);
      }
    }
  }

  /**
   * Validate order item updates
   */
  private async validateOrderItemUpdates(items: Array<{ menuItemId: string; quantity: number; unitPrice: number }>): Promise<void> {
    for (const item of items) {
      // Check if menu item exists
      const menuItem = await menuService.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      // Check if menu item is available
      if (!menuItem.isAvailable) {
        throw new Error(`Menu item is not available: ${menuItem.name}`);
      }

      // Validate unit price matches menu item price
      if (Math.abs(item.unitPrice - menuItem.price) > 0.01) {
        throw new Error(`Unit price mismatch for item ${menuItem.name}. Expected: ${menuItem.price}, Provided: ${item.unitPrice}`);
      }
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(): Promise<{
    totalOrders: number;
    ordersByStatus: Record<OrderStatus, number>;
    averageOrderValue: number;
    totalRevenue: number;
  }> {
    const allOrders = await orderRepository.findOrders({}, { limit: 10000 });
    
    const ordersByStatus = {
      [OrderStatus.PLACED]: 0,
      [OrderStatus.PREPARING]: 0,
      [OrderStatus.READY]: 0,
      [OrderStatus.SERVED]: 0
    };

    let totalRevenue = 0;

    allOrders.data.forEach(order => {
      ordersByStatus[order.status]++;
      if (order.status === OrderStatus.SERVED) {
        totalRevenue += order.totalAmount;
      }
    });

    const averageOrderValue = allOrders.data.length > 0 
      ? totalRevenue / ordersByStatus[OrderStatus.SERVED] || 0
      : 0;

    return {
      totalOrders: allOrders.data.length,
      ordersByStatus,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }

  /**
   * Get orders for kitchen staff (orders that need preparation)
   */
  async getKitchenOrders(): Promise<Order[]> {
    const preparingOrders = await this.getOrdersByStatus(OrderStatus.PREPARING);
    const placedOrders = await this.getOrdersByStatus(OrderStatus.PLACED);
    
    // Return orders that need kitchen attention, sorted by creation time
    return [...placedOrders, ...preparingOrders].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  /**
   * Get orders ready for service
   */
  async getReadyOrders(): Promise<Order[]> {
    return this.getOrdersByStatus(OrderStatus.READY);
  }

  /**
   * Start preparing an order (kitchen staff workflow)
   * Transitions order from PLACED to PREPARING
   * Requirement 6.1: Automatic stock deduction on order preparation
   */
  async startPreparingOrder(orderId: string, kitchenStaffId?: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new Error(`Cannot start preparing order with status: ${order.status}. Only orders with status 'placed' can be started.`);
    }

    // Collect all ingredients needed for this order
    const allIngredients: Array<{ inventoryItemId: string; quantity: number; unit: string }> = [];
    
    for (const orderItem of order.items) {
      const menuItem = await menuService.getMenuItemById(orderItem.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${orderItem.menuItemId}`);
      }

      // Add ingredients for this menu item, multiplied by quantity ordered
      for (const ingredient of menuItem.ingredients) {
        const totalQuantityNeeded = ingredient.quantity * orderItem.quantity;
        
        // Check if we already have this ingredient in our list
        const existingIngredient = allIngredients.find(
          ing => ing.inventoryItemId === ingredient.inventoryItemId
        );
        
        if (existingIngredient) {
          existingIngredient.quantity += totalQuantityNeeded;
        } else {
          allIngredients.push({
            inventoryItemId: ingredient.inventoryItemId,
            quantity: totalQuantityNeeded,
            unit: ingredient.unit
          });
        }
      }
    }

    // Deduct stock from inventory if there are ingredients
    if (allIngredients.length > 0) {
      try {
        await inventoryService.deductStockForOrder(
          allIngredients,
          orderId,
          kitchenStaffId || 'system'
        );
      } catch (error) {
        throw new Error(`Cannot start preparing order due to inventory issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return this.updateOrderStatus(orderId, { status: OrderStatus.PREPARING }, kitchenStaffId);
  }

  /**
   * Mark order as ready (kitchen staff workflow)
   * Transitions order from PREPARING to READY
   */
  async markOrderReady(orderId: string, kitchenStaffId?: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PREPARING) {
      throw new Error(`Cannot mark order as ready with status: ${order.status}. Only orders with status 'preparing' can be marked as ready.`);
    }

    return this.updateOrderStatus(orderId, { status: OrderStatus.READY }, kitchenStaffId);
  }

  /**
   * Mark order as served (waiter workflow)
   * Transitions order from READY to SERVED
   */
  async markOrderServed(orderId: string, waiterId?: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.READY) {
      throw new Error(`Cannot mark order as served with status: ${order.status}. Only orders with status 'ready' can be marked as served.`);
    }

    return this.updateOrderStatus(orderId, { status: OrderStatus.SERVED }, waiterId);
  }

  /**
   * Get kitchen workflow summary
   */
  async getKitchenWorkflowSummary(): Promise<{
    ordersToStart: Order[];
    ordersInProgress: Order[];
    ordersReadyToServe: Order[];
    totalActiveOrders: number;
    averagePreparationTime?: number;
  }> {
    const [placedOrders, preparingOrders, readyOrders] = await Promise.all([
      this.getOrdersByStatus(OrderStatus.PLACED),
      this.getOrdersByStatus(OrderStatus.PREPARING),
      this.getOrdersByStatus(OrderStatus.READY)
    ]);

    // Sort by creation time (oldest first for kitchen priority)
    const ordersToStart = placedOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const ordersInProgress = preparingOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const ordersReadyToServe = readyOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const totalActiveOrders = ordersToStart.length + ordersInProgress.length + ordersReadyToServe.length;

    // Calculate average preparation time for orders in progress
    let averagePreparationTime: number | undefined;
    if (ordersInProgress.length > 0) {
      const now = new Date();
      const totalPreparationTime = ordersInProgress.reduce((sum, order) => {
        return sum + (now.getTime() - order.createdAt.getTime());
      }, 0);
      averagePreparationTime = Math.round(totalPreparationTime / ordersInProgress.length / 1000 / 60); // Convert to minutes
    }

    return {
      ordersToStart,
      ordersInProgress,
      ordersReadyToServe,
      totalActiveOrders,
      ...(averagePreparationTime !== undefined && { averagePreparationTime })
    };
  }
}

// Export singleton instance
export const orderService = new OrderService();