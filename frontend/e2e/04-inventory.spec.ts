import { test, expect, getToken, apiDelete, apiGet, dismissToast } from './fixtures';

test.describe('Inventory Management CRUD (Manager)', () => {
  let createdItemId: string;
  const itemName = `E2E Spice ${Date.now()}`;

  test.afterAll(async ({ request }) => {
    if (createdItemId) {
      const token = await getToken(request, 'admin');
      await apiDelete(request, token, `/inventory/${createdItemId}`);
    }
  });

  test('manager can view inventory list', async ({ managerPage: page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Add Item/i })).toBeVisible();
    await expect(page.getByText(/Item Name|Name/i).first()).toBeVisible();
  });

  test('manager can add an inventory item', async ({ managerPage: page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Item/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Item Name/i).fill(itemName);
    await dialog.getByLabel(/Current Stock/i).fill('100');
    await dialog.getByLabel(/Unit/i).first().fill('kg');
    await dialog.getByLabel(/Low Stock Threshold/i).fill('10');
    await dialog.getByLabel(/Cost per Unit/i).fill('200');

    await dialog.getByRole('button', { name: /Create/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);

    // Get ID via API
    const token = await getToken(page.request, 'admin');
    const resp = await apiGet(page.request, token, '/inventory?limit=100');
    const body = await resp.json();
    const itemsArr = Array.isArray(body.data) ? body.data : body.data.data;
    const item = itemsArr.find((i: any) => i.name === itemName);
    expect(item).toBeTruthy();
    createdItemId = item.id;
  });

  test('manager can edit an inventory item', async ({ managerPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Change rows per page to 50 so the new item is visible (MUI uses combobox, not native select)
    const rppCombo = page.getByRole('combobox', { name: /rows per page/i });
    if (await rppCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rppCombo.click();
      await page.getByRole('option', { name: '50' }).click();
      await page.waitForLoadState('networkidle');
    }

    const row = page.locator('tr', { hasText: itemName });
    await expect(row.first()).toBeVisible({ timeout: 5000 });
    await row.locator('[title="Edit Item"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Low Stock Threshold/i).clear();
    await dialog.getByLabel(/Low Stock Threshold/i).fill('20');
    await dialog.getByRole('button', { name: /Update/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('manager can update stock', async ({ managerPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Change rows per page to 50 so the new item is visible (MUI uses combobox, not native select)
    const rppCombo = page.getByRole('combobox', { name: /rows per page/i });
    if (await rppCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rppCombo.click();
      await page.getByRole('option', { name: '50' }).click();
      await page.waitForLoadState('networkidle');
    }

    const row = page.locator('tr', { hasText: itemName });
    await expect(row.first()).toBeVisible({ timeout: 5000 });
    await row.locator('[title="Update Stock"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // RESTOCK is the default change type, no need to change it
    const amountField = dialog.getByLabel(/Change Amount/i);
    await amountField.click();
    await amountField.fill('50');
    await dialog.getByLabel(/Reason/i).fill('E2E test restock');

    // Wait for the API response after clicking Update Stock
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/inventory/') && resp.request().method() === 'PUT',
    );
    await dialog.getByRole('button', { name: /Update Stock/i }).click();
    await responsePromise;

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 10000 });
    await dismissToast(page);
  });

  test('manager can delete an inventory item', async ({ managerPage: page }) => {
    test.skip(!createdItemId, 'No item created');
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Change rows per page to 50 so the new item is visible (MUI uses combobox, not native select)
    const rppCombo = page.getByRole('combobox', { name: /rows per page/i });
    if (await rppCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rppCombo.click();
      await page.getByRole('option', { name: '50' }).click();
      await page.waitForLoadState('networkidle');
    }

    const row = page.locator('tr', { hasText: itemName });
    await expect(row.first()).toBeVisible({ timeout: 5000 });
    await row.locator('[title="Delete Item"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    createdItemId = ''; // Already deleted
  });
});

test.describe('Inventory Management — Access Denied', () => {
  test('cashier cannot access inventory', async ({ cashierPage: page }) => {
    await page.goto('/inventory');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('waiter cannot access inventory', async ({ waiterPage: page }) => {
    await page.goto('/inventory');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('kitchen staff cannot access inventory', async ({ kitchenPage: page }) => {
    await page.goto('/inventory');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
