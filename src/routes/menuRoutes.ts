import { Router } from 'express';
import { menuController } from '../controllers/menuController';
import { 
  authenticate, 
  requireManager, 
  requireManagerOrWaiter,
  trackSession 
} from '../middleware/authMiddleware';

const router = Router();

// Category Management Routes

/**
 * @route GET /api/menu/categories
 * @desc Get all menu categories
 * @access Private (All authenticated users)
 */
router.get('/categories', authenticate, trackSession, menuController.getCategories.bind(menuController));

/**
 * @route GET /api/menu/categories/:id
 * @desc Get category by ID
 * @access Private (All authenticated users)
 */
router.get('/categories/:id', authenticate, trackSession, menuController.getCategoryById.bind(menuController));

/**
 * @route POST /api/menu/categories
 * @desc Create new menu category
 * @access Private (Manager only)
 */
router.post('/categories', authenticate, trackSession, requireManager, menuController.createCategory.bind(menuController));

/**
 * @route PUT /api/menu/categories/:id
 * @desc Update menu category
 * @access Private (Manager only)
 */
router.put('/categories/:id', authenticate, trackSession, requireManager, menuController.updateCategory.bind(menuController));

/**
 * @route DELETE /api/menu/categories/:id
 * @desc Delete menu category
 * @access Private (Manager only)
 */
router.delete('/categories/:id', authenticate, trackSession, requireManager, menuController.deleteCategory.bind(menuController));

// Menu Item Management Routes

/**
 * @route GET /api/menu/items
 * @desc Get menu items with optional filters and pagination
 * @access Private (All authenticated users)
 */
router.get('/items', authenticate, trackSession, menuController.getMenuItems.bind(menuController));

/**
 * @route GET /api/menu/items/search
 * @desc Search menu items
 * @access Private (All authenticated users)
 */
router.get('/items/search', authenticate, trackSession, menuController.searchMenuItems.bind(menuController));

/**
 * @route GET /api/menu/items/by-categories
 * @desc Get menu organized by categories
 * @access Private (All authenticated users)
 */
router.get('/items/by-categories', authenticate, trackSession, menuController.getMenuByCategories.bind(menuController));

/**
 * @route GET /api/menu/items/statistics
 * @desc Get menu statistics
 * @access Private (Manager only)
 */
router.get('/items/statistics', authenticate, trackSession, requireManager, menuController.getMenuStatistics.bind(menuController));

/**
 * @route GET /api/menu/items/:id
 * @desc Get menu item by ID
 * @access Private (All authenticated users)
 */
router.get('/items/:id', authenticate, trackSession, menuController.getMenuItemById.bind(menuController));

/**
 * @route GET /api/menu/categories/:categoryId/items
 * @desc Get menu items by category
 * @access Private (All authenticated users)
 */
router.get('/categories/:categoryId/items', authenticate, trackSession, menuController.getMenuItemsByCategory.bind(menuController));

/**
 * @route POST /api/menu/items
 * @desc Create new menu item
 * @access Private (Manager only)
 */
router.post('/items', authenticate, trackSession, requireManager, menuController.createMenuItem.bind(menuController));

/**
 * @route PUT /api/menu/items/:id
 * @desc Update menu item
 * @access Private (Manager only)
 */
router.put('/items/:id', authenticate, trackSession, requireManager, menuController.updateMenuItem.bind(menuController));

/**
 * @route PUT /api/menu/items/:id/availability
 * @desc Toggle menu item availability
 * @access Private (Manager or Waiter)
 */
router.put('/items/:id/availability', authenticate, trackSession, requireManagerOrWaiter, menuController.toggleMenuItemAvailability.bind(menuController));

/**
 * @route DELETE /api/menu/items/:id
 * @desc Delete menu item (soft delete)
 * @access Private (Manager only)
 */
router.delete('/items/:id', authenticate, trackSession, requireManager, menuController.deleteMenuItem.bind(menuController));

export default router;