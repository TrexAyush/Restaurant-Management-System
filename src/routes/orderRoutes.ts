import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { 
  authenticate, 
  requireManager, 
  requireManagerOrWaiter,
  requireKitchenStaff,
  trackSession 
} from '../middleware/authMiddleware';

const router = Router();

// Order Management Routes

/**
 * @route GET /api/orders
 * @desc Get all orders with optional filters and pagination
 * @access Private (Manager or Waiter)
 */
router.get('/', authenticate, trackSession, requireManagerOrWaiter, orderController.getOrders.bind(orderController));

/**
 * @route GET /api/orders/statistics
 * @desc Get order statistics
 * @access Private (Manager only)
 */
router.get('/statistics', authenticate, trackSession, requireManager, orderController.getOrderStatistics.bind(orderController));

/**
 * @route GET /api/orders/kitchen/workflow-summary
 * @desc Get kitchen workflow summary
 * @access Private (Kitchen Staff or Manager)
 */
router.get('/kitchen/workflow-summary', authenticate, trackSession, requireKitchenStaff, orderController.getKitchenWorkflowSummary.bind(orderController));

/**
 * @route GET /api/orders/kitchen
 * @desc Get orders for kitchen staff (orders that need preparation)
 * @access Private (Kitchen Staff or Manager)
 */
router.get('/kitchen', authenticate, trackSession, requireKitchenStaff, orderController.getKitchenOrders.bind(orderController));

/**
 * @route GET /api/orders/ready
 * @desc Get orders ready for service
 * @access Private (Waiter or Manager)
 */
router.get('/ready', authenticate, trackSession, requireManagerOrWaiter, orderController.getReadyOrders.bind(orderController));

/**
 * @route GET /api/orders/status/:status
 * @desc Get orders by status
 * @access Private (Manager or Waiter)
 */
router.get('/status/:status', authenticate, trackSession, requireManagerOrWaiter, orderController.getOrdersByStatus.bind(orderController));

/**
 * @route GET /api/orders/table/:tableId
 * @desc Get orders by table ID
 * @access Private (Manager or Waiter)
 */
router.get('/table/:tableId', authenticate, trackSession, requireManagerOrWaiter, orderController.getOrdersByTableId.bind(orderController));

/**
 * @route GET /api/orders/table/:tableId/active
 * @desc Get active order for table
 * @access Private (Manager or Waiter)
 */
router.get('/table/:tableId/active', authenticate, trackSession, requireManagerOrWaiter, orderController.getActiveOrderByTableId.bind(orderController));

/**
 * @route GET /api/orders/waiter/:waiterId
 * @desc Get orders by waiter ID
 * @access Private (Manager or Waiter - waiters can only see their own orders)
 */
router.get('/waiter/:waiterId', authenticate, trackSession, requireManagerOrWaiter, orderController.getOrdersByWaiterId.bind(orderController));

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private (Manager or Waiter)
 */
router.get('/:id', authenticate, trackSession, requireManagerOrWaiter, orderController.getOrderById.bind(orderController));

/**
 * @route POST /api/orders
 * @desc Create new order
 * @access Private (Waiter or Manager)
 */
router.post('/', authenticate, trackSession, requireManagerOrWaiter, orderController.createOrder.bind(orderController));

/**
 * @route PUT /api/orders/:id
 * @desc Update order (modify items before kitchen preparation)
 * @access Private (Waiter or Manager)
 */
router.put('/:id', authenticate, trackSession, requireManagerOrWaiter, orderController.updateOrder.bind(orderController));

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private (Kitchen Staff for preparing/ready, Waiter for served, Manager for all)
 */
router.put('/:id/status', authenticate, trackSession, orderController.updateOrderStatus.bind(orderController));

/**
 * @route PUT /api/orders/:id/start-preparing
 * @desc Start preparing an order (kitchen staff workflow)
 * @access Private (Kitchen Staff or Manager)
 */
router.put('/:id/start-preparing', authenticate, trackSession, requireKitchenStaff, orderController.startPreparingOrder.bind(orderController));

/**
 * @route PUT /api/orders/:id/mark-ready
 * @desc Mark order as ready (kitchen staff workflow)
 * @access Private (Kitchen Staff or Manager)
 */
router.put('/:id/mark-ready', authenticate, trackSession, requireKitchenStaff, orderController.markOrderReady.bind(orderController));

/**
 * @route PUT /api/orders/:id/mark-served
 * @desc Mark order as served (waiter workflow)
 * @access Private (Waiter or Manager)
 */
router.put('/:id/mark-served', authenticate, trackSession, requireManagerOrWaiter, orderController.markOrderServed.bind(orderController));

/**
 * @route DELETE /api/orders/:orderId/items/:itemId
 * @desc Delete order item
 * @access Private (Waiter or Manager)
 */
router.delete('/:orderId/items/:itemId', authenticate, trackSession, requireManagerOrWaiter, orderController.deleteOrderItem.bind(orderController));

export default router;