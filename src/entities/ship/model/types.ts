export type ShipTypeKey =
  | 'Submarine'
  | 'Destroyer'
  | 'Cruiser'
  | 'Battleship'
  | 'AirCarrier';

export type Ship = {
  id: string;
  codeName: string;
  displayName: string;
  tier: number | null;
  nationCode: string | null;
  typeKey: ShipTypeKey | null;
  imageUrl: string | null;
};

export type Nation = {
  code: string;
  displayName: string;
  flagUrl: string | null;
  color: number | null;
};

export type ShipType = {
  key: ShipTypeKey;
  displayName: string;
  iconUrl: string | null;
  sortOrder: number;
};

export type FleetData = {
  ships: Ship[];
  nationsByCode: Record<string, Nation>;
  typesByKey: Partial<Record<ShipTypeKey, ShipType>>;
};
