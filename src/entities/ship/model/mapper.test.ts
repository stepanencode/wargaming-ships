import { describe, expect, it } from 'vitest';

import type {
  RawNation,
  RawVehicle,
  RawVehicleType,
} from '../../../shared/api/api.types';

import {
  mapFleetData,
  mapNation,
  mapVehicleToShip,
  mapVehicleType,
} from './mapper';

const MEDIA_BASE_URL = 'https://cdn.example.com/';

describe('mapVehicleToShip', () => {
  it('maps a complete raw vehicle to the domain model', () => {
    const rawVehicle: RawVehicle = {
      level: 8,
      name: 'PGSC108_TestShip',
      nation: 'germany',
      tags: ['uiSpecial', 'Cruiser', 'canRent'],
      icons: {
        medium: 'vehicle/medium/test.png',
        large: 'vehicle/large/test.png',
      },
      localization: {
        mark: {
          en: 'Test Ship',
        },
        shortmark: {
          en: 'Test',
        },
        description: {
          en: 'A test ship description.',
        },
      },
    };

    const result = mapVehicleToShip('123', rawVehicle, MEDIA_BASE_URL);

    expect(result).toEqual({
      id: '123',
      codeName: 'PGSC108_TestShip',
      displayName: 'Test Ship',
      shortDisplayName: 'Test',
      description: 'A test ship description.',
      tier: 8,
      nationCode: 'germany',
      typeKey: 'Cruiser',
      imageUrls: {
        medium: 'https://cdn.example.com/vehicle/medium/test.png',
        large: 'https://cdn.example.com/vehicle/large/test.png',
      },
    });
  });

  it('uses shortmark when mark is unavailable', () => {
    const rawVehicle: RawVehicle = {
      name: 'PABC001_Test',
      localization: {
        shortmark: {
          en: 'Fallback name',
        },
      },
    };

    const result = mapVehicleToShip('1', rawVehicle, MEDIA_BASE_URL);

    expect(result?.displayName).toBe('Fallback name');
  });

  it('falls back to code name when localized names are unavailable', () => {
    const rawVehicle: RawVehicle = {
      name: 'PABC001_CodeName',
      localization: {},
    };

    const result = mapVehicleToShip('1', rawVehicle, MEDIA_BASE_URL);

    expect(result?.displayName).toBe('PABC001_CodeName');
    expect(result?.codeName).toBe('PABC001_CodeName');
  });

  it('normalizes invalid optional fields to safe fallback values', () => {
    const rawVehicle: RawVehicle = {
      level: '8',
      name: 123,
      nation: false,
      tags: 'Cruiser',
      icons: {
        medium: 123,
        large: null,
      },
      localization: {
        mark: {
          en: 456,
        },
      },
    };

    const result = mapVehicleToShip('1', rawVehicle, MEDIA_BASE_URL);

    expect(result).toEqual({
      id: '1',
      codeName: 'Unknown ship',
      displayName: 'Unknown ship',
      shortDisplayName: null,
      description: null,
      tier: null,
      nationCode: null,
      typeKey: null,
      imageUrls: {
        medium: null,
        large: null,
      },
    });
  });

  it('returns null when the vehicle id is empty', () => {
    const result = mapVehicleToShip(
      '',
      {
        name: 'PABC001_Test',
      },
      MEDIA_BASE_URL,
    );

    expect(result).toBeNull();
  });

  it('does not duplicate shortDisplayName when it equals displayName', () => {
    const rawVehicle: RawVehicle = {
      name: 'PABC001_Test',
      localization: {
        mark: {
          en: 'Same name',
        },
        shortmark: {
          en: 'Same name',
        },
      },
    };

    const result = mapVehicleToShip('1', rawVehicle, MEDIA_BASE_URL);

    expect(result?.displayName).toBe('Same name');
    expect(result?.shortDisplayName).toBeNull();
  });
});

describe('mapNation', () => {
  it('maps nation metadata and image URL', () => {
    const rawNation: RawNation = {
      name: 'germany',
      color: 123456,
      icons: {
        default: 'nation/germany.png',
      },
      localization: {
        mark: {
          en: 'Germany',
        },
      },
    };

    expect(mapNation(rawNation, MEDIA_BASE_URL)).toEqual({
      code: 'germany',
      displayName: 'Germany',
      flagUrl: 'https://cdn.example.com/nation/germany.png',
      color: 123456,
    });
  });

  it('returns null when nation name is invalid', () => {
    const rawNation: RawNation = {
      name: 123,
    };

    expect(mapNation(rawNation, MEDIA_BASE_URL)).toBeNull();
  });
});

describe('mapVehicleType', () => {
  it('maps a supported ship type', () => {
    const rawType: RawVehicleType = {
      sort_order: 3,
      icons: {
        default: 'types/cruiser.png',
      },
      localization: {
        mark: {
          en: 'Cruiser',
        },
      },
    };

    expect(mapVehicleType('Cruiser', rawType, MEDIA_BASE_URL)).toEqual({
      key: 'Cruiser',
      displayName: 'Cruiser',
      iconUrl: 'https://cdn.example.com/types/cruiser.png',
      sortOrder: 3,
    });
  });

  it('rejects unsupported ship type keys', () => {
    expect(mapVehicleType('UnknownType', {}, MEDIA_BASE_URL)).toBeNull();
  });
});

describe('mapFleetData', () => {
  it('builds normalized fleet lookups and skips invalid metadata', () => {
    const rawVehicles: Record<string, RawVehicle> = {
      '1': {
        level: 10,
        name: 'PABC001_Test',
        nation: 'germany',
        tags: ['Cruiser'],
        localization: {
          mark: {
            en: 'Test Cruiser',
          },
        },
      },
    };

    const rawNations: RawNation[] = [
      {
        name: 'germany',
        localization: {
          mark: {
            en: 'Germany',
          },
        },
      },
      {
        name: 123,
      },
    ];

    const rawVehicleTypes: Record<string, RawVehicleType> = {
      Cruiser: {
        localization: {
          mark: {
            en: 'Cruiser',
          },
        },
      },
      Unsupported: {},
    };

    const result = mapFleetData(
      rawVehicles,
      rawNations,
      rawVehicleTypes,
      MEDIA_BASE_URL,
    );

    expect(result.ships).toHaveLength(1);

    expect(result.ships[0]).toMatchObject({
      id: '1',
      displayName: 'Test Cruiser',
      nationCode: 'germany',
      typeKey: 'Cruiser',
      tier: 10,
    });

    expect(result.nationsByCode).toEqual({
      germany: {
        code: 'germany',
        displayName: 'Germany',
        flagUrl: null,
        color: null,
      },
    });

    expect(result.typesByKey).toEqual({
      Cruiser: {
        key: 'Cruiser',
        displayName: 'Cruiser',
        iconUrl: null,
        sortOrder: 0,
      },
    });
  });
});
