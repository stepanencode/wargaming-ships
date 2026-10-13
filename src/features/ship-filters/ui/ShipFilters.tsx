import type { ShipFiltersState } from '../model/types';
import type { ShipFilterOptions } from '../model/getFilterOptions';
import { SearchInput } from './SearchInput';
import './ShipFilters.css';

type ShipFiltersProps = {
  filters: ShipFiltersState;
  options: ShipFilterOptions;
  onChange: (filters: ShipFiltersState) => void;
  onReset: () => void;
};

export function ShipFilters({
  filters,
  options,
  onChange,
  onReset,
}: ShipFiltersProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.nation !== null ||
    filters.type !== null ||
    filters.tier !== null;

  return (
    <fieldset className="ship-filters">
      <legend>Filter ships</legend>

      <SearchInput
        value={filters.search}
        onChange={(search) =>
          onChange({
            ...filters,
            search,
          })
        }
      />

      <label className="ship-filter-control">
        Nation
        <select
          id="ship-nation"
          name="ship-nation"
          value={filters.nation ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              nation: event.target.value || null,
            })
          }
        >
          <option value="">All nations</option>

          {options.nations.map((nation) => (
            <option key={nation.value} value={nation.value}>
              {nation.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ship-filter-control">
        Ship type
        <select
          id="ship-type"
          name="ship-type"
          value={filters.type ?? ''}
          onChange={(event) => {
            const type =
              options.types.find(
                (option) => option.value === event.target.value,
              )?.value ?? null;

            onChange({
              ...filters,
              type,
            });
          }}
        >
          <option value="">All types</option>

          {options.types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ship-filter-control">
        Tier
        <select
          id="ship-tier"
          name="ship-tier"
          value={filters.tier ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              tier:
                event.target.value === '' ? null : Number(event.target.value),
            })
          }
        >
          <option value="">All tiers</option>

          {options.tiers.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </select>
      </label>

      <button
        className="ship-filters-reset"
        type="button"
        onClick={onReset}
        disabled={!hasActiveFilters}
      >
        Reset filters
      </button>
    </fieldset>
  );
}
