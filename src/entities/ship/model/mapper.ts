import type { FleetData, Nation, Ship, ShipType, ShipTypeKey } from './types';

import type {
  RawNation,
  RawVehicle,
  RawVehicleType,
} from '../../../shared/api/api.types';

import {
  isNumber,
  isRecord,
  isString,
  isStringArray,
} from '../../../shared/api/parsers';

const SHIP_TYPE_KEYS: ShipTypeKey[] = [
  'Submarine',
  'Destroyer',
  'Cruiser',
  'Battleship',
  'AirCarrier',
];

function getEnglishText(
  localization: unknown,
  key: 'mark' | 'shortmark',
): string | null {
  if (!isRecord(localization)) {
    return null;
  }

  const group = localization[key];

  if (!isRecord(group)) {
    return null;
  }

  return isString(group.en) ? group.en : null;
}

function getVehicleType(tags: unknown): ShipTypeKey | null {
  if (!isStringArray(tags)) {
    return null;
  }

  return SHIP_TYPE_KEYS.find((type) => tags.includes(type)) ?? null;
}

function getImageUrl(
  icons: unknown,
  mediaBaseUrl: string | null,
  size: 'medium' | 'large',
): string | null {
  if (!mediaBaseUrl || !isRecord(icons)) {
    return null;
  }

  const relativePath = icons[size];

  if (!isString(relativePath)) {
    return null;
  }

  return `${mediaBaseUrl}${relativePath}`;
}

export function mapVehicleToShip(
  id: string,
  rawVehicle: RawVehicle,
  mediaBaseUrl: string | null,
): Ship | null {
  if (!id) {
    return null;
  }

  const codeName = isString(rawVehicle.name) ? rawVehicle.name : 'Unknown ship';

  const displayName =
    getEnglishText(rawVehicle.localization, 'mark') ??
    getEnglishText(rawVehicle.localization, 'shortmark') ??
    codeName;

  return {
    id,
    codeName,
    displayName,
    tier: isNumber(rawVehicle.level) ? rawVehicle.level : null,
    nationCode: isString(rawVehicle.nation) ? rawVehicle.nation : null,
    typeKey: getVehicleType(rawVehicle.tags),
    imageUrls: {
      medium: getImageUrl(rawVehicle.icons, mediaBaseUrl, 'medium'),
      large: getImageUrl(rawVehicle.icons, mediaBaseUrl, 'large'),
    },
  };
}

export function mapNation(
  rawNation: RawNation,
  mediaBaseUrl: string | null,
): Nation | null {
  if (!isString(rawNation.name)) {
    return null;
  }

  const displayName =
    getEnglishText(rawNation.localization, 'mark') ?? rawNation.name;

  let flagUrl: string | null = null;

  if (mediaBaseUrl && isRecord(rawNation.icons)) {
    const relativePath = rawNation.icons.default;

    if (isString(relativePath)) {
      flagUrl = `${mediaBaseUrl}${relativePath}`;
    }
  }

  return {
    code: rawNation.name,
    displayName,
    flagUrl,
    color: isNumber(rawNation.color) ? rawNation.color : null,
  };
}

export function mapVehicleType(
  key: string,
  rawType: RawVehicleType,
  mediaBaseUrl: string | null,
): ShipType | null {
  if (!SHIP_TYPE_KEYS.includes(key as ShipTypeKey)) {
    return null;
  }

  const typeKey = key as ShipTypeKey;

  const displayName = getEnglishText(rawType.localization, 'mark') ?? typeKey;

  let iconUrl: string | null = null;

  if (mediaBaseUrl && isRecord(rawType.icons)) {
    const relativePath = rawType.icons.default;

    if (isString(relativePath)) {
      iconUrl = `${mediaBaseUrl}${relativePath}`;
    }
  }

  return {
    key: typeKey,
    displayName,
    iconUrl,
    sortOrder: isNumber(rawType.sort_order) ? rawType.sort_order : 0,
  };
}

export function mapFleetData(
  rawVehicles: Record<string, RawVehicle>,
  rawNations: RawNation[],
  rawVehicleTypes: Record<string, RawVehicleType>,
  mediaBaseUrl: string | null,
): FleetData {
  const ships = Object.entries(rawVehicles)
    .map(([id, rawVehicle]) => mapVehicleToShip(id, rawVehicle, mediaBaseUrl))
    .filter((ship): ship is Ship => ship !== null);

  const nationsByCode: Record<string, Nation> = {};

  for (const rawNation of rawNations) {
    const nation = mapNation(rawNation, mediaBaseUrl);

    if (nation) {
      nationsByCode[nation.code] = nation;
    }
  }

  const typesByKey: Partial<Record<ShipTypeKey, ShipType>> = {};

  for (const [key, rawType] of Object.entries(rawVehicleTypes)) {
    const shipType = mapVehicleType(key, rawType, mediaBaseUrl);

    if (shipType) {
      typesByKey[shipType.key] = shipType;
    }
  }

  return {
    ships,
    nationsByCode,
    typesByKey,
  };
}
