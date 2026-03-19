import { test, expect, getToken, apiGet, dismissToast } from './fixtures';

test.describe('Order Management (Waiter)', () => {
  test('waiter can see the order management page', async ({ waiterPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /New Order/i })).toBeVisible();
  });

  test('waiter can open create order dialog', async ({ waiterPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /New Order/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Create New Order/i)).toBeVisible();
    await expect(dialog.getByText(/Select Table/i).first()).toBeVisible();
  });

  test('waiter can create an order for an available table', async ({ waiterPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /New Order/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select a table from dropdown
    await dialog.locator('[role="combobox"], .MuiSelect-select').first().click();
    await page.waitForTimeout(500);
    const tableOption = page.getByRole('option').first();
    if (!(await tableOption.isVisible())) {
      test.skip(true, 'No available tables');
      return;
    }
    await tableOption.click();

    // Search for a menu item
    const searchInput = dialog.getByLabel(/Search menu items/i);
    await searchInput.fill('Paneer');
    await page.waitForTimeout(1000);

    const menuOption = page.getByRole('option').first();
    if (!(await menuOption.isVisible().catch(() => false))) {
      // Try a broader search
      await searchInput.clear();
      await searchInput.fill('Butter');
      await page.waitForTimeout(1000);
    }

    const opt = page.getByRole('option').first();
    if (await opt.isVisible().catch(() => false)) {
      await opt.click();
      await page.waitForTimeout(300);

      // Click Add
      const addBtn = dialog.getByRole('button', { name: /^Add$/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
      }

      // Submit the order
      await dialog.getByRole('button', { name: /Create Order/i }).click();

      // Verify success toast
      await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
      await dismissToast(page);
    }
  });

  test('order list shows order entries', async ({ waiterPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .MuiTable-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('waiter can view order details', async ({ waiterPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const viewBtn = page.locator('[title="View Details"]').first();
    if (await viewBtn.isVisible().catch(() => false)) {
      await viewBtn.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/Order Details/i)).toBeVisible();
      await dialog.getByRole('button', { name: /Close/i }).click();
    }
  });
});

test.describe('Order Management — Other Roles', () => {
  test('manager can view all orders', async ({ managerPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .MuiTable-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin can view all orders', async ({ adminPage: page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .MuiTable-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('cashier cannot access order management', async ({ cashierPage: page }) => {
    await page.goto('/orders');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
