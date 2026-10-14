import { expect, test, type Page } from '@playwright/test';

import {
  mockFleetApi,
  mockVehiclesFailThenRecover,
} from './helpers/mockFleetApi';

async function openFiltersIfNeeded(page: Page) {
  const toggle = page.getByRole('button', {
    name: /^Filters/,
  });

  if (!(await toggle.isVisible())) {
    return;
  }

  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
}

test.beforeEach(async ({ page }) => {
  await mockFleetApi(page);
  await page.goto('/');

  await expect(page.getByRole('status')).toContainText('3 ships found');
});

test('loads the fleet', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fleet Explorer',
    }),
  ).toBeVisible();

  await expect(page.getByText('Hindenburg')).toBeVisible();

  await expect(page.getByText('Bismarck')).toBeVisible();

  await expect(page.getByText('Des Moines')).toBeVisible();
});

test('filters ships by search', async ({ page }) => {
  await openFiltersIfNeeded(page);

  await page.getByRole('searchbox').fill('des');

  await expect(page.getByRole('status')).toContainText('1 ship found');

  await expect(page.getByText('Des Moines')).toBeVisible();

  await expect(page.getByText('Hindenburg')).not.toBeVisible();

  await expect(page.getByText('Bismarck')).not.toBeVisible();
});

test('combines filters and resets them', async ({ page }) => {
  await openFiltersIfNeeded(page);

  await page.getByLabel('Nation').selectOption('germany');

  await page.getByLabel('Ship type').selectOption('Cruiser');

  await page.getByLabel('Tier').selectOption('10');

  await expect(page.getByRole('status')).toContainText('1 ship found');

  await expect(page.getByText('Hindenburg')).toBeVisible();

  await expect(page.getByText('Bismarck')).not.toBeVisible();

  await expect(page.getByText('Des Moines')).not.toBeVisible();

  await page
    .getByRole('button', {
      name: 'Reset filters',
    })
    .click();

  await expect(page.getByRole('status')).toContainText('3 ships found');

  await expect(page.getByText('Hindenburg')).toBeVisible();

  await expect(page.getByText('Bismarck')).toBeVisible();

  await expect(page.getByText('Des Moines')).toBeVisible();
});

test('shows empty state and restores the fleet after reset', async ({
  page,
}) => {
  await openFiltersIfNeeded(page);

  await page.getByRole('searchbox').fill('yamato');

  await expect(page.getByRole('status')).toContainText('0 ships found');

  await expect(
    page.getByRole('heading', {
      name: 'No ships found',
    }),
  ).toBeVisible();

  await expect(
    page.getByText('Try changing your search or filters to see more ships.'),
  ).toBeVisible();

  const emptyState = page.getByRole('region', {
    name: 'No ships found',
  });

  await emptyState
    .getByRole('button', {
      name: 'Reset filters',
    })
    .click();

  await expect(page.getByRole('status')).toContainText('3 ships found');

  await expect(page.getByText('Hindenburg')).toBeVisible();

  await expect(page.getByText('Bismarck')).toBeVisible();

  await expect(page.getByText('Des Moines')).toBeVisible();
});

test('opens and closes ship details', async ({ page }) => {
  await page
    .getByRole('button', {
      name: 'View details for Hindenburg',
    })
    .click();

  const dialog = page.getByRole('dialog', {
    name: 'Hindenburg',
  });

  await expect(dialog).toBeVisible();

  await expect(
    dialog.getByRole('heading', {
      name: 'Hindenburg',
    }),
  ).toBeVisible();

  await expect(dialog.getByText('Tier X')).toBeVisible();

  await expect(dialog.getByText('Germany', { exact: true })).toBeVisible();

  await expect(dialog.getByText('Cruiser', { exact: true })).toBeVisible();

  await expect(dialog.getByText('A German heavy cruiser.')).toBeVisible();

  await dialog
    .getByRole('button', {
      name: 'Close ship details',
    })
    .click();

  await expect(dialog).not.toBeVisible();
});

test('recovers after fleet loading fails and the user retries', async ({
  page,
}) => {
  await page.unroute('**/api/encyclopedia/en/vehicles/');

  const recoverVehicles = await mockVehiclesFailThenRecover(page);

  await page.reload();

  const alert = page.getByRole('alert');

  await expect(alert).toContainText('Unable to load ships');

  recoverVehicles();

  await page
    .getByRole('button', {
      name: 'Retry',
    })
    .click();

  await expect(page.getByRole('status')).toContainText('3 ships found');

  await expect(page.getByText('Hindenburg')).toBeVisible();
});
