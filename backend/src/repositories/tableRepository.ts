import { 
  Table, 
  CreateTableRequest, 
  UpdateTableRequest,
  UpdateTableStatusRequest
} from '../models/Table';
import { TableStatus } from '../models/enums';
import { PaginationParams, PaginatedResponse, TableRow } from '../models';
import knex from '../config/database';

export interface TableSearchFilters {
  status?: TableStatus;
  capacityMin?: number;
  capacityMax?: number;
  number?: number;
  hasCurrentOrder?: boolean;
}

export class TableRepository {
  private readonly tablesTable = 'tables';

  /**
   * Find table by ID
   */
  async findTableById(id: string): Promise<Table | null> {
    const table = await knex(this.tablesTable)
      .where({ id })
      .first();

    return table ? this.mapDbTableToModel(table) : null;
  }

  /**
   * Find table by number
   */
  async findTableByNumber(number: number): Promise<Table | null> {
    const table = await knex(this.tablesTable)
      .where({ number })
      .first();

    return table ? this.mapDbTableToModel(table) : null;
  }

  /**
   * Find all tables with optional filters and pagination
   */
  async findTables(
    filters: TableSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Table>> {
    const { page = 1, limit = 20, sortBy = 'number', sortOrder = 'asc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.tablesTable);

    // Apply filters
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.capacityMin !== undefined) {
      query = query.where('capacity', '>=', filters.capacityMin);
    }

    if (filters.capacityMax !== undefined) {
      query = query.where('capacity', '<=', filters.capacityMax);
    }

    if (filters.number !== undefined) {
      query = query.where('number', filters.number);
    }

    if (filters.hasCurrentOrder !== undefined) {
      if (filters.hasCurrentOrder) {
        query = query.whereNotNull('current_order_id');
      } else {
        query = query.whereNull('current_order_id');
      }
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery;
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['number', 'capacity', 'status', 'created_at', 'occupied_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'number';

    const tables = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: tables.map(this.mapDbTableToModel),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new table
   */
  async createTable(tableData: CreateTableRequest): Promise<Table> {
    const [table] = await knex(this.tablesTable)
      .insert({
        number: tableData.number,
        capacity: tableData.capacity,
        status: TableStatus.AVAILABLE,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.mapDbTableToModel(table);
  }

  /**
   * Update table
   */
  async updateTable(id: string, updateData: UpdateTableRequest): Promise<Table | null> {
    const updateFields: any = {
      updated_at: new Date()
    };

    if (updateData.number !== undefined) updateFields.number = updateData.number;
    if (updateData.capacity !== undefined) updateFields.capacity = updateData.capacity;
    if (updateData.status !== undefined) updateFields.status = updateData.status;

    const [table] = await knex(this.tablesTable)
      .where({ id })
      .update(updateFields)
      .returning('*');

    return table ? this.mapDbTableToModel(table) : null;
  }

  /**
   * Update table status
   */
  async updateTableStatus(id: string, statusData: UpdateTableStatusRequest): Promise<Table | null> {
    const updateFields: any = {
      status: statusData.status,
      updated_at: new Date()
    };

    // Handle occupancy tracking
    if (statusData.status === TableStatus.OCCUPIED) {
      updateFields.occupied_at = new Date();
      if (statusData.currentOrderId) {
        updateFields.current_order_id = statusData.currentOrderId;
      }
    } else if (statusData.status === TableStatus.AVAILABLE) {
      updateFields.occupied_at = null;
      updateFields.current_order_id = null;
    } else if (statusData.currentOrderId !== undefined) {
      updateFields.current_order_id = statusData.currentOrderId;
    }

    const [table] = await knex(this.tablesTable)
      .where({ id })
      .update(updateFields)
      .returning('*');

    return table ? this.mapDbTableToModel(table) : null;
  }

  /**
   * Delete table
   */
  async deleteTable(id: string): Promise<void> {
    await knex(this.tablesTable)
      .where({ id })
      .del();
  }

  /**
   * Check if table number exists
   */
  async tableNumberExists(number: number, excludeId?: string): Promise<boolean> {
    let query = knex(this.tablesTable)
      .where({ number });

    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }

    const table = await query.first();
    return !!table;
  }

  /**
   * Get tables by status
   */
  async findTablesByStatus(status: TableStatus): Promise<Table[]> {
    const tables = await knex(this.tablesTable)
      .where({ status })
      .orderBy('number', 'asc');

    return tables.map(this.mapDbTableToModel);
  }

  /**
   * Get available tables with minimum capacity
   */
  async findAvailableTablesWithCapacity(minCapacity: number): Promise<Table[]> {
    const tables = await knex(this.tablesTable)
      .where('status', TableStatus.AVAILABLE)
      .where('capacity', '>=', minCapacity)
      .orderBy('capacity', 'asc')
      .orderBy('number', 'asc');

    return tables.map(this.mapDbTableToModel);
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
    const stats = await knex(this.tablesTable)
      .select(
        knex.raw('COUNT(*) as total_tables'),
        knex.raw('SUM(capacity) as total_capacity'),
        knex.raw('AVG(capacity) as average_capacity'),
        knex.raw("COUNT(CASE WHEN status = 'available' THEN 1 END) as available_tables"),
        knex.raw("COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables"),
        knex.raw("COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_tables"),
        knex.raw("COUNT(CASE WHEN status = 'out_of_service' THEN 1 END) as out_of_service_tables")
      )
      .first();

    const totalTables = parseInt(stats.total_tables);
    const occupiedTables = parseInt(stats.occupied_tables);
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

    return {
      totalTables,
      availableTables: parseInt(stats.available_tables),
      occupiedTables,
      reservedTables: parseInt(stats.reserved_tables),
      outOfServiceTables: parseInt(stats.out_of_service_tables),
      totalCapacity: parseInt(stats.total_capacity || '0'),
      averageCapacity: Math.round(parseFloat(stats.average_capacity || '0') * 100) / 100,
      occupancyRate: Math.round(occupancyRate * 100) / 100
    };
  }

  /**
   * Map database table object to model
   */
  private mapDbTableToModel(dbTable: TableRow): Table {
    const table: Table = {
      id: dbTable.id,
      number: dbTable.number,
      capacity: dbTable.capacity,
      status: dbTable.status as TableStatus,
      createdAt: new Date(dbTable.created_at),
      updatedAt: new Date(dbTable.updated_at)
    };

    if (dbTable.current_order_id) {
      table.currentOrderId = dbTable.current_order_id;
    }

    if (dbTable.occupied_at) {
      table.occupiedAt = new Date(dbTable.occupied_at);
    }

    return table;
  }
}

// Export singleton instance
export const tableRepository = new TableRepository();