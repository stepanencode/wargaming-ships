import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ShipDetailsDialog } from '../../entities/ship/ui/ShipDetailsDialog';
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
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const pageScrollYRef = useRef(0);

  const handleOpenShip = (shipId: string) => {
    pageScrollYRef.current = window.scrollY;
    setSelectedShipId(shipId);
  };

  const handleCloseShip = () => {
    setSelectedShipId(null);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: pageScrollYRef.current,
        left: 0,
        behavior: 'auto',
      });
    });
  };

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

  const activeFilterCount = [
    filters.search.trim() !== '',
    filters.nation !== null,
    filters.type !== null,
    filters.tier !== null,
  ].filter(Boolean).length;

  const selectedShip = useMemo(
    () =>
      data && selectedShipId
        ? (data.ships.find((ship) => ship.id === selectedShipId) ?? null)
        : null,
    [data, selectedShipId],
  );

  const selectedNation =
    selectedShip?.nationCode && data
      ? (data.nationsByCode[selectedShip.nationCode] ?? null)
      : null;

  const selectedShipType =
    selectedShip?.typeKey && data
      ? (data.typesByKey[selectedShip.typeKey] ?? null)
      : null;

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
          <div className="ships-controls">
            <div className="ships-results-summary">
              <p className="ships-results-count" role="status">
                <strong>{filteredShips.length}</strong>{' '}
                {filteredShips.length === 1 ? 'ship' : 'ships'} found
              </p>

              <button
                className="ships-mobile-filters-toggle"
                type="button"
                aria-expanded={isMobileFiltersOpen}
                aria-controls="ship-filters-panel"
                onClick={() => setIsMobileFiltersOpen((isOpen) => !isOpen)}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="ships-mobile-filters-count">
                    {activeFilterCount}
                  </span>
                )}
                <span
                  className={`ships-mobile-filters-chevron ${
                    isMobileFiltersOpen ? 'is-open' : ''
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
            </div>

            <div
              id="ship-filters-panel"
              className={`ships-filters-panel ${
                isMobileFiltersOpen ? 'is-open' : ''
              }`}
            >
              <ShipFilters
                filters={filters}
                options={filterOptions}
                onChange={setFilters}
                onReset={() => setFilters(initialShipFilters)}
              />
            </div>
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
            <ShipList
              ships={filteredShips}
              nationsByCode={data.nationsByCode}
              typesByKey={data.typesByKey}
              onOpenShip={handleOpenShip}
            />
          )}
        </>
      )}
      <ShipDetailsDialog
        ship={selectedShip}
        nation={selectedNation}
        shipType={selectedShipType}
        onClose={handleCloseShip}
      />
    </main>
  );
}
