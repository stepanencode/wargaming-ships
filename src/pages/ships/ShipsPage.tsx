import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ShipFilters } from '../../features/ship-filters/ui/ShipFilters';
import { filterShips } from '../../features/ship-filters/model/filterShips';
import {
  getFilterOptions,
  type ShipFilterOptions,
} from '../../features/ship-filters/model/getFilterOptions';

import {
  initialShipFilters,
  type ShipFiltersState,
} from '../../features/ship-filters/model/types';
import { fetchFleetData } from '../../shared/api/fleet';
import { ShipList } from '../../entities/ship/ui/ShipList';
import { markShipsRendered } from '../../shared/monitoring/sentry';

const EMPTY_FILTER_OPTIONS: ShipFilterOptions = {
  nations: [],
  types: [],
  tiers: [],
};

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export function ShipsPage() {
  const [filters, setFilters] = useState<ShipFiltersState>(initialShipFilters);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['fleet'],
    queryFn: ({ signal }) => fetchFleetData(signal),

    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const filterOptions = useMemo(
    () => (data ? getFilterOptions(data) : EMPTY_FILTER_OPTIONS),
    [data],
  );

  const filteredShips = useMemo(
    () => (data ? filterShips(data.ships, filters) : []),
    [data, filters],
  );

  useEffect(() => {
    if (data) markShipsRendered();
  }, [data]);

  if (isPending) {
    return <div role="status">Loading fleet...</div>;
  }

  if (isError) {
    return (
      <div>
        <p role="alert">
          Failed to load fleet:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>

        <button type="button" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <main>
      <h1>World of Warships Fleet Explorer</h1>

      <ShipFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        onReset={() => setFilters(initialShipFilters)}
      />

      <p role="status">
        {filteredShips.length} {filteredShips.length === 1 ? 'ship' : 'ships'}{' '}
        found
      </p>

      {filteredShips.length === 0 ? (
        <div>
          <p>No ships match your filters.</p>
        </div>
      ) : (
        <ShipList ships={filteredShips} />
      )}
    </main>
  );
}
