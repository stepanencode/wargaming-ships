import type { RawNation, RawVehicle, RawVehicleType } from './api.types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function parseRawVehicle(value: unknown): RawVehicle | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    level: value.level,
    name: value.name,
    nation: value.nation,
    tags: value.tags,
    icons: value.icons,
    localization: value.localization,
  };
}

export function parseVehiclesResponse(
  value: unknown,
): Record<string, RawVehicle> {
  if (!isRecord(value)) {
    throw new Error('Invalid vehicles response');
  }

  if (value.status !== 'ok') {
    throw new Error('Vehicles response status is not ok');
  }

  if (!isRecord(value.data)) {
    throw new Error('Vehicles response data is invalid');
  }

  const vehicles: Record<string, RawVehicle> = {};

  for (const [id, rawVehicle] of Object.entries(value.data)) {
    const vehicle = parseRawVehicle(rawVehicle);

    if (vehicle) {
      vehicles[id] = vehicle;
    }
  }

  return vehicles;
}

function parseRawNation(value: unknown): RawNation | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    name: value.name,
    color: value.color,
    icons: value.icons,
    localization: value.localization,
  };
}

export function parseNationsResponse(value: unknown): RawNation[] {
  if (!isRecord(value)) {
    throw new Error('Invalid nations response');
  }

  if (value.status !== 'ok') {
    throw new Error('Nations response status is not ok');
  }

  if (!Array.isArray(value.data)) {
    throw new Error('Nations response data is invalid');
  }

  return value.data
    .map(parseRawNation)
    .filter((nation): nation is RawNation => nation !== null);
}

function parseRawVehicleType(value: unknown): RawVehicleType | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    icons: value.icons,
    sort_order: value.sort_order,
    localization: value.localization,
  };
}

export function parseVehicleTypesResponse(
  value: unknown,
): Record<string, RawVehicleType> {
  if (!isRecord(value)) {
    throw new Error('Invalid vehicle types response');
  }

  if (value.status !== 'ok') {
    throw new Error('Vehicle types response status is not ok');
  }

  if (!isRecord(value.data)) {
    throw new Error('Vehicle types response data is invalid');
  }

  const vehicleTypes: Record<string, RawVehicleType> = {};

  for (const [key, rawType] of Object.entries(value.data)) {
    const vehicleType = parseRawVehicleType(rawType);

    if (vehicleType) {
      vehicleTypes[key] = vehicleType;
    }
  }

  return vehicleTypes;
}

export function parseMediaPathResponse(value: unknown): string {
  if (!isRecord(value)) {
    throw new Error('Invalid media path response');
  }

  if (value.status !== 'ok') {
    throw new Error('Media path response status is not ok');
  }

  if (!isString(value.data)) {
    throw new Error('Media path response data is invalid');
  }

  return value.data;
}
