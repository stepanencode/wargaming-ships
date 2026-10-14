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
  shortDisplayName: string | null;
  description: string | null;
  tier: number | null;
  nationCode: string | null;
  typeKey: ShipTypeKey | null;
  imageUrls: {
    medium: string | null;
    large: string | null;
  };
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
