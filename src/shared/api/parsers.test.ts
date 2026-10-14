import { describe, expect, it } from 'vitest';

import {
  isNumber,
  isRecord,
  isString,
  isStringArray,
  parseMediaPathResponse,
  parseNationsResponse,
  parseVehiclesResponse,
  parseVehicleTypesResponse,
} from './parsers';

describe('runtime guards', () => {
  it('recognizes plain records', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: 'value' })).toBe(true);

    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('value')).toBe(false);
  });

  it('recognizes strings', () => {
    expect(isString('ship')).toBe(true);

    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
  });

  it('recognizes only finite numbers', () => {
    expect(isNumber(10)).toBe(true);
    expect(isNumber(0)).toBe(true);

    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isNumber('10')).toBe(false);
  });

  it('recognizes arrays containing only strings', () => {
    expect(isStringArray(['Cruiser', 'buyable'])).toBe(true);
    expect(isStringArray([])).toBe(true);

    expect(isStringArray(['Cruiser', 123])).toBe(false);
    expect(isStringArray('Cruiser')).toBe(false);
  });
});

describe('parseVehiclesResponse', () => {
  it('parses a valid vehicles response', () => {
    const result = parseVehiclesResponse({
      status: 'ok',
      data: {
        '123': {
          level: 8,
          name: 'PGSC108_Test',
          nation: 'germany',
          tags: ['Cruiser'],
          icons: {
            medium: 'vehicle/medium/test.png',
          },
          localization: {
            mark: {
              en: 'Test Ship',
            },
          },
        },
      },
    });

    expect(result).toEqual({
      '123': {
        level: 8,
        name: 'PGSC108_Test',
        nation: 'germany',
        tags: ['Cruiser'],
        icons: {
          medium: 'vehicle/medium/test.png',
        },
        localization: {
          mark: {
            en: 'Test Ship',
          },
        },
      },
    });
  });

  it('skips malformed vehicle entries without rejecting the whole response', () => {
    const result = parseVehiclesResponse({
      status: 'ok',
      data: {
        valid: {
          name: 'Valid ship',
        },
        invalidNull: null,
        invalidArray: [],
        invalidString: 'broken',
      },
    });

    expect(result).toEqual({
      valid: {
        level: undefined,
        name: 'Valid ship',
        nation: undefined,
        tags: undefined,
        icons: undefined,
        localization: undefined,
      },
    });
  });

  it.each([
    [null, 'Invalid vehicles response'],
    [
      {
        status: 'error',
        data: {},
      },
      'Vehicles response status is not ok',
    ],
    [
      {
        status: 'ok',
        data: [],
      },
      'Vehicles response data is invalid',
    ],
  ])('rejects an invalid vehicles response', (response, message) => {
    expect(() => parseVehiclesResponse(response)).toThrowError(message);
  });
});

describe('parseNationsResponse', () => {
  it('parses valid nations and skips malformed entries', () => {
    const result = parseNationsResponse({
      status: 'ok',
      data: [
        {
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
        },
        null,
        'broken',
        [],
      ],
    });

    expect(result).toEqual([
      {
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
      },
    ]);
  });

  it.each([
    [null, 'Invalid nations response'],
    [
      {
        status: 'error',
        data: [],
      },
      'Nations response status is not ok',
    ],
    [
      {
        status: 'ok',
        data: {},
      },
      'Nations response data is invalid',
    ],
  ])('rejects an invalid nations response', (response, message) => {
    expect(() => parseNationsResponse(response)).toThrowError(message);
  });
});

describe('parseVehicleTypesResponse', () => {
  it('parses valid vehicle types and skips malformed entries', () => {
    const result = parseVehicleTypesResponse({
      status: 'ok',
      data: {
        Cruiser: {
          sort_order: 3,
          icons: {
            default: 'types/cruiser.png',
          },
          localization: {
            mark: {
              en: 'Cruiser',
            },
          },
        },
        InvalidNull: null,
        InvalidArray: [],
      },
    });

    expect(result).toEqual({
      Cruiser: {
        sort_order: 3,
        icons: {
          default: 'types/cruiser.png',
        },
        localization: {
          mark: {
            en: 'Cruiser',
          },
        },
      },
    });
  });

  it.each([
    [null, 'Invalid vehicle types response'],
    [
      {
        status: 'error',
        data: {},
      },
      'Vehicle types response status is not ok',
    ],
    [
      {
        status: 'ok',
        data: [],
      },
      'Vehicle types response data is invalid',
    ],
  ])('rejects an invalid vehicle types response', (response, message) => {
    expect(() => parseVehicleTypesResponse(response)).toThrowError(message);
  });
});

describe('parseMediaPathResponse', () => {
  it('returns the media base URL from a valid response', () => {
    expect(
      parseMediaPathResponse({
        status: 'ok',
        data: 'https://cdn.example.com/',
      }),
    ).toBe('https://cdn.example.com/');
  });

  it.each([
    [null, 'Invalid media path response'],
    [
      {
        status: 'error',
        data: 'https://cdn.example.com/',
      },
      'Media path response status is not ok',
    ],
    [
      {
        status: 'ok',
        data: 123,
      },
      'Media path response data is invalid',
    ],
  ])('rejects an invalid media path response', (response, message) => {
    expect(() => parseMediaPathResponse(response)).toThrowError(message);
  });
});
