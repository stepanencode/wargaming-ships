import { describe, expect, it } from 'vitest';

import type { Ship } from '../../../entities/ship/model/types';
import { filterShips } from './filterShips';
import type { ShipFiltersState } from './types';

const makeShip = (
  id: string,
  displayName: string,
  overrides: Partial<Ship> = {},
): Ship => ({
  id,
  codeName: displayName,
  displayName,
  shortDisplayName: null,
  description: null,
  tier: 8,
  nationCode: 'germany',
  typeKey: 'Cruiser',
  imageUrls: {
    medium: null,
    large: null,
  },
  ...overrides,
});

const ships: Ship[] = [
  makeShip('1', 'Lübeck'),
  makeShip('2', 'North Carolina'),
  makeShip('3', 'L’Aigle'),
  makeShip('4', 'Łódź'),
];

const filters = (search: string): ShipFiltersState => ({
  search,
  nation: null,
  type: null,
  tier: null,
});

describe('filterShips search', () => {
  it('matches case-insensitively', () => {
    const result = filterShips(ships, filters('LÜBECK'));

    expect(result.map((ship) => ship.id)).toEqual(['1']);
  });

  it('matches names without diacritics', () => {
    const result = filterShips(ships, filters('lubeck'));

    expect(result.map((ship) => ship.id)).toEqual(['1']);
  });

  it('normalizes whitespace differences', () => {
    const result = filterShips(ships, filters('north   carolina'));

    expect(result.map((ship) => ship.id)).toEqual(['2']);
  });

  it('normalizes non-breaking spaces', () => {
    const result = filterShips(
      [makeShip('1', 'North\u00A0Carolina')],
      filters('north carolina'),
    );

    expect(result.map((ship) => ship.id)).toEqual(['1']);
  });

  it('ignores punctuation in search', () => {
    const result = filterShips(ships, filters('laigle'));

    expect(result.map((ship) => ship.id)).toEqual(['3']);
  });

  it('normalizes characters not handled by Unicode decomposition', () => {
    const result = filterShips(ships, filters('lodz'));

    expect(result.map((ship) => ship.id)).toEqual(['4']);
  });

  it('supports partial name matches', () => {
    const result = filterShips(ships, filters('carol'));

    expect(result.map((ship) => ship.id)).toEqual(['2']);
  });

  it('returns no ships when search does not match', () => {
    const result = filterShips(ships, filters('yamato'));

    expect(result).toEqual([]);
  });
});

describe('filterShips filters', () => {
  const fleet: Ship[] = [
    makeShip('1', 'Hindenburg', {
      nationCode: 'germany',
      typeKey: 'Cruiser',
      tier: 10,
    }),
    makeShip('2', 'Bismarck', {
      nationCode: 'germany',
      typeKey: 'Battleship',
      tier: 8,
    }),
    makeShip('3', 'Des Moines', {
      nationCode: 'usa',
      typeKey: 'Cruiser',
      tier: 10,
    }),
    makeShip('4', 'Fletcher', {
      nationCode: 'usa',
      typeKey: 'Destroyer',
      tier: 9,
    }),
  ];

  it('filters by nation', () => {
    const result = filterShips(fleet, {
      search: '',
      nation: 'germany',
      type: null,
      tier: null,
    });

    expect(result.map((ship) => ship.id)).toEqual(['1', '2']);
  });

  it('filters by ship type', () => {
    const result = filterShips(fleet, {
      search: '',
      nation: null,
      type: 'Cruiser',
      tier: null,
    });

    expect(result.map((ship) => ship.id)).toEqual(['1', '3']);
  });

  it('filters by tier', () => {
    const result = filterShips(fleet, {
      search: '',
      nation: null,
      type: null,
      tier: 10,
    });

    expect(result.map((ship) => ship.id)).toEqual(['1', '3']);
  });

  it('combines search, nation, type and tier with AND logic', () => {
    const result = filterShips(fleet, {
      search: 'hinden',
      nation: 'germany',
      type: 'Cruiser',
      tier: 10,
    });

    expect(result.map((ship) => ship.id)).toEqual(['1']);
  });

  it('returns no ships when one active filter does not match', () => {
    const result = filterShips(fleet, {
      search: 'hinden',
      nation: 'usa',
      type: 'Cruiser',
      tier: 10,
    });

    expect(result).toEqual([]);
  });

  it('returns all ships when no filters are active', () => {
    const result = filterShips(fleet, {
      search: '',
      nation: null,
      type: null,
      tier: null,
    });

    expect(result).toEqual(fleet);
  });
});
