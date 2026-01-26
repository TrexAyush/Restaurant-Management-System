import { Request, Response } from 'express';
import { tableService } from '../services/tableService';
import {
  CreateTableRequest,
  UpdateTableRequest,
  UpdateTableStatusRequest
} from '../models/Table';
import { TableStatus } from '../models/enums';
import { PaginationParams, ApiResponse } from '../models';
import { TableSearchFilters } from '../repositories/tableRepository';

export class TableController {

  /**
   * Get all tables with optional filters and pagination
   */
  async getTables(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string || 'number',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
      };

      const filters: TableSearchFilters = {};
      
      if (req.query.status) {
        filters.status = req.query.status as TableStatus;
      }
      
      if (req.query.capacityMin) {
        filters.capacityMin = parseInt(req.query.capacityMin as string);
      }
      
      if (req.query.capacityMax) {
        filters.capacityMax = parseInt(req.query.capacityMax as string);
      }
      
      if (req.query.number) {
        filters.number = parseInt(req.query.number as string);
      }
      
      if (req.query.hasCurrentOrder !== undefined) {
        filters.hasCurrentOrder = req.query.hasCurrentOrder === 'true';
      }

      const result = await tableService.getTables(filters, pagination);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tables'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get table by ID
   */
  async getTableById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const table = await tableService.getTableById(id);

      if (!table) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get table by number
   */
  async getTableByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { number } = req.params;
      
      if (!number) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table number is required'
        };
        res.status(400).json(response);
        return;
      }

      const tableNumber = parseInt(number);
      
      if (isNaN(tableNumber)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid table number'
        };
        res.status(400).json(response);
        return;
      }

      const table = await tableService.getTableByNumber(tableNumber);

      if (!table) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new table
   */
  async createTable(req: Request, res: Response): Promise<void> {
    try {
      const tableData: CreateTableRequest = req.body;
      const createdBy = req.user?.username;
      
      const table = await tableService.createTable(tableData, createdBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create table'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Update table
   */
  async updateTable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateTableRequest = req.body;
      const updatedBy = req.user?.username;
      
      const table = await tableService.updateTable(id, updateData, updatedBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update table'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Update table status
   */
  async updateTableStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const statusData: UpdateTableStatusRequest = req.body;
      const updatedBy = req.user?.username;
      
      const table = await tableService.updateTableStatus(id, statusData, updatedBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update table status'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Delete table
   */
  async deleteTable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const deletedBy = req.user?.username;
      await tableService.deleteTable(id, deletedBy);

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete table'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get tables by status
   */
  async getTablesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      // Validate status
      if (!Object.values(TableStatus).includes(status as TableStatus)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid table status'
        };
        res.status(400).json(response);
        return;
      }

      const tables = await tableService.getTablesByStatus(status as TableStatus);

      const response: ApiResponse<typeof tables> = {
        success: true,
        data: tables
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tables by status'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get available tables with minimum capacity
   */
  async getAvailableTablesWithCapacity(req: Request, res: Response): Promise<void> {
    try {
      const { capacity } = req.params;
      
      if (!capacity) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Capacity parameter is required'
        };
        res.status(400).json(response);
        return;
      }

      const minCapacity = parseInt(capacity);
      
      if (isNaN(minCapacity) || minCapacity <= 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid capacity parameter'
        };
        res.status(400).json(response);
        return;
      }

      const tables = await tableService.getAvailableTablesWithCapacity(minCapacity);

      const response: ApiResponse<typeof tables> = {
        success: true,
        data: tables
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get available tables'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Seat customers at a table
   */
  async seatCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const { partySize, orderId } = req.body;
      
      if (!partySize || isNaN(parseInt(partySize))) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Party size is required and must be a number'
        };
        res.status(400).json(response);
        return;
      }

      const seatedBy = req.user?.username;
      const table = await tableService.seatCustomers(id, parseInt(partySize), orderId, seatedBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seat customers'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Clear table (make it available)
   */
  async clearTable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const clearedBy = req.user?.username;
      const table = await tableService.clearTable(id, clearedBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear table'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Reserve table
   */
  async reserveTable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const reservedBy = req.user?.username;
      const table = await tableService.reserveTable(id, reservedBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reserve table'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Take table out of service
   */
  async takeTableOutOfService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const takenOutBy = req.user?.username;
      const table = await tableService.takeTableOutOfService(id, takenOutBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to take table out of service'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Put table back in service
   */
  async putTableBackInService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Table ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const putBackBy = req.user?.username;
      const table = await tableService.putTableBackInService(id, putBackBy);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to put table back in service'
      };
      
      const statusCode = error instanceof Error && error.message === 'Table not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Find best available table for party size
   */
  async findBestTableForParty(req: Request, res: Response): Promise<void> {
    try {
      const { partySize } = req.params;
      
      if (!partySize) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Party size parameter is required'
        };
        res.status(400).json(response);
        return;
      }

      const partySizeNum = parseInt(partySize);
      
      if (isNaN(partySizeNum) || partySizeNum <= 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid party size parameter'
        };
        res.status(400).json(response);
        return;
      }

      const table = await tableService.findBestTableForParty(partySizeNum);

      const response: ApiResponse<typeof table> = {
        success: true,
        data: table
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find best table'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get table statistics
   */
  async getTableStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await tableService.getTableStatistics();

      const response: ApiResponse<typeof statistics> = {
        success: true,
        data: statistics
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table statistics'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get table occupancy summary
   */
  async getTableOccupancySummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await tableService.getTableOccupancySummary();

      const response: ApiResponse<typeof summary> = {
        success: true,
        data: summary
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table occupancy summary'
      };
      res.status(500).json(response);
    }
  }
}

// Export singleton instance
export const tableController = new TableController();