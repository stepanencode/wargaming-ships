import type { Page } from '@playwright/test';

const vehiclesResponse = {
  status: 'ok',
  data: {
    '1': {
      level: 10,
      name: 'PGSC110_Hindenburg',
      nation: 'germany',
      tags: ['Cruiser'],
      icons: {},
      localization: {
        mark: {
          en: 'Hindenburg',
        },
        shortmark: {
          en: 'Hindenburg',
        },
        description: {
          en: 'A German heavy cruiser.',
        },
      },
    },

    '2': {
      level: 8,
      name: 'PGSB108_Bismarck',
      nation: 'germany',
      tags: ['Battleship'],
      icons: {},
      localization: {
        mark: {
          en: 'Bismarck',
        },
        shortmark: {
          en: 'Bismarck',
        },
        description: {
          en: 'A German battleship.',
        },
      },
    },

    '3': {
      level: 10,
      name: 'PASC110_DesMoines',
      nation: 'usa',
      tags: ['Cruiser'],
      icons: {},
      localization: {
        mark: {
          en: 'Des Moines',
        },
        shortmark: {
          en: 'Des Moines',
        },
        description: {
          en: 'An American heavy cruiser.',
        },
      },
    },
  },
};

const nationsResponse = {
  status: 'ok',
  data: [
    {
      name: 'germany',
      color: 0,
      icons: {},
      localization: {
        mark: {
          en: 'Germany',
        },
      },
    },
    {
      name: 'usa',
      color: 0,
      icons: {},
      localization: {
        mark: {
          en: 'United States',
        },
      },
    },
  ],
};

const vehicleTypesResponse = {
  status: 'ok',
  data: {
    Cruiser: {
      sort_order: 3,
      icons: {},
      localization: {
        mark: {
          en: 'Cruiser',
        },
      },
    },
    Battleship: {
      sort_order: 4,
      icons: {},
      localization: {
        mark: {
          en: 'Battleship',
        },
      },
    },
  },
};

const mediaPathResponse = {
  status: 'ok',
  data: 'https://cdn.example.test/',
};

export async function mockFleetApi(page: Page) {
  await page.route('**/api/encyclopedia/en/vehicles/', async (route) => {
    await route.fulfill({
      json: vehiclesResponse,
    });
  });

  await page.route('**/api/encyclopedia/en/nations/', async (route) => {
    await route.fulfill({
      json: nationsResponse,
    });
  });

  await page.route(
    '**/api/encyclopedia/en/vehicle_types_common/',
    async (route) => {
      await route.fulfill({
        json: vehicleTypesResponse,
      });
    },
  );

  await page.route('**/api/encyclopedia/en/media_path/', async (route) => {
    await route.fulfill({
      json: mediaPathResponse,
    });
  });
}

export async function mockVehiclesFailThenRecover(page: Page) {
  let shouldFail = true;

  await page.route('**/api/encyclopedia/en/vehicles/', async (route) => {
    if (shouldFail) {
      await route.fulfill({
        status: 503,
        json: {
          status: 'error',
        },
      });

      return;
    }

    await route.fulfill({
      json: vehiclesResponse,
    });
  });

  return () => {
    shouldFail = false;
  };
}
