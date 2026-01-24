import { Router } from 'express';
import { tableController } from '../controllers/tableController';
import { 
  authenticate, 
  requireManager, 
  requireManagerOrWaiter,
  trackSession 
} from '../middleware/authMiddleware';

const router = Router();

// Table Management Routes

/**
 * @route GET /api/tables
 * @desc Get all tables with optional filters and pagination
 * @access Private (All authenticated users)
 */
router.get('/', authenticate, trackSession, tableController.getTables.bind(tableController));

/**
 * @route GET /api/tables/websocket-status
 * @desc Get WebSocket connection status and statistics
 * @access Private (Manager only)
 */
router.get('/websocket-status', authenticate, trackSession, requireManager, tableController.getWebSocketStatus.bind(tableController));

/**
 * @route GET /api/tables/statistics
 * @desc Get table statistics
 * @access Private (Manager only)
 */
router.get('/statistics', authenticate, trackSession, requireManager, tableController.getTableStatistics.bind(tableController));

/**
 * @route GET /api/tables/occupancy-summary
 * @desc Get table occupancy summary
 * @access Private (Manager or Waiter)
 */
router.get('/occupancy-summary', authenticate, trackSession, requireManagerOrWaiter, tableController.getTableOccupancySummary.bind(tableController));

/**
 * @route GET /api/tables/status/:status
 * @desc Get tables by status
 * @access Private (All authenticated users)
 */
router.get('/status/:status', authenticate, trackSession, tableController.getTablesByStatus.bind(tableController));

/**
 * @route GET /api/tables/available/:capacity
 * @desc Get available tables with minimum capacity
 * @access Private (Manager or Waiter)
 */
router.get('/available/:capacity', authenticate, trackSession, requireManagerOrWaiter, tableController.getAvailableTablesWithCapacity.bind(tableController));

/**
 * @route GET /api/tables/best-for-party/:partySize
 * @desc Find best available table for party size
 * @access Private (Manager or Waiter)
 */
router.get('/best-for-party/:partySize', authenticate, trackSession, requireManagerOrWaiter, tableController.findBestTableForParty.bind(tableController));

/**
 * @route GET /api/tables/number/:number
 * @desc Get table by number
 * @access Private (All authenticated users)
 */
router.get('/number/:number', authenticate, trackSession, tableController.getTableByNumber.bind(tableController));

/**
 * @route GET /api/tables/:id
 * @desc Get table by ID
 * @access Private (All authenticated users)
 */
router.get('/:id', authenticate, trackSession, tableController.getTableById.bind(tableController));

/**
 * @route POST /api/tables
 * @desc Create new table
 * @access Private (Manager only)
 */
router.post('/', authenticate, trackSession, requireManager, tableController.createTable.bind(tableController));

/**
 * @route PUT /api/tables/:id
 * @desc Update table
 * @access Private (Manager only)
 */
router.put('/:id', authenticate, trackSession, requireManager, tableController.updateTable.bind(tableController));

/**
 * @route PUT /api/tables/:id/status
 * @desc Update table status
 * @access Private (Manager or Waiter)
 */
router.put('/:id/status', authenticate, trackSession, requireManagerOrWaiter, tableController.updateTableStatus.bind(tableController));

/**
 * @route PUT /api/tables/:id/seat
 * @desc Seat customers at a table
 * @access Private (Manager or Waiter)
 */
router.put('/:id/seat', authenticate, trackSession, requireManagerOrWaiter, tableController.seatCustomers.bind(tableController));

/**
 * @route PUT /api/tables/:id/clear
 * @desc Clear table (make it available)
 * @access Private (Manager or Waiter)
 */
router.put('/:id/clear', authenticate, trackSession, requireManagerOrWaiter, tableController.clearTable.bind(tableController));

/**
 * @route PUT /api/tables/:id/reserve
 * @desc Reserve table
 * @access Private (Manager or Waiter)
 */
router.put('/:id/reserve', authenticate, trackSession, requireManagerOrWaiter, tableController.reserveTable.bind(tableController));

/**
 * @route PUT /api/tables/:id/out-of-service
 * @desc Take table out of service
 * @access Private (Manager only)
 */
router.put('/:id/out-of-service', authenticate, trackSession, requireManager, tableController.takeTableOutOfService.bind(tableController));

/**
 * @route PUT /api/tables/:id/back-in-service
 * @desc Put table back in service
 * @access Private (Manager only)
 */
router.put('/:id/back-in-service', authenticate, trackSession, requireManager, tableController.putTableBackInService.bind(tableController));

/**
 * @route DELETE /api/tables/:id
 * @desc Delete table
 * @access Private (Manager only)
 */
router.delete('/:id', authenticate, trackSession, requireManager, tableController.deleteTable.bind(tableController));

export default router;