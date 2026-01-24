import { 
  InventoryItem, 
  CreateInventoryItemRequest, 
  UpdateInventoryItemRequest,
  InventoryUpdateRecord,
  CreateInventoryUpdateRequest
} from '../models/InventoryItem';
import { PaginationParams, PaginatedResponse } from '../models';
import knex from '../config/database';

export interface InventorySearchFilters {
  lowStockOnly?: boolean;
  searchTerm?: string;
  supplierId?: string;
}

export interface InventoryReport {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  averageStockLevel: number;
  itemsBySupplier: Array<{
    supplierId: string | null;
    itemCount: number;
    totalValue: number;
  }>;
}

export class InventoryRepository {
  private readonly inventoryTable = 'inventory_items';
  private readonly updateRecordsTable = 'inventory_update_records';

  /**
   * Find inventory item by ID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    const item = await knex(this.inventoryTable)
      .where({ id })
      .first();

    return item ? this.mapDbToModel(item) : null;
  }

  /**
   * Find all inventory items with optional filters and pagination
   */
  async findAll(
    filters: InventorySearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryItem>> {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.inventoryTable);

    // Apply filters
    if (filters.lowStockOnly) {
      query = query.whereRaw('current_stock <= low_stock_threshold');
    }

    if (filters.searchTerm) {
      query = query.where('name', 'ilike', `%${filters.searchTerm}%`);
    }

    if (filters.supplierId) {
      query = query.where('supplier_id', filters.supplierId);
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery;
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['name', 'current_stock', 'low_stock_threshold', 'cost_per_unit', 'last_restocked'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';

    const items = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: items.map(this.mapDbToModel),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find low stock items
   */
  async findLowStockItems(): Promise<InventoryItem[]> {
    const items = await knex(this.inventoryTable)
      .whereRaw('current_stock <= low_stock_threshold')
      .orderBy('current_stock', 'asc');

    return items.map(this.mapDbToModel);
  }

  /**
   * Create a new inventory item
   */
  async create(itemData: CreateInventoryItemRequest): Promise<InventoryItem> {
    const [item] = await knex(this.inventoryTable)
      .insert({
        name: itemData.name,
        current_stock: itemData.currentStock,
        unit: itemData.unit,
        low_stock_threshold: itemData.lowStockThreshold,
        cost_per_unit: itemData.costPerUnit,
        supplier_id: itemData.supplierId,
        last_restocked: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.mapDbToModel(item);
  }

  /**
   * Update inventory item
   */
  async update(id: string, updateData: UpdateInventoryItemRequest): Promise<InventoryItem | null> {
    const updateFields: any = {
      updated_at: new Date()
    };

    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.currentStock !== undefined) {
      updateFields.current_stock = updateData.currentStock;
      updateFields.last_restocked = new Date();
    }
    if (updateData.unit !== undefined) updateFields.unit = updateData.unit;
    if (updateData.lowStockThreshold !== undefined) updateFields.low_stock_threshold = updateData.lowStockThreshold;
    if (updateData.costPerUnit !== undefined) updateFields.cost_per_unit = updateData.costPerUnit;
    if (updateData.supplierId !== undefined) updateFields.supplier_id = updateData.supplierId;

    const [item] = await knex(this.inventoryTable)
      .where({ id })
      .update(updateFields)
      .returning('*');

    return item ? this.mapDbToModel(item) : null;
  }

  /**
   * Deduct stock from inventory item
   */
  async deductStock(id: string, quantity: number, reason: string, updatedBy: string): Promise<InventoryItem | null> {
    return knex.transaction(async (trx) => {
      // Get current item
      const currentItem = await trx(this.inventoryTable)
        .where({ id })
        .first();

      if (!currentItem) {
        throw new Error('Inventory item not found');
      }

      const currentStock = parseFloat(currentItem.current_stock);
      const newStock = currentStock - quantity;

      if (newStock < 0) {
        throw new Error('Insufficient stock available');
      }

      // Update stock
      const [updatedItem] = await trx(this.inventoryTable)
        .where({ id })
        .update({
          current_stock: newStock,
          updated_at: new Date()
        })
        .returning('*');

      // Record the update
      await trx(this.updateRecordsTable)
        .insert({
          inventory_item_id: id,
          previous_stock: currentStock,
          new_stock: newStock,
          change_amount: -quantity,
          change_reason: reason,
          updated_by: updatedBy,
          created_at: new Date()
        });

      return this.mapDbToModel(updatedItem);
    });
  }

  /**
   * Add stock to inventory item
   */
  async addStock(id: string, quantity: number, reason: string, updatedBy: string): Promise<InventoryItem | null> {
    return knex.transaction(async (trx) => {
      // Get current item
      const currentItem = await trx(this.inventoryTable)
        .where({ id })
        .first();

      if (!currentItem) {
        throw new Error('Inventory item not found');
      }

      const currentStock = parseFloat(currentItem.current_stock);
      const newStock = currentStock + quantity;

      // Update stock
      const [updatedItem] = await trx(this.inventoryTable)
        .where({ id })
        .update({
          current_stock: newStock,
          last_restocked: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Record the update
      await trx(this.updateRecordsTable)
        .insert({
          inventory_item_id: id,
          previous_stock: currentStock,
          new_stock: newStock,
          change_amount: quantity,
          change_reason: reason,
          updated_by: updatedBy,
          created_at: new Date()
        });

      return this.mapDbToModel(updatedItem);
    });
  }

  /**
   * Delete inventory item
   */
  async delete(id: string): Promise<void> {
    await knex(this.inventoryTable)
      .where({ id })
      .del();
  }

  /**
   * Check if inventory item name exists
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    let query = knex(this.inventoryTable)
      .where({ name });

    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }

    const item = await query.first();
    return !!item;
  }

  /**
   * Get inventory update history for an item
   */
  async getUpdateHistory(inventoryItemId: string, limit: number = 50): Promise<InventoryUpdateRecord[]> {
    const records = await knex(this.updateRecordsTable)
      .where({ inventory_item_id: inventoryItemId })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return records.map(this.mapDbUpdateRecordToModel);
  }

  /**
   * Generate inventory report
   */
  async generateReport(): Promise<InventoryReport> {
    // Get basic statistics
    const stats = await knex(this.inventoryTable)
      .select(
        knex.raw('COUNT(*) as total_items'),
        knex.raw('COUNT(CASE WHEN current_stock <= low_stock_threshold THEN 1 END) as low_stock_items'),
        knex.raw('SUM(current_stock * cost_per_unit) as total_value'),
        knex.raw('AVG(current_stock) as average_stock_level')
      )
      .first();

    // Get items by supplier
    const supplierStats = await knex(this.inventoryTable)
      .select(
        'supplier_id',
        knex.raw('COUNT(*) as item_count'),
        knex.raw('SUM(current_stock * cost_per_unit) as total_value')
      )
      .groupBy('supplier_id')
      .orderBy('total_value', 'desc');

    return {
      totalItems: parseInt(stats.total_items),
      lowStockItems: parseInt(stats.low_stock_items),
      totalValue: parseFloat(stats.total_value) || 0,
      averageStockLevel: parseFloat(stats.average_stock_level) || 0,
      itemsBySupplier: supplierStats.map(stat => ({
        supplierId: stat.supplier_id,
        itemCount: parseInt(stat.item_count),
        totalValue: parseFloat(stat.total_value) || 0
      }))
    };
  }

  /**
   * Get items that need restocking (low stock items)
   */
  async getRestockingNeeds(): Promise<Array<InventoryItem & { stockNeeded: number }>> {
    const items = await knex(this.inventoryTable)
      .whereRaw('current_stock <= low_stock_threshold')
      .orderBy('current_stock', 'asc');

    return items.map(item => {
      const mapped = this.mapDbToModel(item);
      return {
        ...mapped,
        stockNeeded: Math.max(0, mapped.lowStockThreshold * 2 - mapped.currentStock) // Suggest restocking to 2x threshold
      };
    });
  }

  /**
   * Map database object to model
   */
  private mapDbToModel(dbItem: any): InventoryItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      currentStock: parseFloat(dbItem.current_stock),
      unit: dbItem.unit,
      lowStockThreshold: parseFloat(dbItem.low_stock_threshold),
      costPerUnit: parseFloat(dbItem.cost_per_unit),
      supplierId: dbItem.supplier_id,
      lastRestocked: new Date(dbItem.last_restocked),
      createdAt: new Date(dbItem.created_at),
      updatedAt: new Date(dbItem.updated_at)
    };
  }

  /**
   * Map database update record to model
   */
  private mapDbUpdateRecordToModel(dbRecord: any): InventoryUpdateRecord {
    return {
      id: dbRecord.id,
      inventoryItemId: dbRecord.inventory_item_id,
      previousStock: parseFloat(dbRecord.previous_stock),
      newStock: parseFloat(dbRecord.new_stock),
      changeAmount: parseFloat(dbRecord.change_amount),
      changeReason: dbRecord.change_reason,
      updatedBy: dbRecord.updated_by,
      createdAt: new Date(dbRecord.created_at)
    };
  }
}

// Export singleton instance
export const inventoryRepository = new InventoryRepository();