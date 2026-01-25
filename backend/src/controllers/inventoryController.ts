import { Request, Response } from 'express';
import { 
  inventoryService, 
  LowStockAlert, 
  StockDeductionRequest 
} from '../services/inventoryService';
import { 
  CreateInventoryItemRequest, 
  UpdateInventoryItemRequest 
} from '../models/InventoryItem';
import { PaginationParams } from '../models';
import { InventorySearchFilters } from '../repositories/inventoryRepository';

export class InventoryController {

  /**
   * Get all inventory items
   * GET /api/inventory
   */
  async getInventoryItems(req: Request, res: Response): Promise<void> {
    try {
      const filters: InventorySearchFilters = {
        lowStockOnly: req.query.lowStockOnly === 'true',
        searchTerm: req.query.searchTerm as string,
        supplierId: req.query.supplierId as string
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const result = await inventoryService.getInventoryItems(filters, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory items'
      });
    }
  }

  /**
   * Get inventory item by ID
   * GET /api/inventory/:id
   */
  async getInventoryItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Inventory item ID is required'
        });
        return;
      }

      const item = await inventoryService.getInventoryItemById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
        return;
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory item'
      });
    }
  }

  /**
   * Create new inventory item
   * POST /api/inventory
   */
  async createInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const itemData: CreateInventoryItemRequest = req.body;
      const item = await inventoryService.createInventoryItem(itemData);

      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('Validation failed') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create inventory item'
      });
    }
  }

  /**
   * Update inventory item
   * PUT /api/inventory/:id
   */
  async updateInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Inventory item ID is required'
        });
        return;
      }

      const updateData: UpdateInventoryItemRequest = req.body;
      
      const item = await inventoryService.updateInventoryItem(id, updateData);

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('Validation failed')) {
          statusCode = 400;
        }
      }
      
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory item'
      });
    }
  }

  /**
   * Delete inventory item
   * DELETE /api/inventory/:id
   */
  async deleteInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Inventory item ID is required'
        });
        return;
      }

      await inventoryService.deleteInventoryItem(id);

      res.json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete inventory item'
      });
    }
  }

  /**
   * Add stock to inventory item
   * POST /api/inventory/:id/add-stock
   */
  async addStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Inventory item ID is required'
        });
        return;
      }

      const { quantity, reason } = req.body;
      const updatedBy = req.user?.userId || 'system';

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Quantity must be a positive number'
        });
        return;
      }

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Reason is required'
        });
        return;
      }

      const item = await inventoryService.addStock(id, quantity, reason, updatedBy);

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add stock'
      });
    }
  }

  /**
   * Get low stock alerts
   * GET /api/inventory/alerts/low-stock
   */
  async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await inventoryService.getLowStockAlerts();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch low stock alerts'
      });
    }
  }

  /**
   * Get inventory report
   * GET /api/inventory/reports/summary
   */
  async getInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await inventoryService.getInventoryReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate inventory report'
      });
    }
  }

  /**
   * Get restocking recommendations
   * GET /api/inventory/reports/restocking
   */
  async getRestockingRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = await inventoryService.getRestockingRecommendations();

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch restocking recommendations'
      });
    }
  }

  /**
   * Get inventory update history for an item
   * GET /api/inventory/:id/history
   */
  async getUpdateHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Inventory item ID is required'
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const history = await inventoryService.getUpdateHistory(id, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch update history'
      });
    }
  }

  /**
   * Search inventory items
   * GET /api/inventory/search
   */
  async searchInventoryItems(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          error: 'Search term (q) is required'
        });
        return;
      }

      const filters: Omit<InventorySearchFilters, 'searchTerm'> = {
        lowStockOnly: req.query.lowStockOnly === 'true',
        supplierId: req.query.supplierId as string
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const result = await inventoryService.searchInventoryItems(searchTerm, filters, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search inventory items'
      });
    }
  }

  /**
   * Check ingredient availability for menu items
   * POST /api/inventory/check-availability
   */
  async checkIngredientAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { ingredients } = req.body;

      if (!ingredients || !Array.isArray(ingredients)) {
        res.status(400).json({
          success: false,
          error: 'Ingredients array is required'
        });
        return;
      }

      const availability = await inventoryService.checkIngredientAvailability(ingredients);

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check ingredient availability'
      });
    }
  }

  /**
   * Get inventory statistics
   * GET /api/inventory/statistics
   */
  async getInventoryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await inventoryService.getInventoryStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory statistics'
      });
    }
  }

  /**
   * Bulk update stock levels
   * POST /api/inventory/bulk-update
   */
  async bulkUpdateStock(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;
      const updatedBy = req.user?.userId || 'system';

      if (!updates || !Array.isArray(updates)) {
        res.status(400).json({
          success: false,
          error: 'Updates array is required'
        });
        return;
      }

      const updatedItems = await inventoryService.bulkUpdateStock(updates, updatedBy);

      res.json({
        success: true,
        data: updatedItems
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update stock'
      });
    }
  }

  /**
   * Get inventory valuation report
   * GET /api/inventory/reports/valuation
   */
  async getInventoryValuation(req: Request, res: Response): Promise<void> {
    try {
      const valuation = await inventoryService.getInventoryValuation();

      res.json({
        success: true,
        data: valuation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate inventory valuation report'
      });
    }
  }

  /**
   * Get inventory turnover analysis
   * GET /api/inventory/reports/turnover
   */
  async getInventoryTurnoverAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const turnoverAnalysis = await inventoryService.getInventoryTurnoverAnalysis();

      res.json({
        success: true,
        data: turnoverAnalysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate turnover analysis'
      });
    }
  }

  /**
   * Get supplier performance report
   * GET /api/inventory/reports/suppliers
   */
  async getSupplierPerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const supplierReport = await inventoryService.getSupplierPerformanceReport();

      res.json({
        success: true,
        data: supplierReport
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate supplier performance report'
      });
    }
  }

  /**
   * Get inventory dashboard data
   * GET /api/inventory/dashboard
   */
  async getInventoryDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await inventoryService.getInventoryDashboard();

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate inventory dashboard'
      });
    }
  }
}

// Export singleton instance
export const inventoryController = new InventoryController();