import { getJson } from './client';
import {
  parseMediaPathResponse,
  parseNationsResponse,
  parseVehicleTypesResponse,
  parseVehiclesResponse,
} from './parsers';

const API_BASE_URL = '/api/encyclopedia/en';

const endpoints = {
  vehicles: `${API_BASE_URL}/vehicles/`,
  nations: `${API_BASE_URL}/nations/`,
  vehicleTypes: `${API_BASE_URL}/vehicle_types_common/`,
  mediaPath: `${API_BASE_URL}/media_path/`,
} as const;

export async function fetchVehicles(signal?: AbortSignal) {
  const data = await getJson(endpoints.vehicles, signal);

  return parseVehiclesResponse(data);
}

export async function fetchNations(signal?: AbortSignal) {
  const data = await getJson(endpoints.nations, signal);

  return parseNationsResponse(data);
}

export async function fetchVehicleTypes(signal?: AbortSignal) {
  const data = await getJson(endpoints.vehicleTypes, signal);

  return parseVehicleTypesResponse(data);
}

export async function fetchMediaPath(signal?: AbortSignal) {
  const data = await getJson(endpoints.mediaPath, signal);

  return parseMediaPathResponse(data);
}
