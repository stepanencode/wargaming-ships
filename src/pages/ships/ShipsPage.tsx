import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ShipFilters } from '../../features/ship-filters/ui/ShipFilters';
import { filterShips } from '../../features/ship-filters/model/filterShips';
import { getFilterOptions } from '../../features/ship-filters/model/getFilterOptions';
import {
  initialShipFilters,
  type ShipFiltersState,
} from '../../features/ship-filters/model/types';
import { fetchFleetData } from '../../shared/api/fleet';

export function ShipsPage() {
  const [filters, setFilters] = useState<ShipFiltersState>(initialShipFilters);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['fleet'],
    queryFn: ({ signal }) => fetchFleetData(signal),
  });

  if (isPending) {
    return <div>Loading fleet...</div>;
  }

  if (isError) {
    return (
      <div>
        <p>
          Failed to load fleet:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>

        <button type="button" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const filterOptions = getFilterOptions(data);
  const filteredShips = filterShips(data.ships, filters);

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
        <ul>
          {filteredShips.map((ship) => (
            <li key={ship.id}>
              {ship.displayName}
              {' — '}
              Tier {ship.tier ?? 'Unknown'}
              {' — '}
              {ship.nationCode ?? 'Unknown nation'}
              {' — '}
              {ship.typeKey ?? 'Unknown type'}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
