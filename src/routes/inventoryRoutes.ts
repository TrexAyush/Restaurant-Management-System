import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController';
import { 
  authenticate, 
  requireManager, 
  requireManagerOrKitchenStaff,
  trackSession 
} from '../middleware/authMiddleware';

const router = Router();

// Inventory Item Management Routes

/**
 * @route GET /api/inventory
 * @desc Get all inventory items with optional filters and pagination
 * @access Private (Manager only)
 */
router.get('/', authenticate, trackSession, requireManager, inventoryController.getInventoryItems.bind(inventoryController));

/**
 * @route GET /api/inventory/search
 * @desc Search inventory items
 * @access Private (Manager only)
 */
router.get('/search', authenticate, trackSession, requireManager, inventoryController.searchInventoryItems.bind(inventoryController));

/**
 * @route GET /api/inventory/statistics
 * @desc Get inventory statistics
 * @access Private (Manager only)
 */
router.get('/statistics', authenticate, trackSession, requireManager, inventoryController.getInventoryStatistics.bind(inventoryController));

/**
 * @route GET /api/inventory/alerts/low-stock
 * @desc Get low stock alerts
 * @access Private (Manager or Kitchen Staff)
 */
router.get('/alerts/low-stock', authenticate, trackSession, requireManagerOrKitchenStaff, inventoryController.getLowStockAlerts.bind(inventoryController));

/**
 * @route GET /api/inventory/reports/summary
 * @desc Get inventory report summary
 * @access Private (Manager only)
 */
router.get('/reports/summary', authenticate, trackSession, requireManager, inventoryController.getInventoryReport.bind(inventoryController));

/**
 * @route GET /api/inventory/reports/restocking
 * @desc Get restocking recommendations
 * @access Private (Manager only)
 */
router.get('/reports/restocking', authenticate, trackSession, requireManager, inventoryController.getRestockingRecommendations.bind(inventoryController));

/**
 * @route GET /api/inventory/reports/valuation
 * @desc Get inventory valuation report
 * @access Private (Manager only)
 */
router.get('/reports/valuation', authenticate, trackSession, requireManager, inventoryController.getInventoryValuation.bind(inventoryController));

/**
 * @route GET /api/inventory/reports/turnover
 * @desc Get inventory turnover analysis
 * @access Private (Manager only)
 */
router.get('/reports/turnover', authenticate, trackSession, requireManager, inventoryController.getInventoryTurnoverAnalysis.bind(inventoryController));

/**
 * @route GET /api/inventory/reports/suppliers
 * @desc Get supplier performance report
 * @access Private (Manager only)
 */
router.get('/reports/suppliers', authenticate, trackSession, requireManager, inventoryController.getSupplierPerformanceReport.bind(inventoryController));

/**
 * @route GET /api/inventory/dashboard
 * @desc Get inventory dashboard data
 * @access Private (Manager only)
 */
router.get('/dashboard', authenticate, trackSession, requireManager, inventoryController.getInventoryDashboard.bind(inventoryController));

/**
 * @route GET /api/inventory/:id
 * @desc Get inventory item by ID
 * @access Private (Manager only)
 */
router.get('/:id', authenticate, trackSession, requireManager, inventoryController.getInventoryItemById.bind(inventoryController));

/**
 * @route GET /api/inventory/:id/history
 * @desc Get inventory update history for an item
 * @access Private (Manager only)
 */
router.get('/:id/history', authenticate, trackSession, requireManager, inventoryController.getUpdateHistory.bind(inventoryController));

/**
 * @route POST /api/inventory
 * @desc Create new inventory item
 * @access Private (Manager only)
 */
router.post('/', authenticate, trackSession, requireManager, inventoryController.createInventoryItem.bind(inventoryController));

/**
 * @route POST /api/inventory/check-availability
 * @desc Check ingredient availability for menu items
 * @access Private (Manager or Kitchen Staff)
 */
router.post('/check-availability', authenticate, trackSession, requireManagerOrKitchenStaff, inventoryController.checkIngredientAvailability.bind(inventoryController));

/**
 * @route POST /api/inventory/bulk-update
 * @desc Bulk update stock levels
 * @access Private (Manager only)
 */
router.post('/bulk-update', authenticate, trackSession, requireManager, inventoryController.bulkUpdateStock.bind(inventoryController));

/**
 * @route POST /api/inventory/:id/add-stock
 * @desc Add stock to inventory item
 * @access Private (Manager only)
 */
router.post('/:id/add-stock', authenticate, trackSession, requireManager, inventoryController.addStock.bind(inventoryController));

/**
 * @route PUT /api/inventory/:id
 * @desc Update inventory item
 * @access Private (Manager only)
 */
router.put('/:id', authenticate, trackSession, requireManager, inventoryController.updateInventoryItem.bind(inventoryController));

/**
 * @route DELETE /api/inventory/:id
 * @desc Delete inventory item
 * @access Private (Manager only)
 */
router.delete('/:id', authenticate, trackSession, requireManager, inventoryController.deleteInventoryItem.bind(inventoryController));

export default router;