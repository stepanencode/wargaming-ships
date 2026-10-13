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

  const { data, isPending, isError, refetch } = useQuery({
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

  return (
    <main className="ships-page">
      <header className="ships-page-header">
        <p className="ships-page-eyebrow">World of Warships</p>

        <h1>Fleet Explorer</h1>

        <p className="ships-page-subtitle">
          Explore ships by nation, type and tier.
        </p>
      </header>

      {isPending ? (
        <section
          className="fleet-loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="fleet-loading-header">
            <span className="fleet-loading-kicker">Preparing fleet</span>

            <h2>Loading ships...</h2>
          </div>

          <div className="fleet-loading-list" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="ship-card fleet-loading-card" key={index}>
                <div className="ship-card-image fleet-loading-image" />

                <div className="ship-card-content fleet-loading-content">
                  <div className="fleet-loading-line fleet-loading-line-name" />
                  <div className="fleet-loading-line fleet-loading-line-meta" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : isError ? (
        <section className="fleet-error" role="alert">
          <p className="fleet-error-kicker">Fleet unavailable</p>

          <h2>Unable to load ships</h2>

          <p className="fleet-error-message">
            We couldn&apos;t load the ship catalogue. Please try again.
          </p>

          <button
            className="fleet-error-retry"
            type="button"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </section>
      ) : (
        <>
          <ShipFilters
            filters={filters}
            options={filterOptions}
            onChange={setFilters}
            onReset={() => setFilters(initialShipFilters)}
          />

          <div className="ships-results-summary">
            <p className="ships-results-count" role="status">
              <strong>{filteredShips.length}</strong>{' '}
              {filteredShips.length === 1 ? 'ship' : 'ships'} found
            </p>
          </div>

          {filteredShips.length === 0 ? (
            <section
              className="fleet-empty"
              aria-labelledby="fleet-empty-title"
            >
              <p className="fleet-empty-kicker">No matches</p>

              <h2 id="fleet-empty-title">No ships found</h2>

              <p className="fleet-empty-message">
                Try changing your search or filters to see more ships.
              </p>

              <button
                className="fleet-empty-reset"
                type="button"
                onClick={() => setFilters(initialShipFilters)}
              >
                Reset filters
              </button>
            </section>
          ) : (
            <ShipList ships={filteredShips} />
          )}
        </>
      )}
    </main>
  );
}
