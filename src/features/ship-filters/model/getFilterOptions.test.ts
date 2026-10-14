import { describe, expect, it } from 'vitest';

import type { FleetData, Ship } from '../../../entities/ship/model/types';

import { getFilterOptions } from './getFilterOptions';

const makeShip = (id: string, overrides: Partial<Ship> = {}): Ship => ({
  id,
  codeName: `Ship_${id}`,
  displayName: `Ship ${id}`,
  shortDisplayName: null,
  description: null,
  tier: null,
  nationCode: null,
  typeKey: null,
  imageUrls: {
    medium: null,
    large: null,
  },
  ...overrides,
});

describe('getFilterOptions', () => {
  it('builds unique filter options only from values present in ships', () => {
    const data: FleetData = {
      ships: [
        makeShip('1', {
          nationCode: 'germany',
          typeKey: 'Cruiser',
          tier: 10,
        }),
        makeShip('2', {
          nationCode: 'germany',
          typeKey: 'Cruiser',
          tier: 10,
        }),
        makeShip('3', {
          nationCode: 'usa',
          typeKey: 'Destroyer',
          tier: 8,
        }),
      ],
      nationsByCode: {
        germany: {
          code: 'germany',
          displayName: 'Germany',
          flagUrl: null,
          color: null,
        },
        usa: {
          code: 'usa',
          displayName: 'United States',
          flagUrl: null,
          color: null,
        },
        japan: {
          code: 'japan',
          displayName: 'Japan',
          flagUrl: null,
          color: null,
        },
      },
      typesByKey: {
        Cruiser: {
          key: 'Cruiser',
          displayName: 'Cruiser',
          iconUrl: null,
          sortOrder: 3,
        },
        Destroyer: {
          key: 'Destroyer',
          displayName: 'Destroyer',
          iconUrl: null,
          sortOrder: 2,
        },
      },
    };

    const result = getFilterOptions(data);

    expect(result.nations).toHaveLength(2);
    expect(result.types).toHaveLength(2);
    expect(result.tiers).toEqual([8, 10]);
  });

  it('sorts nations alphabetically by display name', () => {
    const data: FleetData = {
      ships: [
        makeShip('1', { nationCode: 'usa' }),
        makeShip('2', { nationCode: 'germany' }),
        makeShip('3', { nationCode: 'japan' }),
      ],
      nationsByCode: {
        usa: {
          code: 'usa',
          displayName: 'United States',
          flagUrl: null,
          color: null,
        },
        germany: {
          code: 'germany',
          displayName: 'Germany',
          flagUrl: null,
          color: null,
        },
        japan: {
          code: 'japan',
          displayName: 'Japan',
          flagUrl: null,
          color: null,
        },
      },
      typesByKey: {},
    };

    expect(getFilterOptions(data).nations).toEqual([
      {
        value: 'germany',
        label: 'Germany',
      },
      {
        value: 'japan',
        label: 'Japan',
      },
      {
        value: 'usa',
        label: 'United States',
      },
    ]);
  });

  it('sorts ship types by metadata sortOrder', () => {
    const data: FleetData = {
      ships: [
        makeShip('1', { typeKey: 'Battleship' }),
        makeShip('2', { typeKey: 'Cruiser' }),
        makeShip('3', { typeKey: 'Destroyer' }),
      ],
      nationsByCode: {},
      typesByKey: {
        Battleship: {
          key: 'Battleship',
          displayName: 'Battleship',
          iconUrl: null,
          sortOrder: 4,
        },
        Cruiser: {
          key: 'Cruiser',
          displayName: 'Cruiser',
          iconUrl: null,
          sortOrder: 3,
        },
        Destroyer: {
          key: 'Destroyer',
          displayName: 'Destroyer',
          iconUrl: null,
          sortOrder: 2,
        },
      },
    };

    expect(getFilterOptions(data).types.map((type) => type.value)).toEqual([
      'Destroyer',
      'Cruiser',
      'Battleship',
    ]);
  });

  it('uses domain codes as labels when metadata is unavailable', () => {
    const data: FleetData = {
      ships: [
        makeShip('1', {
          nationCode: 'germany',
          typeKey: 'Cruiser',
        }),
      ],
      nationsByCode: {},
      typesByKey: {},
    };

    const result = getFilterOptions(data);

    expect(result.nations).toEqual([
      {
        value: 'germany',
        label: 'germany',
      },
    ]);

    expect(result.types).toEqual([
      {
        value: 'Cruiser',
        label: 'Cruiser',
      },
    ]);
  });

  it('ignores null nation, type and tier values', () => {
    const data: FleetData = {
      ships: [
        makeShip('1'),
        makeShip('2', {
          nationCode: 'usa',
          typeKey: 'Destroyer',
          tier: 9,
        }),
      ],
      nationsByCode: {},
      typesByKey: {},
    };

    const result = getFilterOptions(data);

    expect(result.nations).toEqual([
      {
        value: 'usa',
        label: 'usa',
      },
    ]);

    expect(result.types).toEqual([
      {
        value: 'Destroyer',
        label: 'Destroyer',
      },
    ]);

    expect(result.tiers).toEqual([9]);
  });
});
