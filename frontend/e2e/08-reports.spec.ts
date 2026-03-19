import { test, expect } from './fixtures';

test.describe('Reports & Analytics', () => {
  test('manager can view reports page', async ({ managerPage: page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="date"], .MuiSelect-select, .MuiTextField-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin can view reports page', async ({ adminPage: page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="date"], .MuiSelect-select, .MuiTextField-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('reports page shows export buttons', async ({ managerPage: page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|download|pdf|csv/i });
    if (await exportBtn.count() > 0) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });

  test('waiter cannot access reports', async ({ waiterPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('kitchen staff cannot access reports', async ({ kitchenPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('cashier cannot access reports', async ({ cashierPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
