import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus } from '../../models/enums';

export async function seed(knex: Knex): Promise<void> {
  // Get required data first
  const tables = await knex('tables').select('id', 'number').where('status', 'occupied');
  const waiters = await knex('users').select('id').where('role', 'waiter');
  const menuItems = await knex('menu_items').select('id', 'name', 'price');

  if (tables.length === 0 || waiters.length === 0 || menuItems.length === 0) {
    console.log('Skipping orders seed - missing required data');
    return;
  }

  const orders: any[] = [];
  const orderItems: any[] = [];

  // Create orders for occupied tables
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const waiter = waiters[i % waiters.length]; // Cycle through waiters
    const orderId = uuidv4();
    
    // Determine order status and timing
    let status: OrderStatus;
    let createdAt: Date;
    
    if (i === 0) {
      status = OrderStatus.PLACED;
      createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    } else if (i === 1) {
      status = OrderStatus.PREPARING;
      createdAt = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    } else {
      status = OrderStatus.READY;
      createdAt = new Date(Date.now() - 25 * 60 * 1000); // 25 minutes ago
    }

    // Select random menu items for this order
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
    const selectedItems = [];
    const usedItemIds = new Set();
    
    for (let j = 0; j < numItems; j++) {
      let randomItem;
      do {
        randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      } while (usedItemIds.has(randomItem.id));
      
      usedItemIds.add(randomItem.id);
      selectedItems.push(randomItem);
    }

    // Calculate total amount
    let totalAmount = 0;
    
    // Create order items
    selectedItems.forEach((item, index) => {
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
      const unitPrice = parseFloat(item.price);
      const itemTotal = quantity * unitPrice;
      totalAmount += itemTotal;

      orderItems.push({
        id: uuidv4(),
        order_id: orderId,
        menu_item_id: item.id,
        quantity: quantity,
        unit_price: unitPrice,
        special_instructions: index === 0 && Math.random() > 0.7 ? 'No onions please' : null,
        created_at: createdAt,
        updated_at: createdAt
      });
    });

    // Create order
    orders.push({
      id: orderId,
      table_id: table.id,
      waiter_id: waiter.id,
      status: status,
      total_amount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
      created_at: createdAt,
      updated_at: createdAt
    });
  }

  // Add some completed orders from the past few days
  const completedOrdersCount = 5;
  for (let i = 0; i < completedOrdersCount; i++) {
    const randomTable = tables[Math.floor(Math.random() * tables.length)];
    const randomWaiter = waiters[Math.floor(Math.random() * waiters.length)];
    const orderId = uuidv4();
    
    // Random time in the past 3 days
    const daysAgo = Math.floor(Math.random() * 3) + 1;
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));

    // Select random menu items
    const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items
    const selectedItems = [];
    const usedItemIds = new Set();
    
    for (let j = 0; j < numItems; j++) {
      let randomItem;
      do {
        randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      } while (usedItemIds.has(randomItem.id));
      
      usedItemIds.add(randomItem.id);
      selectedItems.push(randomItem);
    }

    let totalAmount = 0;
    
    selectedItems.forEach((item, index) => {
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const unitPrice = parseFloat(item.price);
      const itemTotal = quantity * unitPrice;
      totalAmount += itemTotal;

      orderItems.push({
        id: uuidv4(),
        order_id: orderId,
        menu_item_id: item.id,
        quantity: quantity,
        unit_price: unitPrice,
        special_instructions: Math.random() > 0.8 ? 'Extra sauce' : null,
        created_at: createdAt,
        updated_at: createdAt
      });
    });

    orders.push({
      id: orderId,
      table_id: randomTable.id,
      waiter_id: randomWaiter.id,
      status: OrderStatus.SERVED,
      total_amount: Math.round(totalAmount * 100) / 100,
      created_at: createdAt,
      updated_at: createdAt
    });
  }

  // Insert orders and order items
  if (orders.length > 0) {
    await knex('orders').insert(orders);
    await knex('order_items').insert(orderItems);

    // Update tables with current order IDs for active orders
    for (const order of orders) {
      if ([OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status as OrderStatus)) {
        await knex('tables')
          .where('id', order.table_id)
          .update({ current_order_id: order.id });
      }
    }
  }
}