import {
  Table,
  CreateTableRequest,
  UpdateTableRequest,
  UpdateTableStatusRequest,
  validateCreateTableRequest,
  validateUpdateTableRequest,
  validateUpdateTableStatusRequest,
  isValidTableStatusTransition,
  validateCapacityForOccupancy
} from '../models/Table';
import { TableStatus } from '../models/enums';
import { PaginationParams, PaginatedResponse } from '../models';
import { tableRepository, TableSearchFilters } from '../repositories/tableRepository';

export class TableService {

  /**
   * Get all tables with optional filters and pagination
   */
  async getTables(
    filters: TableSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Table>> {
    return tableRepository.findTables(filters, pagination);
  }

  /**
   * Get table by ID
   */
  async getTableById(id: string): Promise<Table | null> {
    return tableRepository.findTableById(id);
  }

  /**
   * Get table by number
   */
  async getTableByNumber(number: number): Promise<Table | null> {
    return tableRepository.findTableByNumber(number);
  }

  /**
   * Create a new table
   */
  async createTable(tableData: CreateTableRequest, createdBy?: string): Promise<Table> {
    // Validate request
    const validationErrors = validateCreateTableRequest(tableData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if table number already exists
    const numberExists = await tableRepository.tableNumberExists(tableData.number);
    if (numberExists) {
      throw new Error('Table number already exists');
    }

    const table = await tableRepository.createTable(tableData);

    return table;
  }

  /**
   * Update table
   */
  async updateTable(id: string, updateData: UpdateTableRequest, updatedBy?: string): Promise<Table> {
    // Validate request
    const validationErrors = validateUpdateTableRequest(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if table exists
    const existingTable = await tableRepository.findTableById(id);
    if (!existingTable) {
      throw new Error('Table not found');
    }

    // Store old capacity for broadcasting capacity changes
    const oldCapacity = existingTable.capacity;

    // Check if new number already exists (if number is being updated)
    if (updateData.number && updateData.number !== existingTable.number) {
      const numberExists = await tableRepository.tableNumberExists(updateData.number, id);
      if (numberExists) {
        throw new Error('Table number already exists');
      }
    }

    // Validate status transition if status is being updated
    if (updateData.status && updateData.status !== existingTable.status) {
      const hasCurrentOrder = !!existingTable.currentOrderId;
      const isValidTransition = isValidTableStatusTransition(
        existingTable.status,
        updateData.status,
        hasCurrentOrder
      );

      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${existingTable.status} to ${updateData.status}`);
      }
    }

    // Validate capacity against current occupancy if capacity is being reduced
    if (updateData.capacity && updateData.capacity < existingTable.capacity) {
      if (existingTable.status === TableStatus.OCCUPIED && existingTable.currentOrderId) {
        // In a real system, we would check the actual party size from the order
        // For now, we'll allow capacity changes but warn about potential issues
        console.warn(`Reducing capacity for occupied table ${existingTable.number}. Verify party size compatibility.`);
      }
    }

    const updatedTable = await tableRepository.updateTable(id, updateData);
    if (!updatedTable) {
      throw new Error('Failed to update table');
    }

    return updatedTable;
  }

  /**
   * Update table status
   */
  async updateTableStatus(id: string, statusData: UpdateTableStatusRequest, updatedBy?: string): Promise<Table> {
    // Validate request
    const validationErrors = validateUpdateTableStatusRequest(statusData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if table exists
    const existingTable = await tableRepository.findTableById(id);
    if (!existingTable) {
      throw new Error('Table not found');
    }

    // Validate status transition
    const hasCurrentOrder = !!existingTable.currentOrderId;
    const isValidTransition = isValidTableStatusTransition(
      existingTable.status,
      statusData.status,
      hasCurrentOrder
    );

    if (!isValidTransition) {
      throw new Error(`Invalid status transition from ${existingTable.status} to ${statusData.status}`);
    }

    // Additional validation for occupied status
    if (statusData.status === TableStatus.OCCUPIED) {
      if (!statusData.currentOrderId) {
        throw new Error('Order ID is required when setting table status to occupied');
      }
    }

    // Additional validation for available status
    if (statusData.status === TableStatus.AVAILABLE) {
      if (existingTable.currentOrderId) {
        throw new Error('Cannot set table to available while it has an active order');
      }
    }

    const updatedTable = await tableRepository.updateTableStatus(id, statusData);
    if (!updatedTable) {
      throw new Error('Failed to update table status');
    }

    return updatedTable;
  }

  /**
   * Delete table
   */
  async deleteTable(id: string, deletedBy?: string): Promise<void> {
    // Check if table exists
    const existingTable = await tableRepository.findTableById(id);
    if (!existingTable) {
      throw new Error('Table not found');
    }

    // Check if table is currently occupied or has an active order
    if (existingTable.status === TableStatus.OCCUPIED || existingTable.currentOrderId) {
      throw new Error('Cannot delete table that is currently occupied or has an active order');
    }

    await tableRepository.deleteTable(id);
  }

  /**
   * Get tables by status
   */
  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    return tableRepository.findTablesByStatus(status);
  }

  /**
   * Get available tables with minimum capacity
   */
  async getAvailableTablesWithCapacity(minCapacity: number): Promise<Table[]> {
    if (minCapacity <= 0) {
      throw new Error('Minimum capacity must be greater than 0');
    }

    return tableRepository.findAvailableTablesWithCapacity(minCapacity);
  }

  /**
   * Seat customers at a table
   */
  async seatCustomers(tableId: string, partySize: number, orderId?: string, seatedBy?: string): Promise<Table> {
    if (partySize <= 0) {
      throw new Error('Party size must be greater than 0');
    }

    // Check if table exists
    const table = await tableRepository.findTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table is available
    if (table.status !== TableStatus.AVAILABLE) {
      throw new Error(`Table is not available (current status: ${table.status})`);
    }

    // Validate capacity
    if (!validateCapacityForOccupancy(table, partySize)) {
      throw new Error(`Party size (${partySize}) exceeds table capacity (${table.capacity})`);
    }

    // Update table status to occupied
    const statusData: UpdateTableStatusRequest = {
      status: TableStatus.OCCUPIED
    };

    if (orderId) {
      statusData.currentOrderId = orderId;
    }

    const updatedTable = await this.updateTableStatus(tableId, statusData, seatedBy);

    return updatedTable;
  }

  /**
   * Clear table (make it available)
   */
  async clearTable(tableId: string, clearedBy?: string): Promise<Table> {
    // Check if table exists
    const table = await tableRepository.findTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table can be cleared
    if (table.status === TableStatus.OUT_OF_SERVICE) {
      throw new Error('Cannot clear table that is out of service');
    }

    // Update table status to available
    const statusData: UpdateTableStatusRequest = {
      status: TableStatus.AVAILABLE
    };

    return this.updateTableStatus(tableId, statusData, clearedBy);
  }

  /**
   * Reserve table
   */
  async reserveTable(tableId: string, reservedBy?: string): Promise<Table> {
    // Check if table exists
    const table = await tableRepository.findTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table can be reserved
    if (table.status !== TableStatus.AVAILABLE) {
      throw new Error(`Table cannot be reserved (current status: ${table.status})`);
    }

    // Update table status to reserved
    const statusData: UpdateTableStatusRequest = {
      status: TableStatus.RESERVED
    };

    return this.updateTableStatus(tableId, statusData, reservedBy);
  }

  /**
   * Take table out of service
   */
  async takeTableOutOfService(tableId: string, takenOutBy?: string): Promise<Table> {
    // Check if table exists
    const table = await tableRepository.findTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table has active order
    if (table.currentOrderId) {
      throw new Error('Cannot take table out of service while it has an active order');
    }

    // Update table status to out of service
    const statusData: UpdateTableStatusRequest = {
      status: TableStatus.OUT_OF_SERVICE
    };

    return this.updateTableStatus(tableId, statusData, takenOutBy);
  }

  /**
   * Put table back in service
   */
  async putTableBackInService(tableId: string, putBackBy?: string): Promise<Table> {
    // Check if table exists
    const table = await tableRepository.findTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table is out of service
    if (table.status !== TableStatus.OUT_OF_SERVICE) {
      throw new Error('Table is not out of service');
    }

    // Update table status to available
    const statusData: UpdateTableStatusRequest = {
      status: TableStatus.AVAILABLE
    };

    return this.updateTableStatus(tableId, statusData, putBackBy);
  }

  /**
   * Get table statistics
   */
  async getTableStatistics(): Promise<{
    totalTables: number;
    availableTables: number;
    occupiedTables: number;
    reservedTables: number;
    outOfServiceTables: number;
    totalCapacity: number;
    averageCapacity: number;
    occupancyRate: number;
  }> {
    return tableRepository.getTableStatistics();
  }

  /**
   * Find best available table for party size
   */
  async findBestTableForParty(partySize: number): Promise<Table | null> {
    if (partySize <= 0) {
      throw new Error('Party size must be greater than 0');
    }

    // Get available tables with sufficient capacity
    const availableTables = await tableRepository.findAvailableTablesWithCapacity(partySize);
    
    if (availableTables.length === 0) {
      return null;
    }

    // Return the table with the smallest capacity that can accommodate the party
    // This optimizes table utilization
    if (availableTables.length === 0) {
      return null;
    }
    
    const bestTable = availableTables[0];
    return bestTable || null; // Already sorted by capacity ascending
  }

  /**
   * Get table occupancy summary
   */
  async getTableOccupancySummary(): Promise<{
    available: Table[];
    occupied: Table[];
    reserved: Table[];
    outOfService: Table[];
  }> {
    const [available, occupied, reserved, outOfService] = await Promise.all([
      tableRepository.findTablesByStatus(TableStatus.AVAILABLE),
      tableRepository.findTablesByStatus(TableStatus.OCCUPIED),
      tableRepository.findTablesByStatus(TableStatus.RESERVED),
      tableRepository.findTablesByStatus(TableStatus.OUT_OF_SERVICE)
    ]);

    return {
      available,
      occupied,
      reserved,
      outOfService
    };
  }
}

// Export singleton instance
export const tableService = new TableService();