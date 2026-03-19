import { test as base, Page, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

/** Seed test users (matching backend's 001_initial_users.ts) */
export const USERS = {
  admin:   { username: 'admin_test',   password: 'password123' },
  manager: { username: 'manager_test', password: 'password123' },
  waiter:  { username: 'waiter_test',  password: 'password123' },
  kitchen: { username: 'kitchen_test', password: 'password123' },
  cashier: { username: 'cashier_test', password: 'password123' },
} as const;

/** Get a JWT token for a role via the API */
export async function getToken(request: APIRequestContext, role: keyof typeof USERS): Promise<string> {
  const { username, password } = USERS[role];
  const resp = await request.post(`${API}/auth/login`, { data: { username, password } });
  const body = await resp.json();
  return body.data.token;
}

/** Login via the UI */
export async function loginAs(page: Page, role: keyof typeof USERS) {
  const { username, password } = USERS[role];
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/** Login via API and inject token into localStorage (faster) */
export async function loginViaAPI(page: Page, role: keyof typeof USERS) {
  const { username, password } = USERS[role];
  const resp = await page.request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const body = await resp.json();
  const token = body.data.token;
  const user = JSON.stringify(body.data.user);

  await page.goto('/login');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', user);
    },
    { token, user },
  );
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard');
}

/** Helper: make authenticated API calls for cleanup */
export async function apiDelete(request: APIRequestContext, token: string, path: string) {
  return request.delete(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiPost(request: APIRequestContext, token: string, path: string, data?: unknown) {
  return request.post(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

export async function apiGet(request: APIRequestContext, token: string, path: string) {
  return request.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiPut(request: APIRequestContext, token: string, path: string, data: unknown) {
  return request.put(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

/** Dismiss any visible toast to avoid text conflicts */
export async function dismissToast(page: Page) {
  const toast = page.locator('.Toastify__toast');
  if (await toast.first().isVisible({ timeout: 1000 }).catch(() => false)) {
    const closeBtn = toast.first().locator('.Toastify__close-button');
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click();
    }
    await toast.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

/** Custom test fixture that provides a logged-in page for each role */
type Fixtures = {
  adminPage: Page;
  managerPage: Page;
  waiterPage: Page;
  kitchenPage: Page;
  cashierPage: Page;
};

export const test = base.extend<Fixtures>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaAPI(page, 'admin');
    await use(page);
    await ctx.close();
  },
  managerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaAPI(page, 'manager');
    await use(page);
    await ctx.close();
  },
  waiterPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaAPI(page, 'waiter');
    await use(page);
    await ctx.close();
  },
  kitchenPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaAPI(page, 'kitchen');
    await use(page);
    await ctx.close();
  },
  cashierPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginViaAPI(page, 'cashier');
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
