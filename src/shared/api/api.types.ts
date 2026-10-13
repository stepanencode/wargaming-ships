export type RawLocalizedText = {
  en?: unknown;
};

export type RawLocalization = {
  mark?: RawLocalizedText;
  shortmark?: RawLocalizedText;
};

export type RawIcons = {
  medium?: unknown;
  default?: unknown;
};

export type RawVehicle = {
  level?: unknown;
  name?: unknown;
  nation?: unknown;
  tags?: unknown;
  icons?: unknown;
  localization?: unknown;
};

export type RawNation = {
  name?: unknown;
  color?: unknown;
  icons?: unknown;
  localization?: unknown;
};

export type RawVehicleType = {
  icons?: unknown;
  sort_order?: unknown;
  localization?: unknown;
};

export type RawVehiclesResponse = {
  status?: unknown;
  data?: unknown;
};

export type RawNationsResponse = {
  status?: unknown;
  data?: unknown;
};

export type RawVehicleTypesResponse = {
  status?: unknown;
  data?: unknown;
};

export type RawMediaPathResponse = {
  status?: unknown;
  data?: unknown;
};
