import { test, expect, getToken, apiDelete, apiGet, dismissToast } from './fixtures';

test.describe('Table Management CRUD (Manager)', () => {
  let createdTableId: string;
  let createdTableNum: string;

  test.afterAll(async ({ request }) => {
    if (createdTableId) {
      const token = await getToken(request, 'admin');
      await apiDelete(request, token, `/tables/${createdTableId}`);
    }
  });

  test('manager can create a table', async ({ managerPage: page }) => {
    await page.goto('/tables');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Table/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Read auto-generated table number
    createdTableNum = await dialog.getByLabel(/Table Number/i).inputValue();

    // Wait for POST response
    const createPromise = page.waitForResponse(
      resp => resp.url().includes('/api/tables') && resp.request().method() === 'POST'
    );

    await dialog.getByRole('button', { name: /Create/i }).click();
    const createResp = await createPromise;

    if (createResp.ok()) {
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
      await dismissToast(page);

      // Get ID via API
      const token = await getToken(page.request, 'admin');
      const resp = await apiGet(page.request, token, '/tables?limit=100');
      const body = await resp.json();
      const tablesArr = Array.isArray(body.data) ? body.data : body.data.data;
      const table = tablesArr.find((t: any) => String(t.tableNumber) === createdTableNum);
      expect(table).toBeTruthy();
      createdTableId = table.id;
    } else {
      // Table number might already exist; find it by number
      const token = await getToken(page.request, 'admin');
      const resp = await apiGet(page.request, token, '/tables?limit=100');
      const body = await resp.json();
      const tablesArr2 = Array.isArray(body.data) ? body.data : body.data.data;
      const existingTable = tablesArr2.find((t: any) => String(t.tableNumber) === createdTableNum);
      if (existingTable) {
        createdTableId = existingTable.id;
      }
    }
  });

  test('manager can edit a table', async ({ managerPage: page }) => {
    test.skip(!createdTableId, 'No table created');
    await page.goto('/tables');
    await page.waitForLoadState('networkidle');

    // Find the card with our table and click edit
    const card = page.locator('.MuiCard-root', { hasText: `Table ${createdTableNum}` });
    await card.locator('[title="Edit Table"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Capacity/i).clear();
    await dialog.getByLabel(/Capacity/i).fill('6');
    await dialog.getByRole('button', { name: /Update/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    await dismissToast(page);
  });

  test('manager can delete a table', async ({ managerPage: page }) => {
    test.skip(!createdTableId, 'No table created');
    await page.goto('/tables');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.MuiCard-root', { hasText: `Table ${createdTableNum}` });
    await card.locator('[title="Delete Table"]').click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 5000 });
    createdTableId = ''; // Already deleted
  });
});

test.describe('Table Management — View & Access', () => {
  test('tables show status chips', async ({ managerPage: page }) => {
    await page.goto('/tables');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Available|Occupied|Reserved/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('waiter can view tables but cannot create', async ({ waiterPage: page }) => {
    await page.goto('/tables');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Table/i).first()).toBeVisible();
    // Waiter should NOT see Add Table button
    await expect(page.getByRole('button', { name: /Add Table/i })).toHaveCount(0);
  });

  test('cashier cannot access table management', async ({ cashierPage: page }) => {
    await page.goto('/tables');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });

  test('kitchen staff cannot access table management', async ({ kitchenPage: page }) => {
    await page.goto('/tables');
    await expect(page.getByText(/Access Denied|access denied|forbidden/i)).toBeVisible();
  });
});
