import { test, expect } from './fixtures';

test.describe('Dashboard & Navigation', () => {
  test('admin sees dashboard with greeting', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/i)).toBeVisible();
  });

  test('dashboard shows navigation cards', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('.MuiCard-root, .MuiPaper-root');
    await expect(cards.first()).toBeVisible();
  });

  test('manager sees dashboard', async ({ managerPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/i)).toBeVisible();
  });

  test('waiter sees dashboard', async ({ waiterPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/i)).toBeVisible();
  });

  test('kitchen staff sees dashboard', async ({ kitchenPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/i)).toBeVisible();
  });

  test('cashier sees dashboard', async ({ cashierPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/i)).toBeVisible();
  });

  test('sidebar navigation works', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Menu Management/i }).click();
    await page.waitForURL(/\/menu/);
    await expect(page).toHaveURL(/\/menu/);
  });

  test('admin can access monitoring page', async ({ adminPage: page }) => {
    await page.goto('/monitoring');
    await page.waitForLoadState('networkidle');
    const tabOrContent = page.locator('.MuiTab-root, .MuiTabs-root, [role="tablist"]');
    if (await tabOrContent.count() > 0) {
      await expect(tabOrContent.first()).toBeVisible();
    } else {
      await expect(page.locator('main, .MuiContainer-root').first()).toBeVisible();
    }
  });
});
