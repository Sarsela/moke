import { test, expect } from '@playwright/test';

const API_URL = 'https://fakestoreapi.com/products';

const MOCK_PRODUCTS = [
  { id: 1, title: 'Мок-товар 1', price: 10.5, image: 'https://via.placeholder.com/80' },
  { id: 2, title: 'Мок-товар 2', price: 22.0, image: 'https://via.placeholder.com/80' },
  { id: 3, title: 'Мок-товар 3', price: 7.99, image: 'https://via.placeholder.com/80' },
];

test.describe('Приложение с запросом к API', () => {

  test('перехватывает запрос к API и подставляет мок данные', async ({ page }) => {
    await page.route(API_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS),
      });
    });

    await page.goto('/');

    const items = page.getByTestId('product-item');
    await expect(items).toHaveCount(3);

    await expect(page.getByText('Мок-товар 1')).toBeVisible();
    await expect(page.getByText('Мок-товар 2')).toBeVisible();
    await expect(page.getByText('Мок-товар 3')).toBeVisible();

    await expect(page.getByText('$10.5')).toBeVisible();
    await expect(page.getByText('$22')).toBeVisible();
    await expect(page.getByText('$7.99')).toBeVisible();
  });

  test('показывает сообщение об ошибке при статусе 403', async ({ page }) => {
    await page.route(API_URL, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Forbidden' }),
      });
    });

    await page.goto('/');

    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('403');
    await expect(errorMessage).toContainText('Доступ запрещён');

    await expect(page.getByTestId('products-list')).not.toBeVisible();
  });

  test('показывает сообщение об ошибке при сетевой ошибке', async ({ page }) => {
    await page.route(API_URL, async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');

    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Не удалось загрузить данные');
  });

  test('показывает состояние загрузки до получения ответа', async ({ page }) => {
    let resolveResponse;
    const pending = new Promise((r) => (resolveResponse = r));

    await page.route(API_URL, async (route) => {
      await pending;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS),
      });
    });

    await page.goto('/');

    await expect(page.getByTestId('loading')).toBeVisible();

    resolveResponse();

    await expect(page.getByTestId('products-list')).toBeVisible();
    await expect(page.getByTestId('product-item')).toHaveCount(3);
  });
});