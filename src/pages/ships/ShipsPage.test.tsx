import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FleetData } from '../../entities/ship/model/types';
import { fetchFleetData } from '../../shared/api/fleet';
import { ShipsPage } from './ShipsPage';

vi.mock('../../shared/api/fleet', () => ({
  fetchFleetData: vi.fn(),
}));

vi.mock('../../shared/monitoring/sentry', () => ({
  markShipsRendered: vi.fn(),
}));

vi.mock('../../entities/ship/ui/ShipList', () => ({
  ShipList: ({
    ships,
  }: {
    ships: Array<{
      id: string;
      displayName: string;
    }>;
  }) => (
    <div data-testid="ship-list">
      {ships.map((ship) => (
        <div key={ship.id}>{ship.displayName}</div>
      ))}
    </div>
  ),
}));

vi.mock('../../entities/ship/ui/ShipDetailsDialog', () => ({
  ShipDetailsDialog: () => null,
}));

const mockedFetchFleetData = vi.mocked(fetchFleetData);

const fleetData: FleetData = {
  ships: [
    {
      id: '1',
      codeName: 'PGSC110_Hindenburg',
      displayName: 'Hindenburg',
      shortDisplayName: null,
      description: null,
      tier: 10,
      nationCode: 'germany',
      typeKey: 'Cruiser',
      imageUrls: {
        medium: null,
        large: null,
      },
    },
    {
      id: '2',
      codeName: 'PGSB108_Bismarck',
      displayName: 'Bismarck',
      shortDisplayName: null,
      description: null,
      tier: 8,
      nationCode: 'germany',
      typeKey: 'Battleship',
      imageUrls: {
        medium: null,
        large: null,
      },
    },
    {
      id: '3',
      codeName: 'PASC110_DesMoines',
      displayName: 'Des Moines',
      shortDisplayName: null,
      description: null,
      tier: 10,
      nationCode: 'usa',
      typeKey: 'Cruiser',
      imageUrls: {
        medium: null,
        large: null,
      },
    },
  ],

  nationsByCode: {
    germany: {
      code: 'germany',
      displayName: 'Germany',
      flagUrl: null,
      color: null,
    },
    usa: {
      code: 'usa',
      displayName: 'United States',
      flagUrl: null,
      color: null,
    },
  },

  typesByKey: {
    Cruiser: {
      key: 'Cruiser',
      displayName: 'Cruiser',
      iconUrl: null,
      sortOrder: 3,
    },
    Battleship: {
      key: 'Battleship',
      displayName: 'Battleship',
      iconUrl: null,
      sortOrder: 4,
    },
  },
};

function renderShipsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: 0,
        gcTime: Infinity,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ShipsPage />
    </QueryClientProvider>,
  );
}

describe('ShipsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedFetchFleetData.mockResolvedValue(fleetData);
  });

  it('renders loaded ships and result count', async () => {
    renderShipsPage();

    expect(await screen.findByText('Hindenburg')).toBeInTheDocument();

    expect(screen.getByText('Bismarck')).toBeInTheDocument();

    expect(screen.getByText('Des Moines')).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('3 ships found');
  });

  it('filters ships when the user searches', async () => {
    const user = userEvent.setup();

    renderShipsPage();

    await screen.findByText('Hindenburg');

    await user.type(screen.getByRole('searchbox'), 'hinden');

    expect(screen.getByRole('status')).toHaveTextContent('1 ship found');

    expect(screen.getByText('Hindenburg')).toBeInTheDocument();

    expect(screen.queryByText('Bismarck')).not.toBeInTheDocument();

    expect(screen.queryByText('Des Moines')).not.toBeInTheDocument();
  });
  it('shows an error state when fleet loading fails', async () => {
    mockedFetchFleetData.mockRejectedValue(new Error('Network unavailable'));

    renderShipsPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Unable to load ships');

    expect(
      screen.getByRole('button', {
        name: 'Retry',
      }),
    ).toBeInTheDocument();

    expect(mockedFetchFleetData).toHaveBeenCalledTimes(2);
  });

  it('loads the fleet after the user retries a failed request', async () => {
    const user = userEvent.setup();

    mockedFetchFleetData
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(fleetData);

    renderShipsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load ships',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Retry',
      }),
    );

    expect(await screen.findByText('Hindenburg')).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('3 ships found');

    expect(mockedFetchFleetData).toHaveBeenCalledTimes(3);
  });

  it('shows empty state and restores ships after reset', async () => {
    const user = userEvent.setup();

    renderShipsPage();

    await screen.findByText('Hindenburg');

    await user.type(screen.getByRole('searchbox'), 'yamato');

    expect(
      screen.getByRole('heading', {
        name: 'No ships found',
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('0 ships found');

    const resetButtons = screen.getAllByRole('button', {
      name: /reset filters/i,
    });

    await user.click(resetButtons[resetButtons.length - 1]);

    expect(await screen.findByText('Hindenburg')).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('3 ships found');
  });
});
