import type { Ship } from '../../../entities/ship/model/types';
import type { ShipFiltersState } from './types';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ß/g, 'ss')
    .replace(/[\p{P}\s]+/gu, '');
}

export function filterShips(ships: Ship[], filters: ShipFiltersState): Ship[] {
  const search = normalizeSearchText(filters.search);

  return ships.filter((ship) => {
    const shipName = normalizeSearchText(ship.displayName);

    if (search && !shipName.includes(search)) {
      return false;
    }

    if (filters.nation && ship.nationCode !== filters.nation) {
      return false;
    }

    if (filters.type && ship.typeKey !== filters.type) {
      return false;
    }

    if (filters.tier !== null && ship.tier !== filters.tier) {
      return false;
    }

    return true;
  });
}
