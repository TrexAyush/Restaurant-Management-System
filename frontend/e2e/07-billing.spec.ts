import { test, expect, dismissToast } from './fixtures';

test.describe('Billing Management (Cashier)', () => {
  test('cashier can view billing page', async ({ cashierPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Generate Bill/i })).toBeVisible();
  });

  test('cashier can open generate bill dialog', async ({ cashierPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Generate Bill/i }).click();

    // Wait for dialog or toast (if no served orders)
    const dialog = page.getByRole('dialog');
    const toast = page.locator('.Toastify__toast, [role="alert"]').first();
    await expect(dialog.or(toast)).toBeVisible({ timeout: 15000 });

    if (await dialog.isVisible()) {
      // Dialog opened — verify it has a title
      await expect(dialog.getByRole('heading', { name: /Generate Bill/i })).toBeVisible();
      await dialog.getByRole('button', { name: /Cancel/i }).click();
    }
  });

  test('billing page shows bill list table', async ({ cashierPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .MuiTable-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('billing page shows summary cards', async ({ cashierPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    // Summary cards: Pending Bills, Paid Bills, Total Bills, Avg. Bill Value
    await expect(page.getByText(/Pending Bills|Total Bills/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('billing page has payment status filter', async ({ cashierPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Payment Status').first()).toBeVisible();
  });
});

test.describe('Billing Management — Other Roles', () => {
  test('manager can view billing page', async ({ managerPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Generate Bill/i })).toBeVisible();
  });

  test('admin can view billing page', async ({ adminPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Generate Bill/i })).toBeVisible();
  });

  test('kitchen staff cannot access billing', async ({ kitchenPage: page }) => {
    await page.goto('/billing');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('waiter cannot access billing', async ({ waiterPage: page }) => {
    await page.goto('/billing');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
