import { Request, Response } from 'express';
import { menuService } from '../services/menuService';
import { 
  CreateMenuItemRequest, 
  UpdateMenuItemRequest,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest
} from '../models/MenuItem';
import { PaginationParams } from '../models';
import { MenuItemSearchFilters } from '../repositories/menuRepository';

export class MenuController {

  // Category Management Endpoints

  /**
   * Get all menu categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly !== 'false'; // Default to true
      const categories = await menuService.getCategories(activeOnly);

      res.status(200).json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get categories';
      
      res.status(500).json({
        error: {
          code: 'CATEGORIES_FETCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const category = await menuService.getCategoryById(id);

      if (!category) {
        res.status(404).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get category';
      
      res.status(500).json({
        error: {
          code: 'CATEGORY_FETCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Create new menu category
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateMenuCategoryRequest = req.body;

      const newCategory = await menuService.createCategory(categoryData);

      res.status(201).json({
        success: true,
        data: newCategory,
        message: 'Category created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      const statusCode = errorMessage.includes('Validation failed') || 
                        errorMessage.includes('already exists') ? 400 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'CATEGORY_CREATION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Update menu category
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const updateData: UpdateMenuCategoryRequest = req.body;

      const updatedCategory = await menuService.updateCategory(id, updateData);

      res.status(200).json({
        success: true,
        data: updatedCategory,
        message: 'Category updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      const statusCode = errorMessage.includes('not found') ? 404 :
                        errorMessage.includes('already exists') ? 400 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'CATEGORY_UPDATE_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Delete menu category
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      await menuService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      const statusCode = errorMessage.includes('not found') ? 404 :
                        errorMessage.includes('contains menu items') ? 400 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'CATEGORY_DELETION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Menu Item Management Endpoints

  /**
   * Get menu items with optional filters and pagination
   */
  async getMenuItems(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const sortBy = req.query.sortBy as string || 'name';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page must be greater than 0',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be between 1 and 100',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const validSortFields = ['name', 'price', 'created_at', 'category_name'];
      if (!validSortFields.includes(sortBy)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      if (!['asc', 'desc'].includes(sortOrder)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'sortOrder must be either "asc" or "desc"',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const pagination: PaginationParams = { page, limit, sortBy, sortOrder };

      // Parse and validate filters
      const filters: MenuItemSearchFilters = {};
      
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      
      if (req.query.isAvailable !== undefined) {
        filters.isAvailable = req.query.isAvailable === 'true';
      }
      
      if (req.query.priceMin) {
        const priceMin = parseFloat(req.query.priceMin as string);
        if (isNaN(priceMin) || priceMin < 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'priceMin must be a valid non-negative number',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown'
            }
          });
          return;
        }
        filters.priceMin = priceMin;
      }
      
