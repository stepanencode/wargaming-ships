import type {
  FleetData,
  ShipTypeKey,
} from '../../../entities/ship/model/types';

export type FilterOption<T> = {
  value: T;
  label: string;
};

export type ShipFilterOptions = {
  nations: FilterOption<string>[];
  types: FilterOption<ShipTypeKey>[];
  tiers: number[];
};

export function getFilterOptions(data: FleetData): ShipFilterOptions {
  const nationCodes = new Set<string>();
  const typeKeys = new Set<ShipTypeKey>();
  const tiers = new Set<number>();

  for (const ship of data.ships) {
    if (ship.nationCode) {
      nationCodes.add(ship.nationCode);
    }

    if (ship.typeKey) {
      typeKeys.add(ship.typeKey);
    }

    if (ship.tier !== null) {
      tiers.add(ship.tier);
    }
  }

  const nations = Array.from(nationCodes)
    .map((code) => ({
      value: code,
      label: data.nationsByCode[code]?.displayName ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const types = Array.from(typeKeys)
    .map((key) => ({
      value: key,
      label: data.typesByKey[key]?.displayName ?? key,
    }))
    .sort((a, b) => {
      const aOrder = data.typesByKey[a.value]?.sortOrder;
      const bOrder = data.typesByKey[b.value]?.sortOrder;

      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }

      return a.label.localeCompare(b.label);
    });

  const tierOptions = Array.from(tiers).sort((a, b) => a - b);

  return {
    nations,
    types,
    tiers: tierOptions,
  };
}
