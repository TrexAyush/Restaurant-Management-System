import request from 'supertest';
import app from '../server';
import { UserRole, OrderStatus, TableStatus, PaymentStatus } from '../models/enums';

describe('Complete User Workflow Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let waiterToken: string;
  let kitchenToken: string;
  let cashierToken: string;

  // Test entities
  let categoryId: string;
  let menuItemId: string;
  let inventoryItemId: string;
  let tableId: string;
  let orderId: string;
  let billId: string;

  beforeAll(async () => {
    // Setup test users and get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_test', password: 'password123' });
    adminToken = adminLogin.body.token;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'manager_test', password: 'password123' });
    managerToken = managerLogin.body.token;

    const waiterLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'waiter_test', password: 'password123' });
    waiterToken = waiterLogin.body.token;

    const kitchenLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kitchen_test', password: 'password123' });
    kitchenToken = kitchenLogin.body.token;

    const cashierLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cashier_test', password: 'password123' });
    cashierToken = cashierLogin.body.token;
  });

  describe('Restaurant Setup Workflow (Manager)', () => {
    test('Manager sets up restaurant infrastructure', async () => {
      // Step 1: Create menu category
      const categoryResponse = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Main Courses',
          description: 'Primary dishes for lunch and dinner'
        })
        .expect(201);

      categoryId = categoryResponse.body.id;
      expect(categoryResponse.body.name).toBe('Main Courses');

      // Step 2: Create inventory items
      const inventoryResponse = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Chicken Breast',
          currentStock: 50,
          unit: 'pieces',
          lowStockThreshold: 5,
          costPerUnit: 8.50
        })
        .expect(201);

      inventoryItemId = inventoryResponse.body.id;
      expect(inventoryResponse.body.currentStock).toBe(50);

      // Step 3: Create menu item with inventory linkage
      const menuItemResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Grilled Chicken',
          description: 'Perfectly grilled chicken breast with herbs',
          price: 18.99,
          categoryId: categoryId,
          ingredients: [{
            ingredientId: inventoryItemId,
            quantity: 1,
            unit: 'pieces'
          }]
        })
        .expect(201);

      menuItemId = menuItemResponse.body.id;
      expect(menuItemResponse.body.price).toBe(18.99);

      // Step 4: Set up tables
      const tableResponse = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          number: 15,
          capacity: 4
        })
        .expect(201);

      tableId = tableResponse.body.id;
      expect(tableResponse.body.status).toBe(TableStatus.AVAILABLE);

      // Verify setup is complete
      const menuCheck = await request(app)
        .get('/api/menu/items/by-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(menuCheck.body).toHaveProperty('Main Courses');
      expect(menuCheck.body['Main Courses']).toHaveLength(1);
    });
  });

  describe('Customer Service Workflow (Waiter)', () => {
    test('Waiter handles complete customer service cycle', async () => {
      // Step 1: Check table availability
      const tablesResponse = await request(app)
        .get('/api/tables')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      const availableTable = tablesResponse.body.find((t: any) => t.id === tableId);
      expect(availableTable.status).toBe(TableStatus.AVAILABLE);

      // Step 2: View menu for customer
      const menuResponse = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      const availableItems = menuResponse.body.filter((item: any) => item.isAvailable);
      expect(availableItems.length).toBeGreaterThan(0);

      // Step 3: Create order for table
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: tableId,
          items: [{
            menuItemId: menuItemId,
            quantity: 2,
            specialInstructions: 'Medium rare, no salt'
          }]
        })
        .expect(201);

      orderId = orderResponse.body.id;
      expect(orderResponse.body.status).toBe(OrderStatus.PLACED);
      expect(orderResponse.body.items).toHaveLength(1);
      expect(orderResponse.body.totalAmount).toBe(37.98); // 2 * 18.99

      // Step 4: Verify table status updated
      const updatedTableResponse = await request(app)
        .get(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(updatedTableResponse.body.status).toBe(TableStatus.OCCUPIED);

      // Step 5: Check order appears in waiter's order list
      const waiterOrdersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      const waiterOrder = waiterOrdersResponse.body.find((o: any) => o.id === orderId);
      expect(waiterOrder).toBeDefined();
      expect(waiterOrder.status).toBe(OrderStatus.PLACED);
    });

    test('Waiter can modify order before kitchen preparation', async () => {
      // Add another item to the order
      const updateResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          items: [
            {
              menuItemId: menuItemId,
              quantity: 3, // Changed from 2 to 3
              specialInstructions: 'Medium rare, no salt'
            }
          ]
        })
        .expect(200);

      expect(updateResponse.body.totalAmount).toBe(56.97); // 3 * 18.99
      expect(updateResponse.body.items[0].quantity).toBe(3);
    });
  });

  describe('Kitchen Workflow (Kitchen Staff)', () => {
    test('Kitchen staff processes order through preparation stages', async () => {
      // Step 1: View kitchen orders
      const kitchenOrdersResponse = await request(app)
        .get('/api/orders/kitchen')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      const kitchenOrder = kitchenOrdersResponse.body.find((o: any) => o.id === orderId);
      expect(kitchenOrder).toBeDefined();
      expect(kitchenOrder.status).toBe(OrderStatus.PLACED);

      // Step 2: Start preparing order
      await request(app)
        .put(`/api/orders/${orderId}/start-preparing`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Verify status changed and inventory deducted
      const preparingOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(preparingOrderResponse.body.status).toBe(OrderStatus.PREPARING);

      // Check inventory was deducted
      const inventoryResponse = await request(app)
        .get(`/api/inventory/items/${inventoryItemId}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(inventoryResponse.body.currentStock).toBe(47); // 50 - 3 pieces

      // Step 3: Mark order as ready
      await request(app)
        .put(`/api/orders/${orderId}/mark-ready`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Verify status changed
      const readyOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(readyOrderResponse.body.status).toBe(OrderStatus.READY);

      // Step 4: Check ready orders list
      const readyOrdersResponse = await request(app)
        .get('/api/orders/ready')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      const readyOrder = readyOrdersResponse.body.find((o: any) => o.id === orderId);
      expect(readyOrder).toBeDefined();
    });
  });

  describe('Service Completion Workflow (Waiter)', () => {
    test('Waiter serves order to complete service cycle', async () => {
      // Step 1: Check ready orders
      const readyOrdersResponse = await request(app)
        .get('/api/orders/ready')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      const readyOrder = readyOrdersResponse.body.find((o: any) => o.id === orderId);
      expect(readyOrder).toBeDefined();
      expect(readyOrder.status).toBe(OrderStatus.READY);

      // Step 2: Mark order as served
      await request(app)
        .put(`/api/orders/${orderId}/mark-served`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      // Verify status changed
      const servedOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(servedOrderResponse.body.status).toBe(OrderStatus.SERVED);
    });
  });

  describe('Payment Processing Workflow (Cashier)', () => {
    test('Cashier processes complete payment cycle', async () => {
      // Step 1: Generate bill for completed order
      const billResponse = await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          orderId: orderId,
          taxRate: 0.08
        })
        .expect(201);

      billId = billResponse.body.id;
      expect(billResponse.body.subtotal).toBe(56.97);
      expect(billResponse.body.taxAmount).toBe(4.56); // 56.97 * 0.08
      expect(billResponse.body.totalAmount).toBe(61.53);
      expect(billResponse.body.paymentStatus).toBe(PaymentStatus.PENDING);

      // Step 2: Generate PDF invoice
      const pdfResponse = await request(app)
        .get(`/api/bills/${billId}/pdf`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');

      // Step 3: Process payment
      const paymentResponse = await request(app)
        .put(`/api/bills/${billId}/payment`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          paymentMethod: 'card'
        })
        .expect(200);

      expect(paymentResponse.body.paymentStatus).toBe(PaymentStatus.PAID);
      expect(paymentResponse.body.paymentMethod).toBe('card');

      // Step 4: Verify table is now available
      const finalTableResponse = await request(app)
        .get(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(finalTableResponse.body.status).toBe(TableStatus.AVAILABLE);
    });
  });

  describe('Reporting and Analytics Workflow (Manager)', () => {
    test('Manager generates comprehensive reports', async () => {
      // Step 1: Generate daily sales report
      const today = new Date().toISOString().split('T')[0];
      const dailyReportResponse = await request(app)
        .get('/api/reports/daily')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ date: today })
        .expect(200);

      expect(dailyReportResponse.body.totalRevenue).toBeGreaterThan(0);
      expect(dailyReportResponse.body.orderCount).toBeGreaterThan(0);
      expect(dailyReportResponse.body.popularItems).toBeDefined();

      // Step 2: Generate inventory report
      const inventoryReportResponse = await request(app)
        .get('/api/inventory/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(inventoryReportResponse.body)).toBe(true);
      const chickenItem = inventoryReportResponse.body.find((item: any) => 
        item.id === inventoryItemId
      );
      expect(chickenItem.currentStock).toBe(47);

      // Step 3: Generate weekly analysis
      const weeklyReportResponse = await request(app)
        .get('/api/reports/weekly')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(weeklyReportResponse.body).toHaveProperty('totalRevenue');
      expect(weeklyReportResponse.body).toHaveProperty('averageDailyRevenue');

      // Step 4: Check item popularity
      const popularityResponse = await request(app)
        .get('/api/reports/item-popularity')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(popularityResponse.body)).toBe(true);
      const popularItem = popularityResponse.body.find((item: any) => 
        item.menuItemId === menuItemId
      );
      expect(popularItem).toBeDefined();
      expect(popularItem.orderCount).toBeGreaterThan(0);
    });
  });

  describe('System Monitoring Workflow (Admin)', () => {
    test('Admin monitors system health and performance', async () => {
      // Step 1: Check system health
      const healthResponse = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
      expect(healthResponse.body.components).toBeDefined();

      // Step 2: Check performance metrics
      const performanceResponse = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(performanceResponse.body.metrics).toBeDefined();
      expect(performanceResponse.body.metrics.requestCount).toBeGreaterThan(0);

      // Step 3: Check system logs
      const logsResponse = await request(app)
        .get('/api/monitoring/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ level: 'info', limit: 10 })
        .expect(200);

      expect(Array.isArray(logsResponse.body)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('System handles invalid operations gracefully', async () => {
      // Try to modify order after it's been served
      await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          items: [{ menuItemId: menuItemId, quantity: 5 }]
        })
        .expect(400); // Should fail

      // Try to process payment for already paid bill
      await request(app)
        .put(`/api/bills/${billId}/payment`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ paymentMethod: 'cash' })
        .expect(400); // Should fail

      // Try to delete menu item that's been ordered
      await request(app)
        .delete(`/api/menu/items/${menuItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400); // Should fail due to historical data
    });

    test('System enforces role-based access control', async () => {
      // Waiter tries to access admin functions
      await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(403);

      // Kitchen staff tries to access billing
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(403);

      // Cashier tries to modify menu
      await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ name: 'Test', price: 10 })
        .expect(403);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up test data...');
    
    // Note: In a real system, you might want to clean up test data
    // For integration tests, we'll leave the data to verify persistence
  });
});