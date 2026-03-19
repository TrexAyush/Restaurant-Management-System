import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { OrderStatus } from '../models/enums';
import { PaginationParams } from '../models';
import { OrderSearchFilters } from '../repositories/orderRepository';

export class OrderController {

  /**
   * Get all orders with optional filters and pagination
   * GET /api/orders
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const filters: OrderSearchFilters = {};
      const pagination: PaginationParams = {};

      // Extract filters from query parameters
      if (req.query.tableId) {
        filters.tableId = req.query.tableId as string;
      }

      if (req.query.waiterId) {
        filters.waiterId = req.query.waiterId as string;
      }

      if (req.query.status) {
        const status = req.query.status as string;
        if (Object.values(OrderStatus).includes(status as OrderStatus)) {
          filters.status = status as OrderStatus;
        }
      }

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }

      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      // Extract pagination parameters with validation
      if (req.query.page) {
        const parsedPage = parseInt(req.query.page as string);
        pagination.page = parsedPage > 0 ? parsedPage : 1;
      }

      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string);
        pagination.limit = parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
      }

      if (req.query.sortBy) {
        pagination.sortBy = req.query.sortBy as string;
      }

      if (req.query.sortOrder) {
        pagination.sortOrder = req.query.sortOrder as 'asc' | 'desc';
      }

      const result = await orderService.getOrders(filters, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders'
      });
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error getting order by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order'
      });
    }
  }

  /**
   * Get orders by table ID
   * GET /api/orders/table/:tableId
   */
  async getOrdersByTableId(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: 'Table ID is required'
        });
        return;
      }

      const orders = await orderService.getOrdersByTableId(tableId);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error getting orders by table ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders for table'
      });
    }
  }

  /**
   * Get active order for table
   * GET /api/orders/table/:tableId/active
   */
  async getActiveOrderByTableId(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: 'Table ID is required'
        });
        return;
      }

      const order = await orderService.getActiveOrderByTableId(tableId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'No active order found for this table'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error getting active order by table ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve active order for table'
      });
    }
  }

  /**
   * Get orders by waiter ID
   * GET /api/orders/waiter/:waiterId
   */
  async getOrdersByWaiterId(req: Request, res: Response): Promise<void> {
    try {
      const { waiterId } = req.params;

      if (!waiterId) {
        res.status(400).json({
          success: false,
          error: 'Waiter ID is required'
        });
        return;
      }

      const orders = await orderService.getOrdersByWaiterId(waiterId);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error getting orders by waiter ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders for waiter'
      });
    }
  }

  /**
   * Get orders by status
   * GET /api/orders/status/:status
   */
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;

      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        res.status(400).json({
          success: false,
          error: 'Invalid order status'
        });
        return;
      }

      const orders = await orderService.getOrdersByStatus(status as OrderStatus);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error getting orders by status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders by status'
      });
    }
  }

  /**
   * Get kitchen orders (for kitchen staff)
   * GET /api/orders/kitchen
   */
  async getKitchenOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await orderService.getKitchenOrders();

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error getting kitchen orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve kitchen orders'
      });
    }
  }

  /**
   * Get ready orders (for waiters)
   * GET /api/orders/ready
   */
  async getReadyOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await orderService.getReadyOrders();

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error getting ready orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve ready orders'
      });
    }
  }

  /**
   * Create a new order
   * POST /api/orders
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const createdBy = req.user?.userId; // Assuming user info is available from auth middleware

      const order = await orderService.createOrder(orderData, createdBy);

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Validation failed') || 
            error.message.includes('not found') ||
            error.message.includes('not available') ||
            error.message.includes('already has an active order')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create order'
      });
    }
  }

  /**
   * Update order
   * PUT /api/orders/:id
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.updateOrder(id, updateData, updatedBy);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error updating order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Cannot modify') || 
            error.message.includes('not available')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order'
      });
    }
  }

  /**
   * Update order status
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const statusData = req.body;
      const updatedBy = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.updateOrderStatus(id, statusData, updatedBy);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Invalid status transition') || 
            error.message.includes('Validation failed')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  }

  /**
   * Delete order item
   * DELETE /api/orders/:orderId/items/:itemId
   */
  async deleteOrderItem(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, itemId } = req.params;
      const deletedBy = req.user?.userId;

      if (!orderId || !itemId) {
        res.status(400).json({
          success: false,
          error: 'Order ID and Item ID are required'
        });
        return;
      }

      const order = await orderService.deleteOrderItem(orderId, itemId, deletedBy);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error deleting order item:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Cannot modify') || 
            error.message.includes('Cannot delete the last item')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete order item'
      });
    }
  }

  /**
   * Get order statistics
   * GET /api/orders/statistics
   */
  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await orderService.getOrderStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting order statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order statistics'
      });
    }
  }

  /**
   * Start preparing an order (kitchen staff workflow)
   * PUT /api/orders/:id/start-preparing
   */
  async startPreparingOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const kitchenStaffId = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.startPreparingOrder(id, kitchenStaffId);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error starting order preparation:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Cannot start preparing')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to start order preparation'
      });
    }
  }

  /**
   * Mark order as ready (kitchen staff workflow)
   * PUT /api/orders/:id/mark-ready
   */
  async markOrderReady(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const kitchenStaffId = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.markOrderReady(id, kitchenStaffId);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error marking order as ready:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Cannot mark order as ready')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to mark order as ready'
      });
    }
  }

  /**
   * Mark order as served (waiter workflow)
   * PUT /api/orders/:id/mark-served
   */
  async markOrderServed(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const waiterId = req.user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }

      const order = await orderService.markOrderServed(id, waiterId);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error marking order as served:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }

        if (error.message.includes('Cannot mark order as served')) {
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to mark order as served'
      });
    }
  }

  /**
   * Get kitchen workflow summary
   * GET /api/orders/kitchen/workflow-summary
   */
  async getKitchenWorkflowSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await orderService.getKitchenWorkflowSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting kitchen workflow summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve kitchen workflow summary'
      });
    }
  }
}

// Export singleton instance
export const orderController = new OrderController();