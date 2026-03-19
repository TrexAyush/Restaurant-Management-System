import { test, expect } from './fixtures';

test.describe('Admin Pages', () => {
  test('admin can view user management page', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.MuiDataGrid-root, table, .MuiTable-root').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin can open create user form', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add|create|new user/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/Username/i)).toBeVisible();
    await expect(dialog.getByLabel(/Password/i)).toBeVisible();
    await expect(dialog.getByLabel(/First Name/i)).toBeVisible();
    await expect(dialog.getByLabel(/Last Name/i)).toBeVisible();
    await expect(dialog.getByLabel(/Email/i)).toBeVisible();
    await dialog.getByRole('button', { name: /Cancel/i }).click();
  });

  test('admin can view settings page', async ({ adminPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.MuiContainer-root, main, [role="main"]').first()).toBeVisible();
  });

  test('admin can view monitoring page', async ({ adminPage: page }) => {
    await page.goto('/monitoring');
    await page.waitForLoadState('networkidle');
    const tabOrContent = page.locator('.MuiTab-root, .MuiTabs-root, [role="tablist"]');
    if (await tabOrContent.count() > 0) {
      await expect(tabOrContent.first()).toBeVisible();
    } else {
      await expect(page.locator('main, .MuiContainer-root').first()).toBeVisible();
    }
  });

  test('manager cannot access user management', async ({ managerPage: page }) => {
    await page.goto('/users');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('waiter cannot access user management', async ({ waiterPage: page }) => {
    await page.goto('/users');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('cashier cannot access settings', async ({ cashierPage: page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
