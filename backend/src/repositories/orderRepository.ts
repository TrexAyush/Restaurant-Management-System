import { 
  Order, 
  OrderItem,
  CreateOrderRequest, 
  UpdateOrderRequest,
  UpdateOrderStatusRequest
} from '../models/Order';
import { OrderStatus } from '../models/enums';
import { PaginationParams, PaginatedResponse } from '../models';
import knex from '../config/database';

export interface OrderSearchFilters {
  tableId?: string;
  waiterId?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export class OrderRepository {
  private readonly ordersTable = 'orders';
  private readonly orderItemsTable = 'order_items';

  /**
   * Find order by ID
   */
  async findOrderById(id: string): Promise<Order | null> {
    const order = await knex(this.ordersTable)
      .where({ id })
      .first();

    if (!order) return null;

    const items = await this.getOrderItems(id);
    return this.mapDbOrderToModel(order, items);
  }

  /**
   * Find all orders with populated details (table and waiter info)
   */
  async findOrdersWithDetails(
    filters: OrderSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.ordersTable)
      .select(
        'orders.*',
        'tables.number as table_number',
        'users.first_name as waiter_first_name',
        'users.last_name as waiter_last_name'
      )
      .leftJoin('tables', 'orders.table_id', 'tables.id')
      .leftJoin('users', 'orders.waiter_id', 'users.id');

    // Apply filters
    if (filters.tableId) {
      query = query.where('orders.table_id', filters.tableId);
    }

    if (filters.waiterId) {
      query = query.where('orders.waiter_id', filters.waiterId);
    }

    if (filters.status) {
      query = query.where('orders.status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.where('orders.created_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('orders.created_at', '<=', filters.dateTo);
    }

    // Get total count
    const countQuery = knex(this.ordersTable);
    if (filters.tableId) countQuery.where('table_id', filters.tableId);
    if (filters.waiterId) countQuery.where('waiter_id', filters.waiterId);
    if (filters.status) countQuery.where('status', filters.status);
    if (filters.dateFrom) countQuery.where('created_at', '>=', filters.dateFrom);
    if (filters.dateTo) countQuery.where('created_at', '<=', filters.dateTo);
    
    const countResult = await countQuery.count('* as count');
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['created_at', 'updated_at', 'status', 'total_amount'];
    const sortField = validSortFields.includes(sortBy) ? `orders.${sortBy}` : 'orders.created_at';

    const orders = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get items for all orders with menu item details
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItemsWithDetails(order.id);
        return this.mapDbOrderToOrderWithDetails(order, items);
      })
    );

    return {
      data: ordersWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find all orders with optional filters and pagination (original method)
   */
  async findOrders(
    filters: OrderSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = knex(this.ordersTable);

    // Apply filters
    if (filters.tableId) {
      query = query.where('table_id', filters.tableId);
    }

    if (filters.waiterId) {
      query = query.where('waiter_id', filters.waiterId);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.where('created_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('created_at', '<=', filters.dateTo);
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery;
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['created_at', 'updated_at', 'status', 'total_amount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    const orders = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get items for all orders
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return this.mapDbOrderToModel(order, items);
      })
    );

    return {
      data: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find orders by table ID
   */
  async findOrdersByTableId(tableId: string): Promise<Order[]> {
    const orders = await knex(this.ordersTable)
      .where({ table_id: tableId })
      .orderBy('created_at', 'desc');

    return Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return this.mapDbOrderToModel(order, items);
      })
    );
  }

  /**
   * Find orders by waiter ID
   */
  async findOrdersByWaiterId(waiterId: string): Promise<Order[]> {
    const orders = await knex(this.ordersTable)
      .where({ waiter_id: waiterId })
      .orderBy('created_at', 'desc');

    return Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return this.mapDbOrderToModel(order, items);
      })
    );
  }

  /**
   * Find orders by status
   */
  async findOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const orders = await knex(this.ordersTable)
      .where({ status })
      .orderBy('created_at', 'asc');

    return Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return this.mapDbOrderToModel(order, items);
      })
    );
  }

  /**
   * Find orders by status with table and menu item details
   */
  async findOrdersByStatusWithDetails(status: OrderStatus): Promise<any[]> {
    const orders = await knex(this.ordersTable)
      .select(
        'orders.*',
        'tables.id as table_id',
        'tables.number as table_number'
      )
      .leftJoin('tables', 'orders.table_id', 'tables.id')
      .where('orders.status', status)
      .orderBy('orders.created_at', 'asc');

    return Promise.all(
      orders.map(async (order) => {
        const items = await this.getOrderItemsWithDetails(order.id);
        return this.mapDbOrderToOrderWithDetailsAndTable(order, items);
      })
    );
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return knex.transaction(async (trx) => {
      // Calculate total amount
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice), 
        0
      );

      // Insert order
      const [order] = await trx(this.ordersTable)
        .insert({
          table_id: orderData.tableId,
          waiter_id: orderData.waiterId,
          status: OrderStatus.PLACED,
          total_amount: totalAmount,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Insert order items
      const orderItemInserts = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        special_instructions: item.specialInstructions,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await trx(this.orderItemsTable).insert(orderItemInserts);

      const items = await this.getOrderItems(order.id, trx);
      return this.mapDbOrderToModel(order, items);
    });
  }

  /**
   * Update order
   */
  async updateOrder(id: string, updateData: UpdateOrderRequest): Promise<Order | null> {
    return knex.transaction(async (trx) => {
      // Get existing order
      const existingOrder = await trx(this.ordersTable)
        .where({ id })
        .first();

      if (!existingOrder) return null;

      let totalAmount = parseFloat(existingOrder.total_amount);

      // Update order items if provided
      if (updateData.items) {
        // Get existing items
        const existingItems = await trx(this.orderItemsTable)
          .where({ order_id: id });

        // Process item updates
        for (const itemUpdate of updateData.items) {
          if (itemUpdate.id) {
            // Update existing item
            const existingItem = existingItems.find(item => item.id === itemUpdate.id);
            if (existingItem) {
              // Remove old item cost from total
              totalAmount -= existingItem.quantity * parseFloat(existingItem.unit_price);
              
              // Update item
              await trx(this.orderItemsTable)
                .where({ id: itemUpdate.id })
                .update({
                  menu_item_id: itemUpdate.menuItemId,
                  quantity: itemUpdate.quantity,
                  unit_price: itemUpdate.unitPrice,
                  special_instructions: itemUpdate.specialInstructions,
                  updated_at: new Date()
                });

              // Add new item cost to total
              totalAmount += itemUpdate.quantity * itemUpdate.unitPrice;
            }
          } else {
            // Create new item
            await trx(this.orderItemsTable)
              .insert({
                order_id: id,
                menu_item_id: itemUpdate.menuItemId,
                quantity: itemUpdate.quantity,
                unit_price: itemUpdate.unitPrice,
                special_instructions: itemUpdate.specialInstructions,
                created_at: new Date(),
                updated_at: new Date()
              });

            // Add new item cost to total
            totalAmount += itemUpdate.quantity * itemUpdate.unitPrice;
          }
        }
      }

      // Update order with new total
      const [updatedOrder] = await trx(this.ordersTable)
        .where({ id })
        .update({
          total_amount: totalAmount,
          updated_at: new Date()
        })
        .returning('*');

      const items = await this.getOrderItems(id, trx);
      return this.mapDbOrderToModel(updatedOrder, items);
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, statusData: UpdateOrderStatusRequest): Promise<Order | null> {
    const [order] = await knex(this.ordersTable)
      .where({ id })
      .update({
        status: statusData.status,
        updated_at: new Date()
      })
      .returning('*');

    if (!order) return null;

    const items = await this.getOrderItems(id);
    return this.mapDbOrderToModel(order, items);
  }

  /**
   * Delete order item
   */
  async deleteOrderItem(orderId: string, itemId: string): Promise<Order | null> {
    return knex.transaction(async (trx) => {
      // Get the item to be deleted
      const itemToDelete = await trx(this.orderItemsTable)
        .where({ id: itemId, order_id: orderId })
        .first();

      if (!itemToDelete) return null;

      // Delete the item
      await trx(this.orderItemsTable)
        .where({ id: itemId })
        .del();

      // Recalculate total amount
      const remainingItems = await trx(this.orderItemsTable)
        .where({ order_id: orderId });

      const newTotal = remainingItems.reduce(
        (sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 
        0
      );

      // Update order total
      const [updatedOrder] = await trx(this.ordersTable)
        .where({ id: orderId })
        .update({
          total_amount: newTotal,
          updated_at: new Date()
        })
        .returning('*');

      const items = await this.getOrderItems(orderId, trx);
      return this.mapDbOrderToModel(updatedOrder, items);
    });
  }

  /**
   * Get current active order for table
   */
  async findActiveOrderByTableId(tableId: string): Promise<Order | null> {
    const order = await knex(this.ordersTable)
      .where({ table_id: tableId })
      .whereIn('status', [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY])
      .orderBy('created_at', 'desc')
      .first();

    if (!order) return null;

    const items = await this.getOrderItems(order.id);
    return this.mapDbOrderToModel(order, items);
  }

  /**
   * Get order items for an order
   */
  private async getOrderItems(orderId: string, trx?: any): Promise<OrderItem[]> {
    const query = (trx || knex)(this.orderItemsTable)
      .where({ order_id: orderId })
      .orderBy('created_at', 'asc');

    const items = await query;

    return items.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      menuItemId: item.menu_item_id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      specialInstructions: item.special_instructions,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  /**
   * Get order items with menu item details
   */
  private async getOrderItemsWithDetails(orderId: string, trx?: any): Promise<any[]> {
    const query = (trx || knex)(this.orderItemsTable)
      .select(
        'order_items.*',
        'menu_items.name as menu_item_name',
        'menu_items.description as menu_item_description',
        'menu_items.price as menu_item_price',
        'menu_items.category_id as menu_item_category_id'
      )
      .leftJoin('menu_items', 'order_items.menu_item_id', 'menu_items.id')
      .where('order_items.order_id', orderId)
      .orderBy('order_items.created_at', 'asc');

    const items = await query;

    return items.map((item: any) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      specialInstructions: item.special_instructions,
      menuItem: {
        id: item.menu_item_id,
        name: item.menu_item_name,
        description: item.menu_item_description,
        price: parseFloat(item.menu_item_price),
        categoryId: item.menu_item_category_id
      }
    }));
  }

  /**
   * Map database order object to OrderWithDetails model
   */
  private mapDbOrderToOrderWithDetails(dbOrder: any, items: any[]): any {
    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id,
      waiterId: dbOrder.waiter_id,
      status: dbOrder.status,
      items,
      totalAmount: parseFloat(dbOrder.total_amount),
      createdAt: new Date(dbOrder.created_at).toISOString(),
      updatedAt: new Date(dbOrder.updated_at).toISOString(),
      table: {
        id: dbOrder.table_id,
        number: dbOrder.table_number
      },
      waiter: {
        id: dbOrder.waiter_id,
        firstName: dbOrder.waiter_first_name,
        lastName: dbOrder.waiter_last_name
      }
    };
  }

  /**
   * Map database order object to model
   */
  private mapDbOrderToModel(dbOrder: any, items: OrderItem[]): Order {
    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id,
      waiterId: dbOrder.waiter_id,
      status: dbOrder.status as OrderStatus,
      items,
      totalAmount: parseFloat(dbOrder.total_amount),
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at)
    };
  }

  /**
   * Map database order object to order with details including table and menu items
   */
  private mapDbOrderToOrderWithDetailsAndTable(dbOrder: any, items: any[]): any {
    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id,
      waiterId: dbOrder.waiter_id,
      status: dbOrder.status,
      items,
      totalAmount: parseFloat(dbOrder.total_amount),
      createdAt: new Date(dbOrder.created_at).toISOString(),
      updatedAt: new Date(dbOrder.updated_at).toISOString(),
      table: {
        id: dbOrder.table_id,
        number: dbOrder.table_number
      }
    };
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository();