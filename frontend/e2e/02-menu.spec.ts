import { test, expect, getToken, apiDelete, apiGet, dismissToast } from './fixtures';

test.describe('Menu Management — Category CRUD (Manager)', () => {
  let createdCategoryId: string;
  const catName = `E2E Cat ${Date.now()}`;

  test.afterAll(async ({ request }) => {
    if (createdCategoryId) {
      const token = await getToken(request, 'admin');
      await apiDelete(request, token, `/menu/categories/${createdCategoryId}`);
    }
  });

  test('manager can create a category', async ({ managerPage: page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Category/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Category Name/i).fill(catName);
    await dialog.getByLabel(/Description/i).fill('E2E test category');
    await dialog.getByRole('button', { name: /Create/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
    await expect(page.getByText(catName)).toBeVisible({ timeout: 5000 });

    // Get ID via API
    const token = await getToken(page.request, 'admin');
    const resp = await apiGet(page.request, token, '/menu/categories');
    const body = await resp.json();
    const cat = body.data.find((c: any) => c.name === catName);
    expect(cat).toBeTruthy();
    createdCategoryId = cat.id;
  });

  test('manager can edit a category', async ({ managerPage: page }) => {
    test.skip(!createdCategoryId, 'No category created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Find the row with our category and click edit
    const row = page.locator('tr', { hasText: catName });
    await row.locator('[title="Edit"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Description/i).clear();
    await dialog.getByLabel(/Description/i).fill('Updated description');
    await dialog.getByRole('button', { name: /Update/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('manager can deactivate and activate a category', async ({ managerPage: page }) => {
    test.skip(!createdCategoryId, 'No category created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: catName });

    // Deactivate
    await row.locator('[title="Deactivate"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Activate
    await row.locator('[title="Activate"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('manager can delete a category', async ({ managerPage: page }) => {
    test.skip(!createdCategoryId, 'No category created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: catName });
    await row.locator('[title="Delete"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    createdCategoryId = ''; // Already deleted
  });
});

test.describe('Menu Management — Menu Item CRUD (Admin)', () => {
  let createdItemId: string;
  const itemName = `E2E Tikka ${Date.now()}`;

  test.afterAll(async ({ request }) => {
    if (createdItemId) {
      const token = await getToken(request, 'admin');
      await apiDelete(request, token, `/menu/items/${createdItemId}/permanent`);
    }
  });

  test('admin can create a menu item', async ({ adminPage: page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Switch to Menu Items tab
    await page.getByRole('tab', { name: /Menu Items|Items/i }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Menu Item/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Item Name/i).fill(itemName);
    await dialog.getByLabel(/Description/i).fill('E2E test item');
    await dialog.getByLabel(/Price/i).fill('349');
    // Select first category
    await dialog.locator('.MuiSelect-select').click();
    await page.getByRole('option').first().click();

    await dialog.getByRole('button', { name: /Create/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Get ID via API
    const token = await getToken(page.request, 'admin');
    const resp = await apiGet(page.request, token, '/menu/items?limit=100');
    const body = await resp.json();
    const itemsArr = Array.isArray(body.data) ? body.data : body.data.data;
    const item = itemsArr.find((i: any) => i.name === itemName);
    expect(item).toBeTruthy();
    createdItemId = item.id;
  });

  test('admin can edit a menu item', async ({ adminPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /Menu Items|Items/i }).click();
    await page.waitForLoadState('networkidle');

    // Search for the item to ensure it's visible on the page
    const searchBox = page.getByPlaceholder(/search/i);
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill(itemName);
      await page.waitForTimeout(1000);
    }

    const row = page.locator('tr', { hasText: itemName });
    await row.locator('[title="Edit"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Price/i).clear();
    await dialog.getByLabel(/Price/i).fill('399');
    await dialog.getByRole('button', { name: /Update/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('admin can toggle menu item availability', async ({ adminPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /Menu Items|Items/i }).click();
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByPlaceholder(/search/i);
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill(itemName);
      await page.waitForTimeout(1000);
    }

    const row = page.locator('tr', { hasText: itemName });

    // Make unavailable
    await row.locator('[title="Make Unavailable"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Make available again
    await row.locator('[title="Make Available"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('admin can delete a menu item', async ({ adminPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /Menu Items|Items/i }).click();
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByPlaceholder(/search/i);
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill(itemName);
      await page.waitForTimeout(1000);
    }

    const row = page.locator('tr', { hasText: itemName });
    await row.locator('[title="Delete"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    createdItemId = ''; // Already deleted
  });
});

test.describe('Menu Management — View Menu', () => {
  test('manager can view menu display', async ({ managerPage: page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /View Menu|Menu Display/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.MuiCard-root').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Menu Management — Access Denied', () => {
  test('waiter cannot access menu management', async ({ waiterPage: page }) => {
    await page.goto('/menu');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('cashier cannot access menu management', async ({ cashierPage: page }) => {
    await page.goto('/menu');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('kitchen staff cannot access menu management', async ({ kitchenPage: page }) => {
    await page.goto('/menu');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
