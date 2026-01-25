import { 
  Bill, 
  CreateBillRequest, 
  UpdateBillRequest,
  ProcessPaymentRequest
} from '../models/Bill';
import { PaymentStatus, PaymentMethod } from '../models/enums';
import { PaginationParams, PaginatedResponse, BillRow } from '../models';
import knex from '../config/database';

export interface BillSearchFilters {
  orderId?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class BillRepository {
  private readonly billsTable = 'bills';

  /**
   * Find bill by ID
   */
  async findBillById(id: string): Promise<Bill | null> {
    const bill = await knex(this.billsTable)
      .where({ id })
      .first();

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Find bill by order ID
   */
  async findBillByOrderId(orderId: string): Promise<Bill | null> {
    const bill = await knex(this.billsTable)
      .where({ order_id: orderId })
      .first();

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Find all bills with optional filters and pagination
   */
  async findBills(
    filters: BillSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Bill>> {
    const { page = 1, limit = 20, sortBy = 'generated_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.billsTable);

    // Apply filters
    if (filters.orderId) {
      query = query.where('order_id', filters.orderId);
    }

    if (filters.paymentStatus) {
      query = query.where('payment_status', filters.paymentStatus);
    }

    if (filters.paymentMethod) {
      query = query.where('payment_method', filters.paymentMethod);
    }

    if (filters.dateFrom) {
      query = query.where('generated_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('generated_at', '<=', filters.dateTo);
    }

    if (filters.minAmount !== undefined) {
      query = query.where('total_amount', '>=', filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      query = query.where('total_amount', '<=', filters.maxAmount);
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery;
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['generated_at', 'paid_at', 'total_amount', 'payment_status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'generated_at';

    const bills = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: bills.map(bill => this.mapDbBillToModel(bill)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find bills by payment status
   */
  async findBillsByPaymentStatus(status: PaymentStatus): Promise<Bill[]> {
    const bills = await knex(this.billsTable)
      .where({ payment_status: status })
      .orderBy('generated_at', 'desc');

    return bills.map(bill => this.mapDbBillToModel(bill));
  }

  /**
   * Create a new bill
   */
  async createBill(billData: CreateBillRequest): Promise<Bill> {
    const taxAmount = Math.round(billData.subtotal * billData.taxRate * 100) / 100;
    const totalAmount = Math.round((billData.subtotal + taxAmount) * 100) / 100;

    const [bill] = await knex(this.billsTable)
      .insert({
        order_id: billData.orderId,
        subtotal: billData.subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: PaymentStatus.PENDING,
        generated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.mapDbBillToModel(bill);
  }

  /**
   * Update bill details
   */
  async updateBill(id: string, updateData: UpdateBillRequest): Promise<Bill | null> {
    const updateFields: any = {
      updated_at: new Date()
    };

    if (updateData.subtotal !== undefined) {
      updateFields.subtotal = updateData.subtotal;
    }

    if (updateData.taxAmount !== undefined) {
      updateFields.tax_amount = updateData.taxAmount;
    }

    if (updateData.totalAmount !== undefined) {
      updateFields.total_amount = updateData.totalAmount;
    }

    const [bill] = await knex(this.billsTable)
      .where({ id })
      .update(updateFields)
      .returning('*');

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Process payment for a bill
   */
  async processPayment(id: string, paymentData: ProcessPaymentRequest): Promise<Bill | null> {
    const [bill] = await knex(this.billsTable)
      .where({ id })
      .update({
        payment_method: paymentData.paymentMethod,
        payment_status: PaymentStatus.PAID,
        paid_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Cancel a bill
   */
  async cancelBill(id: string): Promise<Bill | null> {
    const [bill] = await knex(this.billsTable)
      .where({ id })
      .update({
        payment_status: PaymentStatus.CANCELLED,
        updated_at: new Date()
      })
      .returning('*');

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Reopen a cancelled bill
   */
  async reopenBill(id: string): Promise<Bill | null> {
    const [bill] = await knex(this.billsTable)
      .where({ id })
      .update({
        payment_status: PaymentStatus.PENDING,
        payment_method: null,
        paid_at: null,
        updated_at: new Date()
      })
      .returning('*');

    return bill ? this.mapDbBillToModel(bill) : null;
  }

  /**
   * Get bills for a date range (for reporting)
   */
  async getBillsForDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
    const bills = await knex(this.billsTable)
      .where('generated_at', '>=', startDate)
      .where('generated_at', '<=', endDate)
      .where('payment_status', PaymentStatus.PAID)
      .orderBy('generated_at', 'asc');

    return bills.map(bill => this.mapDbBillToModel(bill));
  }

  /**
   * Get revenue summary for a date range
   */
  async getRevenueSummary(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalBills: number;
    averageBillAmount: number;
    revenueByPaymentMethod: Record<PaymentMethod, number>;
  }> {
    const bills = await knex(this.billsTable)
      .where('generated_at', '>=', startDate)
      .where('generated_at', '<=', endDate)
      .where('payment_status', PaymentStatus.PAID);

    const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const totalBills = bills.length;
    const averageBillAmount = totalBills > 0 ? totalRevenue / totalBills : 0;

    const revenueByPaymentMethod: Record<PaymentMethod, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.DIGITAL]: 0
    };

    bills.forEach(bill => {
      if (bill.payment_method) {
        revenueByPaymentMethod[bill.payment_method as PaymentMethod] += parseFloat(bill.total_amount);
      }
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalBills,
      averageBillAmount: Math.round(averageBillAmount * 100) / 100,
      revenueByPaymentMethod
    };
  }

  /**
   * Check if bill exists for order
   */
  async billExistsForOrder(orderId: string): Promise<boolean> {
    const count = await knex(this.billsTable)
      .where({ order_id: orderId })
      .count('* as count')
      .first();

    return parseInt((count as any).count as string) > 0;
  }

  /**
   * Find all bills with populated order and table details
   */
  async findBillsWithDetails(
    filters: BillSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 20, sortBy = 'generated_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.billsTable)
      .select(
        'bills.*',
        'orders.id as order_id_full',
        'orders.table_id',
        'orders.total_amount as order_total',
        'tables.number as table_number',
        knex.raw('json_agg(json_build_object(\'id\', order_items.id, \'quantity\', order_items.quantity, \'unitPrice\', order_items.unit_price, \'menuItem\', json_build_object(\'name\', menu_items.name))) as order_items')
      )
      .leftJoin('orders', 'bills.order_id', 'orders.id')
      .leftJoin('tables', 'orders.table_id', 'tables.id')
      .leftJoin('order_items', 'orders.id', 'order_items.order_id')
      .leftJoin('menu_items', 'order_items.menu_item_id', 'menu_items.id')
      .groupBy('bills.id', 'orders.id', 'orders.table_id', 'orders.total_amount', 'tables.number');

    // Apply filters
    if (filters.orderId) {
      query = query.where('bills.order_id', filters.orderId);
    }

    if (filters.paymentStatus) {
      query = query.where('bills.payment_status', filters.paymentStatus);
    }

    if (filters.paymentMethod) {
      query = query.where('bills.payment_method', filters.paymentMethod);
    }

    if (filters.dateFrom) {
      query = query.where('bills.generated_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('bills.generated_at', '<=', filters.dateTo);
    }

    if (filters.minAmount !== undefined) {
      query = query.where('bills.total_amount', '>=', filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      query = query.where('bills.total_amount', '<=', filters.maxAmount);
    }

    // Get total count
    const countQuery = knex(this.billsTable)
      .leftJoin('orders', 'bills.order_id', 'orders.id')
      .leftJoin('tables', 'orders.table_id', 'tables.id');
    
    // Apply same filters to count query
    if (filters.orderId) {
      countQuery.where('bills.order_id', filters.orderId);
    }
    if (filters.paymentStatus) {
      countQuery.where('bills.payment_status', filters.paymentStatus);
    }
    if (filters.paymentMethod) {
      countQuery.where('bills.payment_method', filters.paymentMethod);
    }
    if (filters.dateFrom) {
      countQuery.where('bills.generated_at', '>=', filters.dateFrom);
    }
    if (filters.dateTo) {
      countQuery.where('bills.generated_at', '<=', filters.dateTo);
    }
    if (filters.minAmount !== undefined) {
      countQuery.where('bills.total_amount', '>=', filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
      countQuery.where('bills.total_amount', '<=', filters.maxAmount);
    }

    const countResult = await countQuery.count('bills.id as count');
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['generated_at', 'paid_at', 'total_amount', 'payment_status'];
    const sortField = validSortFields.includes(sortBy) ? `bills.${sortBy}` : 'bills.generated_at';

    const bills = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: bills.map(bill => this.mapDbBillWithDetailsToModel(bill)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Map database bill with details to model
   */
  private mapDbBillWithDetailsToModel(dbBill: any): any {
    return {
      id: dbBill.id,
      orderId: dbBill.order_id,
      subtotal: parseFloat(dbBill.subtotal),
      taxAmount: parseFloat(dbBill.tax_amount),
      totalAmount: parseFloat(dbBill.total_amount),
      paymentMethod: dbBill.payment_method as PaymentMethod | undefined,
      paymentStatus: dbBill.payment_status as PaymentStatus,
      generatedAt: dbBill.generated_at,
      paidAt: dbBill.paid_at || undefined,
      order: {
        id: dbBill.order_id_full || dbBill.order_id,
        tableId: dbBill.table_id,
        table: {
          number: dbBill.table_number || 0
        },
        items: Array.isArray(dbBill.order_items) ? dbBill.order_items.filter((item: any) => item.id) : []
      }
    };
  }

  /**
   * Map database bill object to model
   */
  private mapDbBillToModel(dbBill: BillRow): Bill {
    return {
      id: dbBill.id,
      orderId: dbBill.order_id,
      subtotal: parseFloat(dbBill.subtotal),
      taxAmount: parseFloat(dbBill.tax_amount),
      totalAmount: parseFloat(dbBill.total_amount),
      paymentMethod: dbBill.payment_method as PaymentMethod | undefined,
      paymentStatus: dbBill.payment_status as PaymentStatus,
      generatedAt: new Date(dbBill.generated_at),
      paidAt: dbBill.paid_at ? new Date(dbBill.paid_at) : undefined,
      createdAt: new Date(dbBill.created_at),
      updatedAt: new Date(dbBill.updated_at)
    };
  }
}

// Export singleton instance
export const billRepository = new BillRepository();