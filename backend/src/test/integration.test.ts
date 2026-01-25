import request from 'supertest';
import app from '../server';
import { UserRole } from '../models/enums';

describe('System Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let managerToken: string;
  let waiterToken: string;
  let kitchenToken: string;
  let cashierToken: string;

  // User IDs
  let waiterId: string;

  // Test data IDs
  let categoryId: string;
  let menuItemId: string;
  let tableId: string;
  let orderId: string;
  let billId: string;
  let inventoryItemId: string;

  beforeAll(async () => {
    // Create test users for each role
    const adminResponse = await request(app)
      .post('/api/auth/users')
      .send({
        username: 'admin_test',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        role: UserRole.ADMIN
      });

    // Login as admin to get token for creating other users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin_test',
        password: 'password123'
      });
    
    adminToken = adminLogin.body.data.token;

    // Create other role users
    await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'manager_test',
        password: 'password123',
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@test.com',
        role: UserRole.MANAGER
      });

    await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'waiter_test',
        password: 'password123',
        firstName: 'Waiter',
        lastName: 'User',
        email: 'waiter@test.com',
        role: UserRole.WAITER
      });

    await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'kitchen_test',
        password: 'password123',
        firstName: 'Kitchen',
        lastName: 'Staff',
        email: 'kitchen@test.com',
        role: UserRole.KITCHEN_STAFF
      });

    await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'cashier_test',
        password: 'password123',
        firstName: 'Cashier',
        lastName: 'User',
        email: 'cashier@test.com',
        role: UserRole.CASHIER
      });

    // Login with each role
    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'manager_test', password: 'password123' });
    managerToken = managerLogin.body.data.token;

    const waiterLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'waiter_test', password: 'password123' });
    waiterToken = waiterLogin.body.data.token;
    waiterId = waiterLogin.body.data.user.id;

    const kitchenLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kitchen_test', password: 'password123' });
    kitchenToken = kitchenLogin.body.data.token;

    const cashierLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cashier_test', password: 'password123' });
    cashierToken = cashierLogin.body.data.token;
  });

  describe('Complete User Workflow Integration', () => {
    test('Admin workflow: User management and system configuration', async () => {
      // Admin can access user management
      const usersResponse = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(usersResponse.body.data)).toBe(true);

      // Admin can access system monitoring
      const monitoringResponse = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(monitoringResponse.body.data).toHaveProperty('overall');
    });

    test('Manager workflow: Menu and inventory management', async () => {
      // Manager creates menu category
      const timestamp = Date.now();
      const categoryResponse = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Category ${timestamp}`,
          description: 'Test category for integration'
        })
        .expect(201);

      categoryId = categoryResponse.body.data.id;

      // Manager creates inventory item
      const inventoryResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Ingredient ${timestamp}`,
          currentStock: 100,
          unit: 'kg',
          lowStockThreshold: 10,
          costPerUnit: 5.50
        })
        .expect(201);

      inventoryItemId = inventoryResponse.body.data.id;

      // Manager creates menu item
      const menuItemResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Dish ${timestamp}`,
          description: 'Test dish for integration',
          price: 15.99,
          categoryId: categoryId
        })
        .expect(201);

      menuItemId = menuItemResponse.body.data.id;

      // Manager creates table
      const tableResponse = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          number: 100 + timestamp % 1000, // Use timestamp to make unique
          capacity: 4
        })
        .expect(201);

      tableId = tableResponse.body.data.id;
    });

    test('Waiter workflow: Table and order management', async () => {
      // Waiter can view tables
      const tablesResponse = await request(app)
        .get('/api/tables')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(Array.isArray(tablesResponse.body.data)).toBe(true);

      // Waiter can view menu
      const menuResponse = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(Array.isArray(menuResponse.body)).toBe(true);

      // Waiter creates order
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: tableId,
          items: [{
            menuItemId: menuItemId,
            quantity: 2,
            specialInstructions: 'No onions'
          }]
        })
        .expect(201);

      orderId = orderResponse.body.id;
      expect(orderResponse.body.status).toBe('placed');

      // Waiter can view their orders
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(Array.isArray(ordersResponse.body)).toBe(true);
    });

    test('Kitchen staff workflow: Order preparation', async () => {
      // Kitchen staff can view kitchen orders
      const kitchenOrdersResponse = await request(app)
        .get('/api/orders/kitchen')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(Array.isArray(kitchenOrdersResponse.body.data)).toBe(true);

      // Kitchen staff starts preparing order
      await request(app)
        .put(`/api/orders/${orderId}/start-preparing`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Verify order status changed
      const orderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(orderResponse.body.status).toBe('preparing');

      // Kitchen staff marks order ready
      await request(app)
        .put(`/api/orders/${orderId}/mark-ready`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Verify inventory was deducted
      const inventoryResponse = await request(app)
        .get(`/api/inventory/items/${inventoryItemId}`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(inventoryResponse.body.currentStock).toBe(99); // 100 - (2 * 0.5)
    });

    test('Waiter serves order and cashier processes payment', async () => {
      // Waiter marks order as served
      await request(app)
        .put(`/api/orders/${orderId}/mark-served`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      // Cashier generates bill
      const billResponse = await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          orderId: orderId,
          taxRate: 0.08
        })
        .expect(201);

      billId = billResponse.body.id;
      expect(billResponse.body.subtotal).toBeGreaterThan(0);
      expect(billResponse.body.totalAmount).toBeGreaterThan(billResponse.body.subtotal);

      // Cashier processes payment
      await request(app)
        .put(`/api/bills/${billId}/payment`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          paymentMethod: 'card'
        })
        .expect(200);

      // Verify bill is paid
      const paidBillResponse = await request(app)
        .get(`/api/bills/${billId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(paidBillResponse.body.paymentStatus).toBe('paid');
    });

    test('Manager generates reports', async () => {
      // Manager can generate daily sales report
      const dailyReportResponse = await request(app)
        .get('/api/reports/daily')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ date: new Date().toISOString().split('T')[0] })
        .expect(200);

      expect(dailyReportResponse.body.data).toHaveProperty('totalRevenue');
      expect(dailyReportResponse.body.data).toHaveProperty('totalOrders');

      // Manager can view inventory reports
      const inventoryReportResponse = await request(app)
        .get('/api/inventory/reports/summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(inventoryReportResponse.body.data)).toBe(true);
    });
  });

  describe('API Endpoint Verification', () => {
    test('All authentication endpoints are accessible', async () => {
      // Health check
      await request(app).get('/health').expect(200);

      // Login endpoint
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin_test', password: 'password123' })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('token');

      // Profile endpoint
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(200);

      // Logout endpoint
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(200);
    });

    test('All menu endpoints are accessible with proper authorization', async () => {
      // Public endpoints (with auth)
      await request(app)
        .get('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Manager-only endpoints
      await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Test Category 2', description: 'Another test' })
        .expect(201);

      // Unauthorized access should fail
      await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ name: 'Unauthorized', description: 'Should fail' })
        .expect(403);
    });

    test('All order endpoints are accessible with proper authorization', async () => {
      // Waiter can access order endpoints
      await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      // Kitchen staff can access kitchen endpoints
      await request(app)
        .get('/api/orders/kitchen')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Unauthorized access should fail
      await request(app)
        .get('/api/orders/kitchen')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    test('All billing endpoints are accessible with proper authorization', async () => {
      // Cashier can access billing endpoints
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      // Manager can also access billing
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Unauthorized access should fail
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(403);
    });
  });

  describe('Data Flow Verification', () => {
    test('Order creation updates table status', async () => {
      // Create new table for this test
      const testTimestamp = Date.now();
      const tableResponse = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: 200 + testTimestamp % 1000, capacity: 2 })
        .expect(201);

      const newTableId = tableResponse.body.data.id;

      // Create a menu item for this test
      const categoryResponse = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Category ${testTimestamp}`,
          description: 'Test category for order test'
        })
        .expect(201);

      const testCategoryId = categoryResponse.body.data.id;

      const menuItemResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Item ${testTimestamp}`,
          description: 'Test item for order test',
          price: 10.99,
          categoryId: testCategoryId
        })
        .expect(201);

      const testMenuItemId = menuItemResponse.body.data.id;

      // Create order for table
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: newTableId,
          waiterId: waiterId, // Use actual waiter ID
          items: [{ 
            menuItemId: testMenuItemId, 
            quantity: 1,
            unitPrice: 10.99 // Add unitPrice
          }]
        })
        .expect(201);

      // Verify table status updated
      const updatedTableResponse = await request(app)
        .get(`/api/tables/${newTableId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(updatedTableResponse.body.data.status).toBe('occupied');
    });

    test('Order preparation deducts inventory', async () => {
      // Create test data for this test
      const testTimestamp = Date.now();
      
      // Create inventory item
      const inventoryResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Ingredient ${testTimestamp}`,
          currentStock: 100,
          unit: 'kg',
          lowStockThreshold: 10,
          costPerUnit: 5.50
        })
        .expect(201);

      const testInventoryItemId = inventoryResponse.body.data.id;

      // Create category and menu item
      const categoryResponse = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Category ${testTimestamp}`,
          description: 'Test category for inventory test'
        })
        .expect(201);

      const testCategoryId = categoryResponse.body.data.id;

      const menuItemResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Item ${testTimestamp}`,
          description: 'Test item for inventory test',
          price: 15.99,
          categoryId: testCategoryId,
          ingredients: [{
            inventoryItemId: testInventoryItemId,
            quantity: 0.5,
            unit: 'kg'
          }]
        })
        .expect(201);

      const testMenuItemId = menuItemResponse.body.data.id;

      // Create table
      const tableResponse = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          number: 300 + testTimestamp % 1000,
          capacity: 4
        })
        .expect(201);

      const testTableId = tableResponse.body.data.id;

      // Get current inventory level
      const beforeInventoryResponse = await request(app)
        .get(`/api/inventory/${testInventoryItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const beforeStock = beforeInventoryResponse.body.data.currentStock;

      // Create and prepare order
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: testTableId,
          waiterId: waiterId, // Use actual waiter ID
          items: [{ 
            menuItemId: testMenuItemId, 
            quantity: 3,
            unitPrice: 15.99 // Add unitPrice
          }]
        })
        .expect(201);

      const newOrderId = orderResponse.body.data.id;

      // Start preparing order
      await request(app)
        .put(`/api/orders/${newOrderId}/start-preparing`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      // Check inventory was deducted
      const afterInventoryResponse = await request(app)
        .get(`/api/inventory/${testInventoryItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const afterStock = afterInventoryResponse.body.data.currentStock;
      expect(afterStock).toBe(beforeStock - 1.5); // 3 items * 0.5 kg each
    });

    test('Bill generation includes correct totals', async () => {
      // Create test data for this test
      const testTimestamp = Date.now();
      
      // Create category and menu item
      const categoryResponse = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Category ${testTimestamp}`,
          description: 'Test category for bill test'
        })
        .expect(201);

      const testCategoryId = categoryResponse.body.data.id;

      const menuItemResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Test Item ${testTimestamp}`,
          description: 'Test item for bill test',
          price: 15.99,
          categoryId: testCategoryId
        })
        .expect(201);

      const testMenuItemId = menuItemResponse.body.data.id;

      // Create table
      const tableResponse = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          number: 400 + testTimestamp % 1000,
          capacity: 4
        })
        .expect(201);

      const testTableId = tableResponse.body.data.id;

      // Create order with known items
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: testTableId,
          waiterId: waiterId, // Use actual waiter ID
          items: [
            { 
              menuItemId: testMenuItemId, 
              quantity: 2, 
              unitPrice: 15.99 // Add unitPrice
            }, // 2 * 15.99 = 31.98
          ]
        })
        .expect(201);

      const testOrderId = orderResponse.body.data.id;

      // Complete order workflow
      await request(app)
        .put(`/api/orders/${testOrderId}/start-preparing`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      await request(app)
        .put(`/api/orders/${testOrderId}/mark-ready`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      await request(app)
        .put(`/api/orders/${testOrderId}/mark-served`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      // Generate bill
      const billResponse = await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          orderId: testOrderId,
          taxRate: 0.10
        })
        .expect(201);

      expect(billResponse.body.subtotal).toBe(31.98);
      expect(billResponse.body.taxAmount).toBe(3.20); // 31.98 * 0.10, rounded
      expect(billResponse.body.totalAmount).toBe(35.18);
    });
  });

  describe('Role-Based Access Control Verification', () => {
    test('Each role can only access appropriate endpoints', async () => {
      // Admin can access everything
      await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Manager cannot access user management
      await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      // Waiter cannot access inventory management
      await request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(403);

      // Kitchen staff cannot access billing
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(403);

      // Cashier cannot access menu management
      await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ name: 'Test', price: 10 })
        .expect(403);
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (billId) {
      await request(app)
        .delete(`/api/bills/${billId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }

    if (orderId) {
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }

    if (tableId) {
      await request(app)
        .delete(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }

    if (menuItemId) {
      await request(app)
        .delete(`/api/menu/items/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }

    if (categoryId) {
      await request(app)
        .delete(`/api/menu/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }

    if (inventoryItemId) {
      await request(app)
        .delete(`/api/inventory/items/${inventoryItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {}); // Ignore errors
    }
  });
});