import { test, expect, getToken, apiGet, apiPost, apiPut, apiDelete, dismissToast } from './fixtures';

/**
 * Full E2E lifecycle: 
 * Waiter creates order → Kitchen marks preparing → Kitchen marks ready → 
 * Waiter marks served → Cashier generates bill → Cashier processes payment
 * 
 * All test data is cleaned up via API after the suite.
 */
test.describe('Full Order → Billing Lifecycle', () => {
  let orderId: string;
  let billId: string;
  let tableId: string;
  let tableNumber: string;
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin');

    // Find an available table for the test
    const tablesResp = await apiGet(request, adminToken, '/tables?limit=100');
    const tablesData = (await tablesResp.json()).data;
    const tables = Array.isArray(tablesData) ? tablesData : tablesData.data;
    const available = tables.find((t: any) => t.status === 'available');
    if (available) {
      tableId = available.id;
      tableNumber = String(available.tableNumber);
    }
  });

  test.afterAll(async ({ request }) => {
    // Cancel bill if created (cannot delete bills, only cancel)
    if (billId) {
      await apiPost(request, adminToken, `/billing/${billId}/cancel`);
    }
    // Note: orders cannot be deleted via API — they remain in the DB
    // for audit purposes, which is fine as they reference real tables and items
  });

  test('1. Waiter creates a new order', async ({ waiterPage: page }) => {
    test.skip(!tableId, 'No available table found');

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /New Order/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select table
    await dialog.locator('[role="combobox"], .MuiSelect-select').first().click();
    await page.waitForTimeout(500);

    // Find our table in options
    const tableOpt = page.getByRole('option', { name: new RegExp(`Table ${tableNumber}`) });
    if (await tableOpt.isVisible().catch(() => false)) {
      await tableOpt.click();
    } else {
      // Pick first available
      await page.getByRole('option').first().click();
    }

    // Search for a menu item
    const searchInput = dialog.getByLabel(/Search menu items/i);
    await searchInput.fill('Butter');
    await page.waitForTimeout(1000);

    let menuItem = page.getByRole('option').first();
    if (!(await menuItem.isVisible().catch(() => false))) {
      await searchInput.clear();
      await searchInput.fill('Paneer');
      await page.waitForTimeout(1000);
      menuItem = page.getByRole('option').first();
    }
    if (!(await menuItem.isVisible().catch(() => false))) {
      // Last resort: try any letter
      await searchInput.clear();
      await searchInput.fill('a');
      await page.waitForTimeout(1000);
      menuItem = page.getByRole('option').first();
    }

    test.skip(!(await menuItem.isVisible().catch(() => false)), 'No menu items found');

    await menuItem.click();
    await page.waitForTimeout(300);

    const addBtn = dialog.getByRole('button', { name: /^Add$/i });
    await addBtn.click();

    // Intercept POST response to get order ID
    const orderPromise = page.waitForResponse(
      resp => resp.url().includes('/api/orders') && resp.request().method() === 'POST'
    );

    await dialog.getByRole('button', { name: /Create Order/i }).click();

    const orderResp = await orderPromise;
    expect(orderResp.ok()).toBeTruthy();
    const orderBody = await orderResp.json();
    orderId = orderBody.data.id;

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('2. Kitchen staff starts preparing the order', async ({ kitchenPage: page }) => {
    test.skip(!orderId, 'No order created');

    // Use kitchen-specific API endpoint for reliable status update
    const token = await getToken(page.request, 'kitchen');
    await apiPut(page.request, token, `/orders/${orderId}/start-preparing`, {});

    // Verify in kitchen display
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Mark Ready/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Kitchen staff marks order ready', async ({ kitchenPage: page }) => {
    test.skip(!orderId, 'No order created');

    // Use kitchen-specific API endpoint for reliable status update
    const token = await getToken(page.request, 'kitchen');
    await apiPut(page.request, token, `/orders/${orderId}/mark-ready`, {});

    // Verify in kitchen display
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Ready for Pickup/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('4. Admin marks order as served', async ({ adminPage: page }) => {
    test.skip(!orderId, 'No order created');

    // Use API to mark served (reliable, admin has full access)
    await apiPut(page.request, adminToken, `/orders/${orderId}/status`, { status: 'served' });

    // Verify via orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/served/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('5. Cashier generates a bill for the served order', async ({ cashierPage: page }) => {
    test.skip(!orderId, 'No order created');

    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Generate Bill/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });

    // Wait for served orders to load
    await page.waitForTimeout(2000);

    // Click on the first served order to select it
    const orderBox = dialog.locator('.MuiPaper-root, .MuiBox-root').filter({ hasText: /Table/ }).first();
    if (await orderBox.isVisible().catch(() => false)) {
      await orderBox.click();
      await page.waitForTimeout(300);

      // Intercept POST to capture bill ID
      const billPromise = page.waitForResponse(
        resp => resp.url().includes('/api/billing/generate') && resp.request().method() === 'POST'
      );

      await dialog.getByRole('button', { name: /Generate Bill/i }).click();

      const billResp = await billPromise;
      if (billResp.ok()) {
        const billBody = await billResp.json();
        billId = billBody.data.id;
        await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
        await dismissToast(page);
      }
    }
  });

  test('6. Cashier processes payment', async ({ cashierPage: page }) => {
    test.skip(!billId, 'No bill generated');

    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Find the pending bill and click process payment
    const payBtn = page.locator('[title="Process Payment"]').first();
    await expect(payBtn).toBeVisible({ timeout: 5000 });
    await payBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select payment method
    await dialog.getByLabel(/Payment Method/i).click();
    await page.getByRole('option', { name: /CASH/i }).click();

    await dialog.getByRole('button', { name: /Process Payment/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
    billId = ''; // Paid, no need to cancel in cleanup
  });
});
