import request from 'supertest';
import app from '../server';
import { OrderStatus, TableStatus, PaymentMethod, PaymentStatus, UserRole } from '../models/enums';

/**
 * Complete Happy-Path Lifecycle Test
 *
 * This test exercises the full restaurant workflow from end to end,
 * assuming the database is seeded with the default seed data
 * (users: admin_test, manager_test, waiter_test, kitchen_test, cashier_test).
 *
 * Flow:
 *  1. Login all roles
 *  2. Manager: create category → inventory item → menu item (with ingredient) → table
 *  3. Waiter: view menu → create order → table becomes OCCUPIED
 *  4. Kitchen: view kitchen queue → start preparing (inventory deducted) → mark ready
 *  5. Waiter: mark served → table becomes AVAILABLE
 *  6. Cashier: generate bill → process payment
 *  7. Manager: view reports & dashboard
 *  8. Admin: user management, monitoring
 *  9. Cleanup
 */
describe('Restaurant Happy-Path Lifecycle', () => {
  // Tokens
  let adminToken: string;
  let managerToken: string;
  let waiterToken: string;
  let kitchenToken: string;
  let cashierToken: string;

  // IDs created during the test
  let waiterId: string;
  let categoryId: string;
  let inventoryItemId: string;
  let menuItemId: string;
  let tableId: string;
  let orderId: string;
  let billId: string;
  let menuItemPrice: number;

  // ------------------------------------------------------------------ helpers
  const loginAs = async (username: string) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'password123' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    return res.body.data;
  };

  // ---------------------------------------------- Phase 0: authenticate roles
  beforeAll(async () => {
    const admin = await loginAs('admin_test');
    adminToken = admin.token;

    const manager = await loginAs('manager_test');
    managerToken = manager.token;

    const waiter = await loginAs('waiter_test');
    waiterToken = waiter.token;
    waiterId = waiter.user.id;

    const kitchen = await loginAs('kitchen_test');
    kitchenToken = kitchen.token;

    const cashier = await loginAs('cashier_test');
    cashierToken = cashier.token;
  });

  // ================================================ 1  MANAGER: setup  ======
  describe('Phase 1 – Manager sets up restaurant', () => {
    const ts = Date.now();

    test('1.1 – Create menu category', async () => {
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: `Lifecycle Cat ${ts}`, description: 'E2E test category' })
        .expect(201);

      expect(res.body.success).toBe(true);
      categoryId = res.body.data.id;
      expect(categoryId).toBeTruthy();
    });

    test('1.2 – Create inventory item (ingredient)', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Lifecycle Ingredient ${ts}`,
          currentStock: 50,
          unit: 'kg',
          lowStockThreshold: 5,
          costPerUnit: 3.00
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      inventoryItemId = res.body.data.id;
      expect(inventoryItemId).toBeTruthy();
    });

    test('1.3 – Create menu item with ingredient', async () => {
      menuItemPrice = 12.50;
      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Lifecycle Dish ${ts}`,
          description: 'Delicious lifecycle dish',
          price: menuItemPrice,
          categoryId,
          ingredients: [
            { inventoryItemId, quantity: 0.5, unit: 'kg' }
          ]
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      menuItemId = res.body.data.id;
      expect(menuItemId).toBeTruthy();
      expect(res.body.data.price).toBe(menuItemPrice);
    });

    test('1.4 – Create table', async () => {
      const tableNumber = 900 + (ts % 100);
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: tableNumber, capacity: 4 })
        .expect(201);

      expect(res.body.success).toBe(true);
      tableId = res.body.data.id;
      expect(tableId).toBeTruthy();
      expect(res.body.data.status).toBe(TableStatus.AVAILABLE);
    });

    test('1.5 – Verify menu item appears in listings', async () => {
      const res = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('1.6 – Verify inventory item exists', async () => {
      const res = await request(app)
        .get(`/api/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStock).toBe(50);
    });
  });

  // ================================================ 2  WAITER: order  ========
  describe('Phase 2 – Waiter creates order', () => {
    test('2.1 – Waiter views available tables', async () => {
      const res = await request(app)
        .get('/api/tables')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('2.2 – Waiter views menu', async () => {
      const res = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('2.3 – Waiter creates order for table', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId,
          waiterId,
          items: [
            {
              menuItemId,
              quantity: 2,
              unitPrice: menuItemPrice,
              specialInstructions: 'Extra spicy'
            }
          ]
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      orderId = res.body.data.id;
      expect(orderId).toBeTruthy();
      expect(res.body.data.status).toBe(OrderStatus.PLACED);
      expect(res.body.data.totalAmount).toBe(menuItemPrice * 2);
    });

    test('2.4 – Table status is now OCCUPIED', async () => {
      const res = await request(app)
        .get(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.OCCUPIED);
    });

    test('2.5 – Cannot create duplicate order on same table', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId,
          waiterId,
          items: [{ menuItemId, quantity: 1, unitPrice: menuItemPrice }]
        })
        .expect(400);
    });

    test('2.6 – Waiter can view order list', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('2.7 – Waiter can view specific order', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(orderId);
    });
  });

  // ================================================ 3  KITCHEN: prepare  =====
  describe('Phase 3 – Kitchen prepares order', () => {
    test('3.1 – Kitchen sees order in queue', async () => {
      const res = await request(app)
        .get('/api/orders/kitchen')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const ourOrder = res.body.data.find((o: any) => o.id === orderId);
      expect(ourOrder).toBeTruthy();
    });

    test('3.2 – Kitchen starts preparing (inventory deducted)', async () => {
      // Record stock before
      const beforeRes = await request(app)
        .get(`/api/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      const stockBefore = beforeRes.body.data.currentStock;

      // Start preparing
      const res = await request(app)
        .put(`/api/orders/${orderId}/start-preparing`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.PREPARING);

      // Check stock decreased: 2 servings × 0.5 kg = 1.0 kg deducted
      const afterRes = await request(app)
        .get(`/api/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      const stockAfter = afterRes.body.data.currentStock;
      expect(stockAfter).toBe(stockBefore - 1.0);
    });

    test('3.3 – Kitchen marks order ready', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/mark-ready`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.READY);
    });

    test('3.4 – Order appears in ready list', async () => {
      const res = await request(app)
        .get('/api/orders/ready')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const ourOrder = res.body.data.find((o: any) => o.id === orderId);
      expect(ourOrder).toBeTruthy();
    });
  });

  // ================================================ 4  WAITER: serve  ========
  describe('Phase 4 – Waiter serves order', () => {
    test('4.1 – Waiter marks order as served', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/mark-served`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.SERVED);
    });

    test('4.2 – Table status returns to AVAILABLE', async () => {
      const res = await request(app)
        .get(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.AVAILABLE);
    });
  });

  // ================================================ 5  CASHIER: bill  ========
  describe('Phase 5 – Cashier generates bill & processes payment', () => {
    test('5.1 – Generate bill for served order', async () => {
      const res = await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ orderId, taxRate: 0.10 })
        .expect(201);

      expect(res.body.success).toBe(true);
      billId = res.body.data.id;
      expect(billId).toBeTruthy();

      const expectedSubtotal = menuItemPrice * 2; // 25.00
      expect(res.body.data.subtotal).toBe(expectedSubtotal);
      expect(res.body.data.paymentStatus).toBe(PaymentStatus.PENDING);
    });

    test('5.2 – Cannot generate duplicate bill', async () => {
      await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ orderId, taxRate: 0.10 })
        .expect(400);
    });

    test('5.3 – Retrieve bill by order ID', async () => {
      const res = await request(app)
        .get(`/api/bills/order/${orderId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(billId);
    });

    test('5.4 – Retrieve bill by bill ID', async () => {
      const res = await request(app)
        .get(`/api/bills/${billId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(billId);
    });

    test('5.5 – Process payment', async () => {
      const res = await request(app)
        .post(`/api/bills/${billId}/payment`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ paymentMethod: PaymentMethod.CARD })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentStatus).toBe(PaymentStatus.PAID);
      expect(res.body.data.paymentMethod).toBe(PaymentMethod.CARD);
    });

    test('5.6 – Bill is now paid', async () => {
      const res = await request(app)
        .get(`/api/bills/${billId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.data.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  // ================================================ 6  MANAGER: reports  =====
  describe('Phase 6 – Manager views reports', () => {
    test('6.1 – Daily sales report', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/reports/daily?date=${today}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('totalOrders');
    });

    test('6.2 – Dashboard summary', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('today');
    });

    test('6.3 – Order statistics', async () => {
      const res = await request(app)
        .get('/api/orders/statistics')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalOrders');
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('averageOrderValue');
    });

    test('6.4 – Menu statistics', async () => {
      const res = await request(app)
        .get('/api/menu/items/statistics')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalMenuItems');
    });

    test('6.5 – Table statistics', async () => {
      const res = await request(app)
        .get('/api/tables/statistics')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('6.6 – Inventory report', async () => {
      const res = await request(app)
        .get('/api/inventory/reports/summary')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('6.7 – Recent orders', async () => {
      const res = await request(app)
        .get('/api/reports/recent-orders?limit=5')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('6.8 – Revenue summary', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/bills/revenue/summary?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ================================================ 7  ADMIN: management  ====
  describe('Phase 7 – Admin system management', () => {
    test('7.1 – Admin lists all users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    test('7.2 – Admin creates a new user', async () => {
      const ts = Date.now();
      const res = await request(app)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `lifecycle_user_${ts}`,
          password: 'password123',
          firstName: 'Lifecycle',
          lastName: 'User',
          email: `lifecycle_${ts}@test.com`,
          role: UserRole.WAITER
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(`lifecycle_user_${ts}`);
    });

    test('7.3 – Admin views system health', async () => {
      const res = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('7.4 – Admin views system stats', async () => {
      const res = await request(app)
        .get('/api/monitoring/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('7.5 – Admin views error logs', async () => {
      const res = await request(app)
        .get('/api/monitoring/errors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ================================================ 8  RBAC  =================
  describe('Phase 8 – Role-based access control', () => {
    test('8.1 – Waiter cannot access admin user management', async () => {
      await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(403);
    });

    test('8.2 – Waiter cannot manage menu', async () => {
      await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ name: 'Unauthorized', description: 'fail' })
        .expect(403);
    });

    test('8.3 – Kitchen staff cannot access billing', async () => {
      await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(403);
    });

    test('8.4 – Cashier cannot manage inventory', async () => {
      await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    test('8.5 – Cashier cannot create menu items', async () => {
      await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ name: 'X', price: 1, categoryId })
        .expect(403);
    });

    test('8.6 – Unauthenticated access is rejected', async () => {
      await request(app).get('/api/orders').expect(401);
      await request(app).get('/api/tables').expect(401);
      await request(app).get('/api/menu/items').expect(401);
    });
  });

  // ================================================ 9  EDGE CASES  ===========
  describe('Phase 9 – Edge cases & validations', () => {
    test('9.1 – Invalid login credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin_test', password: 'wrong' })
        .expect(401);
    });

    test('9.2 – Create order with invalid table', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: '00000000-0000-0000-0000-000000000000',
          waiterId,
          items: [{ menuItemId, quantity: 1, unitPrice: menuItemPrice }]
        })
        .expect(400);
    });

    test('9.3 – Create order with invalid menu item', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId,
          waiterId,
          items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1, unitPrice: 10 }]
        })
        .expect(400);
    });

    test('9.4 – Invalid status transition (PLACED → READY)', async () => {
      // Create a fresh order to test invalid transitions
      const ts2 = Date.now();
      const tableRes = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: 800 + (ts2 % 100), capacity: 2 })
        .expect(201);

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: tableRes.body.data.id,
          waiterId,
          items: [{ menuItemId, quantity: 1, unitPrice: menuItemPrice }]
        })
        .expect(201);

      // Try to jump directly to READY (skipping PREPARING)
      await request(app)
        .put(`/api/orders/${orderRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ status: OrderStatus.READY })
        .expect(400);
    });

    test('9.5 – Health check is public', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('OK');
    });

    test('9.6 – Bill for non-served order is rejected', async () => {
      // The order from 9.4 is still PLACED — billing should fail
      const ts3 = Date.now();
      const tableRes = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: 700 + (ts3 % 100), capacity: 2 })
        .expect(201);

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({
          tableId: tableRes.body.data.id,
          waiterId,
          items: [{ menuItemId, quantity: 1, unitPrice: menuItemPrice }]
        })
        .expect(201);

      // Try to generate bill for a PLACED order
      await request(app)
        .post('/api/bills/generate')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ orderId: orderRes.body.data.id })
        .expect(400);
    });

    test('9.7 – Pagination works for orders', async () => {
      const res = await request(app)
        .get('/api/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ================================================ 10  TABLE MANAGEMENT  ====
  describe('Phase 10 – Table lifecycle management', () => {
    let tblId: string;
    const tblNumber = 9000 + (Date.now() % 1000);

    test('10.1 – Create table', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: tblNumber, capacity: 6 })
        .expect(201);

      tblId = res.body.data.id;
      expect(res.body.data.status).toBe(TableStatus.AVAILABLE);
    });

    test('10.2 – Reserve table', async () => {
      const res = await request(app)
        .put(`/api/tables/${tblId}/reserve`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.RESERVED);
    });

    test('10.3 – Seat customers at reserved table', async () => {
      const res = await request(app)
        .put(`/api/tables/${tblId}/seat`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ partySize: 4 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.OCCUPIED);
    });

    test('10.4 – Clear table', async () => {
      const res = await request(app)
        .put(`/api/tables/${tblId}/clear`)
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.AVAILABLE);
    });

    test('10.5 – Take table out of service', async () => {
      const res = await request(app)
        .put(`/api/tables/${tblId}/out-of-service`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.OUT_OF_SERVICE);
    });

    test('10.6 – Put back in service', async () => {
      const res = await request(app)
        .put(`/api/tables/${tblId}/back-in-service`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TableStatus.AVAILABLE);
    });
  });

  // ================================================ 11  MENU MANAGEMENT  =====
  describe('Phase 11 – Menu item management', () => {
    let catId2: string;
    let itemId2: string;

    test('11.1 – Create category', async () => {
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: `Cat ${Date.now()}`, description: 'test' })
        .expect(201);
      catId2 = res.body.data.id;
    });

    test('11.2 – Create menu item', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: `Item ${Date.now()}`, price: 8.99, categoryId: catId2 })
        .expect(201);
      itemId2 = res.body.data.id;
    });

    test('11.3 – Update menu item price', async () => {
      const res = await request(app)
        .put(`/api/menu/items/${itemId2}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ price: 9.99 })
        .expect(200);

      expect(res.body.data.price).toBe(9.99);
    });

    test('11.4 – Deactivate menu item', async () => {
      const res = await request(app)
        .post(`/api/menu/items/${itemId2}/deactivate`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('11.5 – Reactivate menu item', async () => {
      const res = await request(app)
        .post(`/api/menu/items/${itemId2}/activate`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('11.6 – Search menu items', async () => {
      const res = await request(app)
        .get('/api/menu/items/search?search=Item')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('11.7 – Get menu by categories', async () => {
      const res = await request(app)
        .get('/api/menu/items/by-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ================================================ 12  INVENTORY  ===========
  describe('Phase 12 – Inventory management', () => {
    test('12.1 – Add stock to inventory', async () => {
      const res = await request(app)
        .post(`/api/inventory/${inventoryItemId}/add-stock`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 20, reason: 'Restocking', updatedBy: 'manager_test' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('12.2 – View low stock alerts', async () => {
      const res = await request(app)
        .get('/api/inventory/alerts/low-stock')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('12.3 – View inventory statistics', async () => {
      const res = await request(app)
        .get('/api/inventory/statistics')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('12.4 – View update history', async () => {
      const res = await request(app)
        .get(`/api/inventory/${inventoryItemId}/history`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ================================================ 13  BILLING CONFIG  ======
  describe('Phase 13 – Billing configuration', () => {
    test('13.1 – Get billing config', async () => {
      const res = await request(app)
        .get('/api/bills/config')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('defaultTaxRate');
    });

    test('13.2 – Search bills', async () => {
      const res = await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('13.3 – Bill exists check', async () => {
      const res = await request(app)
        .get(`/api/bills/exists/${orderId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.exists).toBe(true);
    });
  });

  // ================================================ 14  AUTH PROFILE  ========
  describe('Phase 14 – User profile & auth', () => {
    test('14.1 – Get own profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${waiterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('waiter_test');
    });

    test('14.2 – Change password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Change back for other tests
      // Need to re-login with new password first
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'waiter_test', password: 'newpassword123' })
        .expect(200);

      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`)
        .send({ currentPassword: 'newpassword123', newPassword: 'password123' })
        .expect(200);
    });

    test('14.3 – Logout', async () => {
      // Login to get a fresh token to logout
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'waiter_test', password: 'password123' })
        .expect(200);

      const tempToken = loginRes.body.data.token;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
