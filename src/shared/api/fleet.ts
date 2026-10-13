import { mapFleetData } from '../../entities/ship/model/mapper';
import {
  fetchMediaPath,
  fetchNations,
  fetchVehicleTypes,
  fetchVehicles,
} from './worldOfWarships.api';

export async function fetchFleetData(signal?: AbortSignal) {
  const vehiclesPromise = fetchVehicles(signal);

  const supportingPromise = Promise.allSettled([
    fetchNations(signal),
    fetchVehicleTypes(signal),
    fetchMediaPath(signal),
  ]);

  const rawVehicles = await vehiclesPromise;

  const [nationsResult, vehicleTypesResult, mediaPathResult] =
    await supportingPromise;

  const rawNations =
    nationsResult.status === 'fulfilled' ? nationsResult.value : [];

  const rawVehicleTypes =
    vehicleTypesResult.status === 'fulfilled' ? vehicleTypesResult.value : {};

  const mediaBaseUrl =
    mediaPathResult.status === 'fulfilled' ? mediaPathResult.value : null;

  return mapFleetData(rawVehicles, rawNations, rawVehicleTypes, mediaBaseUrl);
}
