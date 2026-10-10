import type { ShipTypeKey } from '../../../entities/ship/model/types';

export type ShipFiltersState = {
  search: string;
  nation: string | null;
  type: ShipTypeKey | null;
  tier: number | null;
};

export const initialShipFilters: ShipFiltersState = {
  search: '',
  nation: null,
  type: null,
  tier: null,
};
