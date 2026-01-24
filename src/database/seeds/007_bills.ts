import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus, PaymentMethod } from '../../models/enums';

export async function seed(knex: Knex): Promise<void> {
  // Get completed orders (served status)
  const completedOrders = await knex('orders')
    .select('id', 'total_amount', 'created_at')
    .where('status', 'served');

  if (completedOrders.length === 0) {
    console.log('Skipping bills seed - no completed orders found');
    return;
  }

  const bills: any[] = [];
  const taxRate = 0.08; // 8% tax rate

  // Create bills for completed orders
  completedOrders.forEach((order, index) => {
    const subtotal = parseFloat(order.total_amount);
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    
    // Most bills are paid, some are pending
    const isPaid = Math.random() > 0.2; // 80% chance of being paid
    const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.DIGITAL];
    const paymentMethod = isPaid ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : undefined;
    
    const generatedAt = new Date(order.created_at.getTime() + 60 * 60 * 1000); // 1 hour after order
    const paidAt = isPaid ? new Date(generatedAt.getTime() + 15 * 60 * 1000) : undefined; // 15 minutes after generation

    bills.push({
      id: uuidv4(),
      order_id: order.id,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
      generated_at: generatedAt,
      paid_at: paidAt,
      created_at: generatedAt,
      updated_at: paidAt || generatedAt
    });
  });

  // Insert bills
  if (bills.length > 0) {
    await knex('bills').insert(bills);
  }
}