import { test, expect, loginAs, USERS, getToken, apiDelete, apiGet, apiPost, dismissToast } from './fixtures';

test.describe('Authentication Flow', () => {
  test('displays login page with correct branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Login')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin_test');
    await page.getByLabel('Password').fill('wrong_password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 15000 });
  });

  test('shows error for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toContainText('Please enter both username and password');
  });

  test('admin can login and reach dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/Good (Morning|Afternoon|Evening)/)).toBeVisible();
  });

  test('manager sees role-specific navigation', async ({ page }) => {
    await loginAs(page, 'manager');
    await expect(page.getByRole('button', { name: 'Menu Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Table Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reports' })).toBeVisible();
  });

  test('waiter sees limited navigation', async ({ page }) => {
    await loginAs(page, 'waiter');
    await expect(page.getByRole('button', { name: 'Table Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Order Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'User Management' })).toHaveCount(0);
  });

  test('kitchen staff sees kitchen display nav', async ({ page }) => {
    await loginAs(page, 'kitchen');
    await expect(page.getByRole('button', { name: 'Kitchen Display' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Billing' })).toHaveCount(0);
  });

  test('cashier sees billing nav', async ({ page }) => {
    await loginAs(page, 'cashier');
    await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inventory' })).toHaveCount(0);
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('unauthorized role gets access denied', async ({ page }) => {
    await loginAs(page, 'waiter');
    await page.goto('/users');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('user can logout', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/dashboard/);
    const profileBtn = page.locator('header button').filter({ hasText: /.+/ }).last();
    await profileBtn.click();
    await page.getByRole('menuitem', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('User Management CRUD (Admin)', () => {
  let createdUserId: string;

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the test user via API
    if (createdUserId) {
      const token = await getToken(request, 'admin');
      await apiDelete(request, token, `/auth/users/${createdUserId}`);
    }
  });

  test('admin can create a user', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add|create|new user/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const ts = Date.now();
    await dialog.getByLabel(/Username/i).fill(`e2e_user_${ts}`);
    await dialog.getByLabel(/Password/i).fill('TestPass123!');
    await dialog.getByLabel(/First Name/i).fill('E2E');
    await dialog.getByLabel(/Last Name/i).fill('TestUser');
    await dialog.getByLabel(/Email/i).fill(`e2e_${ts}@test.com`);

    // Select role — MUI Select needs .MuiSelect-select locator
    await dialog.locator('.MuiSelect-select').click();
    await page.getByRole('option', { name: /WAITER/i }).click();

    await dialog.getByRole('button', { name: /Create/i }).click();

    // Verify success toast
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Capture the created user ID via API
    const token = await getToken(page.request, 'admin');
    const resp = await apiGet(page.request, token, '/auth/users');
    const body = await resp.json();
    const user = body.data.find((u: any) => u.username === `e2e_user_${ts}`);
    expect(user).toBeTruthy();
    createdUserId = user.id;
  });

  test('admin can edit a user', async ({ adminPage: page }) => {
    test.skip(!createdUserId, 'No user created to edit');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Find the row with our test user and click edit
    const row = page.locator(`[data-id="${createdUserId}"]`);
    await row.getByLabel('Edit').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/First Name/i).clear();
    await dialog.getByLabel(/First Name/i).fill('Updated');
    await dialog.getByRole('button', { name: /Update/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('admin can deactivate and activate a user', async ({ adminPage: page }) => {
    test.skip(!createdUserId, 'No user created');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const row = page.locator(`[data-id="${createdUserId}"]`);
    await row.getByLabel('Deactivate').click();

    // Confirm dialog
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Activate
    await row.getByLabel('Activate').click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('admin can delete a user', async ({ adminPage: page }) => {
    test.skip(!createdUserId, 'No user created');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const row = page.locator(`[data-id="${createdUserId}"]`);
    await row.getByLabel('Delete').click();

    // Confirm dialog
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    createdUserId = ''; // Already deleted
  });

  test('manager cannot access user management', async ({ managerPage: page }) => {
    await page.goto('/users');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('waiter cannot access user management', async ({ waiterPage: page }) => {
    await page.goto('/users');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