      if (req.query.priceMax) {
        const priceMax = parseFloat(req.query.priceMax as string);
        if (isNaN(priceMax) || priceMax < 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'priceMax must be a valid non-negative number',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown'
            }
          });
          return;
        }
        filters.priceMax = priceMax;
      }

      // Validate price range
      if (filters.priceMin !== undefined && filters.priceMax !== undefined && filters.priceMin > filters.priceMax) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'priceMin cannot be greater than priceMax',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }
      
      if (req.query.search) {
        const searchTerm = (req.query.search as string).trim();
        if (searchTerm.length === 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Search term cannot be empty',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown'
            }
          });
          return;
        }
        filters.searchTerm = searchTerm;
      }

      const result = await menuService.getMenuItems(filters, pagination);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get menu items';
      
      res.status(500).json({
        error: {
          code: 'MENU_ITEMS_FETCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get menu item by ID
   */
  async getMenuItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu item ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const includeCategory = req.query.includeCategory === 'true';

      let menuItem;
      if (includeCategory) {
        menuItem = await menuService.getMenuItemWithCategoryById(id);
      } else {
        menuItem = await menuService.getMenuItemById(id);
      }

      if (!menuItem) {
        res.status(404).json({
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: 'Menu item not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: menuItem,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get menu item';
      
      res.status(500).json({
        error: {
          code: 'MENU_ITEM_FETCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get menu items by category
   */
  async getMenuItemsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const availableOnly = req.query.availableOnly !== 'false'; // Default to true

      const menuItems = await menuService.getMenuItemsByCategory(categoryId, availableOnly);

      res.status(200).json({
        success: true,
        data: menuItems,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get menu items by category';
      const statusCode = errorMessage.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'MENU_ITEMS_BY_CATEGORY_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Create new menu item
   */
  async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const itemData: CreateMenuItemRequest = req.body;

      const newMenuItem = await menuService.createMenuItem(itemData);

      res.status(201).json({
        success: true,
        data: newMenuItem,
        message: 'Menu item created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create menu item';
      const statusCode = errorMessage.includes('Validation failed') || 
                        errorMessage.includes('not found') ||
                        errorMessage.includes('inactive category') ? 400 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'MENU_ITEM_CREATION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Update menu item
   */
  async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu item ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const updateData: UpdateMenuItemRequest = req.body;

      const updatedMenuItem = await menuService.updateMenuItem(id, updateData);

      res.status(200).json({
        success: true,
        data: updatedMenuItem,
        message: 'Menu item updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
      const statusCode = errorMessage.includes('not found') ? 404 :
                        errorMessage.includes('inactive category') ? 400 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'MENU_ITEM_UPDATE_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Toggle menu item availability
   */
  async toggleMenuItemAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu item ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const { isAvailable } = req.body;

      if (typeof isAvailable !== 'boolean') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'isAvailable must be a boolean value',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const updatedMenuItem = await menuService.toggleMenuItemAvailability(id, isAvailable);

      res.status(200).json({
        success: true,
        data: updatedMenuItem,
        message: `Menu item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle menu item availability';
      const statusCode = errorMessage.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'MENU_ITEM_TOGGLE_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Delete menu item (soft delete)
   */
  async deleteMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu item ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      await menuService.deleteMenuItem(id);

      res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
      const statusCode = errorMessage.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        error: {
          code: 'MENU_ITEM_DELETION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Search menu items
   */
  async searchMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;

      if (!searchTerm || searchTerm.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search term (q) is required and cannot be empty',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      if (searchTerm.trim().length < 2) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search term must be at least 2 characters long',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Parse and validate pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const sortBy = req.query.sortBy as string || 'name';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid pagination parameters',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const pagination: PaginationParams = { page, limit, sortBy, sortOrder };

      // Parse additional filters
      const filters: Omit<MenuItemSearchFilters, 'searchTerm'> = {};
      
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      
      if (req.query.isAvailable !== undefined) {
        filters.isAvailable = req.query.isAvailable === 'true';
      }
      
      if (req.query.priceMin) {
        const priceMin = parseFloat(req.query.priceMin as string);
        if (!isNaN(priceMin) && priceMin >= 0) {
          filters.priceMin = priceMin;
        }
      }
      
      if (req.query.priceMax) {
        const priceMax = parseFloat(req.query.priceMax as string);
        if (!isNaN(priceMax) && priceMax >= 0) {
          filters.priceMax = priceMax;
        }
      }

      const result = await menuService.searchMenuItems(searchTerm.trim(), filters, pagination);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        searchTerm: searchTerm.trim(),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search menu items';
      
      res.status(500).json({
        error: {
          code: 'MENU_SEARCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get menu organized by categories
   */
  async getMenuByCategories(req: Request, res: Response): Promise<void> {
    try {
      const availableOnly = req.query.availableOnly !== 'false'; // Default to true

      const menuByCategories = await menuService.getMenuByCategories(availableOnly);

      res.status(200).json({
        success: true,
        data: menuByCategories,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get menu by categories';
      
      res.status(500).json({
        error: {
          code: 'MENU_BY_CATEGORIES_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get menu statistics
   */
  async getMenuStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await menuService.getMenuStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get menu statistics';
      
      res.status(500).json({
        error: {
          code: 'MENU_STATISTICS_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}

// Export singleton instance
export const menuController = new MenuController();