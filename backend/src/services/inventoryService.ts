import { 
  InventoryItem, 
  CreateInventoryItemRequest, 
  UpdateInventoryItemRequest,
  InventoryUpdateRecord,
  validateCreateInventoryItemRequest,
  validateUpdateInventoryItemRequest,
  isLowStock,
  canDeductStock
} from '../models/InventoryItem';
import { IngredientUsage } from '../models/MenuItem';
import { PaginationParams, PaginatedResponse } from '../models';
import { 
  inventoryRepository, 
  InventorySearchFilters, 
  InventoryReport 
} from '../repositories/inventoryRepository';

export interface LowStockAlert {
  item: InventoryItem;
  stockLevel: number;
  threshold: number;
  severity: 'low' | 'critical';
}

export interface StockDeductionRequest {
  inventoryItemId: string;
  quantity: number;
  reason: string;
  updatedBy: string;
}

export class InventoryService {

  /**
   * Get all inventory items with optional filters and pagination
   */
  async getInventoryItems(
    filters: InventorySearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryItem>> {
    return inventoryRepository.findAll(filters, pagination);
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    return inventoryRepository.findById(id);
  }

  /**
   * Create a new inventory item
   */
  async createInventoryItem(itemData: CreateInventoryItemRequest): Promise<InventoryItem> {
    // Validate request
    const validationErrors = validateCreateInventoryItemRequest(itemData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if item name already exists
    const nameExists = await inventoryRepository.nameExists(itemData.name);
    if (nameExists) {
      throw new Error('Inventory item name already exists');
    }

    return inventoryRepository.create(itemData);
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id: string, updateData: UpdateInventoryItemRequest): Promise<InventoryItem> {
    // Validate request
    const validationErrors = validateUpdateInventoryItemRequest(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if item exists
    const existingItem = await inventoryRepository.findById(id);
    if (!existingItem) {
      throw new Error('Inventory item not found');
    }

    // Check if new name already exists (if name is being updated)
    if (updateData.name && updateData.name !== existingItem.name) {
      const nameExists = await inventoryRepository.nameExists(updateData.name, id);
      if (nameExists) {
        throw new Error('Inventory item name already exists');
      }
    }

    const updatedItem = await inventoryRepository.update(id, updateData);
    if (!updatedItem) {
      throw new Error('Failed to update inventory item');
    }

    return updatedItem;
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(id: string): Promise<void> {
    // Check if item exists
    const existingItem = await inventoryRepository.findById(id);
    if (!existingItem) {
      throw new Error('Inventory item not found');
    }

    // TODO: Check if item is referenced in any menu items
    // This would require checking menu_item_ingredients table
    // For now, we'll allow deletion

    await inventoryRepository.delete(id);
  }

  /**
   * Deduct stock from multiple inventory items (for order preparation)
   */
  async deductStockForOrder(
    ingredients: IngredientUsage[], 
    orderId: string, 
    updatedBy: string
  ): Promise<InventoryItem[]> {
    const updatedItems: InventoryItem[] = [];
    const reason = `Order preparation - Order ID: ${orderId}`;

    // Validate all items have sufficient stock before making any deductions
    for (const ingredient of ingredients) {
      const item = await inventoryRepository.findById(ingredient.inventoryItemId);
      if (!item) {
        throw new Error(`Inventory item not found: ${ingredient.inventoryItemId}`);
      }

      if (!canDeductStock(item, ingredient.quantity)) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${item.currentStock}, Required: ${ingredient.quantity}`);
      }
    }

    // Perform all deductions
    for (const ingredient of ingredients) {
      const updatedItem = await inventoryRepository.deductStock(
        ingredient.inventoryItemId,
        ingredient.quantity,
        reason,
        updatedBy
      );

      if (updatedItem) {
        updatedItems.push(updatedItem);
      }
    }

    return updatedItems;
  }

  /**
   * Add stock to inventory item
   */
  async addStock(
    id: string, 
    quantity: number, 
    reason: string, 
    updatedBy: string
  ): Promise<InventoryItem> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Check if item exists
    const existingItem = await inventoryRepository.findById(id);
    if (!existingItem) {
      throw new Error('Inventory item not found');
    }

    const updatedItem = await inventoryRepository.addStock(id, quantity, reason, updatedBy);
    if (!updatedItem) {
      throw new Error('Failed to add stock');
    }

    return updatedItem;
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const lowStockItems = await inventoryRepository.findLowStockItems();
    
    return lowStockItems.map(item => {
      const stockLevel = item.currentStock;
      const threshold = item.lowStockThreshold;
      const severity: 'low' | 'critical' = stockLevel <= threshold * 0.5 ? 'critical' : 'low';

      return {
        item,
        stockLevel,
        threshold,
        severity
      };
    });
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(): Promise<InventoryReport> {
    return inventoryRepository.generateReport();
  }

  /**
   * Get restocking recommendations
   */
  async getRestockingRecommendations(): Promise<Array<InventoryItem & { stockNeeded: number }>> {
    return inventoryRepository.getRestockingNeeds();
  }

  /**
   * Get inventory update history for an item
   */
  async getUpdateHistory(inventoryItemId: string, limit: number = 50): Promise<InventoryUpdateRecord[]> {
    // Verify item exists
    const item = await inventoryRepository.findById(inventoryItemId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    return inventoryRepository.getUpdateHistory(inventoryItemId, limit);
  }

  /**
   * Search inventory items
   */
  async searchInventoryItems(
    searchTerm: string,
    filters: Omit<InventorySearchFilters, 'searchTerm'> = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryItem>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    const searchFilters: InventorySearchFilters = {
      ...filters,
      searchTerm: searchTerm.trim()
    };

    return inventoryRepository.findAll(searchFilters, pagination);
  }

  /**
   * Check if ingredients are available for a menu item
   */
  async checkIngredientAvailability(ingredients: IngredientUsage[]): Promise<{
    available: boolean;
    unavailableItems: Array<{
      inventoryItemId: string;
      name: string;
      required: number;
      available: number;
    }>;
  }> {
    const unavailableItems: Array<{
      inventoryItemId: string;
      name: string;
      required: number;
      available: number;
    }> = [];

    for (const ingredient of ingredients) {
      const item = await inventoryRepository.findById(ingredient.inventoryItemId);
      if (!item) {
        unavailableItems.push({
          inventoryItemId: ingredient.inventoryItemId,
          name: 'Unknown Item',
          required: ingredient.quantity,
          available: 0
        });
        continue;
      }

      if (!canDeductStock(item, ingredient.quantity)) {
        unavailableItems.push({
          inventoryItemId: ingredient.inventoryItemId,
          name: item.name,
          required: ingredient.quantity,
          available: item.currentStock
        });
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    };
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStatistics(): Promise<{
    totalItems: number;
    lowStockItems: number;
    criticalStockItems: number;
    totalValue: number;
    averageStockLevel: number;
    recentlyUpdated: number; // Items updated in last 7 days
  }> {
    const report = await inventoryRepository.generateReport();
    const lowStockItems = await inventoryRepository.findLowStockItems();
    
    // Count critical stock items (below 50% of threshold)
    const criticalStockItems = lowStockItems.filter(item => 
      item.currentStock <= item.lowStockThreshold * 0.5
    ).length;

    // Get recently updated items (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const allItems = await inventoryRepository.findAll({}, { limit: 10000 });
    const recentlyUpdated = allItems.data.filter(item => 
      item.updatedAt > sevenDaysAgo
    ).length;

    return {
      totalItems: report.totalItems,
      lowStockItems: report.lowStockItems,
      criticalStockItems,
      totalValue: report.totalValue,
      averageStockLevel: report.averageStockLevel,
      recentlyUpdated
    };
  }

  /**
   * Get inventory valuation report
   */
  async getInventoryValuation(): Promise<{
    totalValue: number;
    itemCount: number;
    averageItemValue: number;
    topValueItems: Array<InventoryItem & { totalValue: number }>;
    lowValueItems: Array<InventoryItem & { totalValue: number }>;
  }> {
    const allItems = await inventoryRepository.findAll({}, { limit: 10000 });
    
    const itemsWithValue = allItems.data.map(item => ({
      ...item,
      totalValue: item.currentStock * item.costPerUnit
    }));

    const totalValue = itemsWithValue.reduce((sum, item) => sum + item.totalValue, 0);
    const averageItemValue = itemsWithValue.length > 0 ? totalValue / itemsWithValue.length : 0;

    // Sort by total value
    const sortedByValue = [...itemsWithValue].sort((a, b) => b.totalValue - a.totalValue);
    const topValueItems = sortedByValue.slice(0, 10);
    const lowValueItems = sortedByValue.slice(-10).reverse();

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      itemCount: itemsWithValue.length,
      averageItemValue: Math.round(averageItemValue * 100) / 100,
      topValueItems,
      lowValueItems
    };
  }

  /**
   * Get inventory turnover analysis
   */
  async getInventoryTurnoverAnalysis(): Promise<{
    fastMovingItems: Array<InventoryItem & { turnoverRate: number }>;
    slowMovingItems: Array<InventoryItem & { turnoverRate: number }>;
    averageTurnoverRate: number;
  }> {
    const allItems = await inventoryRepository.findAll({}, { limit: 10000 });
    
    // Calculate turnover rate based on recent update history
    const itemsWithTurnover = await Promise.all(
      allItems.data.map(async (item) => {
        const history = await inventoryRepository.getUpdateHistory(item.id, 100);
        
        // Calculate turnover based on deductions in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentDeductions = history.filter(record => 
          record.createdAt > thirtyDaysAgo && record.changeAmount < 0
        );
        
        const totalDeducted = recentDeductions.reduce((sum, record) => 
          sum + Math.abs(record.changeAmount), 0
        );
        
        // Turnover rate = total deducted / average stock level
        const turnoverRate = item.currentStock > 0 ? totalDeducted / item.currentStock : 0;
        
        return {
          ...item,
          turnoverRate: Math.round(turnoverRate * 100) / 100
        };
      })
    );

    const sortedByTurnover = [...itemsWithTurnover].sort((a, b) => b.turnoverRate - a.turnoverRate);
    const fastMovingItems = sortedByTurnover.slice(0, 10);
    const slowMovingItems = sortedByTurnover.slice(-10).reverse();
    
    const averageTurnoverRate = itemsWithTurnover.length > 0 
      ? itemsWithTurnover.reduce((sum, item) => sum + item.turnoverRate, 0) / itemsWithTurnover.length
      : 0;

    return {
      fastMovingItems,
      slowMovingItems,
      averageTurnoverRate: Math.round(averageTurnoverRate * 100) / 100
    };
  }

  /**
   * Get supplier performance report
   */
  async getSupplierPerformanceReport(): Promise<Array<{
    supplierId: string | null;
    supplierName: string;
    itemCount: number;
    totalValue: number;
    averageStockLevel: number;
    lowStockItemCount: number;
  }>> {
    const allItems = await inventoryRepository.findAll({}, { limit: 10000 });
    
    // Group items by supplier
    const supplierGroups = new Map<string | null, InventoryItem[]>();
    
    allItems.data.forEach(item => {
      const supplierId = item.supplierId || null;
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, []);
      }
      supplierGroups.get(supplierId)!.push(item);
    });

    const supplierReports = Array.from(supplierGroups.entries()).map(([supplierId, items]) => {
      const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
      const averageStockLevel = items.reduce((sum, item) => sum + item.currentStock, 0) / items.length;
      const lowStockItemCount = items.filter(item => isLowStock(item)).length;

      return {
        supplierId,
        supplierName: supplierId || 'Unknown Supplier',
        itemCount: items.length,
        totalValue: Math.round(totalValue * 100) / 100,
        averageStockLevel: Math.round(averageStockLevel * 100) / 100,
        lowStockItemCount
      };
    });

    return supplierReports.sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * Generate comprehensive inventory dashboard data
   */
  async getInventoryDashboard(): Promise<{
    summary: {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      criticalStockItems: number;
      recentlyUpdated: number;
    };
    alerts: LowStockAlert[];
    topValueItems: Array<InventoryItem & { totalValue: number }>;
    recentActivity: InventoryUpdateRecord[];
    supplierBreakdown: Array<{
      supplierId: string | null;
      itemCount: number;
      totalValue: number;
    }>;
  }> {
    const [
      statistics,
      alerts,
      valuation,
      allItems
    ] = await Promise.all([
      this.getInventoryStatistics(),
      this.getLowStockAlerts(),
      this.getInventoryValuation(),
      inventoryRepository.findAll({}, { limit: 10000 })
    ]);

    // Get recent activity across all items
    const recentActivity: InventoryUpdateRecord[] = [];
    const recentItems = allItems.data.slice(0, 20); // Sample recent items for activity
    
    for (const item of recentItems) {
      const history = await inventoryRepository.getUpdateHistory(item.id, 5);
      recentActivity.push(...history);
    }
    
    // Sort by most recent and limit
    recentActivity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const limitedRecentActivity = recentActivity.slice(0, 20);

    // Supplier breakdown
    const supplierMap = new Map<string | null, { itemCount: number; totalValue: number }>();
    
    allItems.data.forEach(item => {
      const supplierId = item.supplierId || null;
      const value = item.currentStock * item.costPerUnit;
      
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, { itemCount: 0, totalValue: 0 });
      }
      
      const supplier = supplierMap.get(supplierId)!;
      supplier.itemCount++;
      supplier.totalValue += value;
    });

    const supplierBreakdown = Array.from(supplierMap.entries()).map(([supplierId, data]) => ({
      supplierId,
      itemCount: data.itemCount,
      totalValue: Math.round(data.totalValue * 100) / 100
    }));

    return {
      summary: {
        totalItems: statistics.totalItems,
        totalValue: statistics.totalValue,
        lowStockItems: statistics.lowStockItems,
        criticalStockItems: statistics.criticalStockItems,
        recentlyUpdated: statistics.recentlyUpdated
      },
      alerts: alerts.slice(0, 10), // Top 10 alerts
      topValueItems: valuation.topValueItems.slice(0, 5), // Top 5 value items
      recentActivity: limitedRecentActivity,
      supplierBreakdown: supplierBreakdown.sort((a, b) => b.totalValue - a.totalValue)
    };
  }

  /**
   * Bulk update stock levels
   */
  async bulkUpdateStock(
    updates: Array<{
      inventoryItemId: string;
      newStock: number;
      reason: string;
    }>,
    updatedBy: string
  ): Promise<InventoryItem[]> {
    const updatedItems: InventoryItem[] = [];

    // Validate all items exist before making any updates
    for (const update of updates) {
      const item = await inventoryRepository.findById(update.inventoryItemId);
      if (!item) {
        throw new Error(`Inventory item not found: ${update.inventoryItemId}`);
      }

      if (update.newStock < 0) {
        throw new Error(`Stock level cannot be negative for item: ${item.name}`);
      }
    }

    // Perform all updates
    for (const update of updates) {
      const currentItem = await inventoryRepository.findById(update.inventoryItemId);
      if (!currentItem) continue;

      const difference = update.newStock - currentItem.currentStock;
      
      let updatedItem: InventoryItem | null;
      if (difference > 0) {
        updatedItem = await inventoryRepository.addStock(
          update.inventoryItemId,
          difference,
          update.reason,
          updatedBy
        );
      } else if (difference < 0) {
        updatedItem = await inventoryRepository.deductStock(
          update.inventoryItemId,
          Math.abs(difference),
          update.reason,
          updatedBy
        );
      } else {
        // No change needed
        updatedItem = currentItem;
      }

      if (updatedItem) {
        updatedItems.push(updatedItem);
      }
    }

    return updatedItems;
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();