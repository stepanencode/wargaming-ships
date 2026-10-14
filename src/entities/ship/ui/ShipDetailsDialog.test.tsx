import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Nation, Ship, ShipType } from '../model/types';
import { ShipDetailsDialog } from './ShipDetailsDialog';

const ship: Ship = {
  id: '1',
  codeName: 'PGSC110_Hindenburg',
  displayName: 'Hindenburg',
  shortDisplayName: 'Hindenburg',
  description: 'A German heavy cruiser.',
  tier: 10,
  nationCode: 'germany',
  typeKey: 'Cruiser',
  imageUrls: {
    medium: 'https://cdn.example.com/hindenburg-medium.png',
    large: 'https://cdn.example.com/hindenburg-large.png',
  },
};

const nation: Nation = {
  code: 'germany',
  displayName: 'Germany',
  flagUrl: 'https://cdn.example.com/germany.png',
  color: null,
};

const shipType: ShipType = {
  key: 'Cruiser',
  displayName: 'Cruiser',
  iconUrl: 'https://cdn.example.com/cruiser.png',
  sortOrder: 3,
};

describe('ShipDetailsDialog', () => {
  it('opens and renders ship details', () => {
    render(
      <ShipDetailsDialog
        ship={ship}
        nation={nation}
        shipType={shipType}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Hindenburg',
    });

    expect(dialog).toHaveAttribute('open');

    expect(
      screen.getByRole('heading', {
        name: 'Hindenburg',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Tier X')).toBeInTheDocument();

    expect(screen.getByText('Germany')).toBeInTheDocument();

    expect(screen.getByText('Cruiser')).toBeInTheDocument();

    expect(screen.getByText('A German heavy cruiser.')).toBeInTheDocument();
  });

  it('uses the large image and switches to fallback when it fails', () => {
    render(
      <ShipDetailsDialog
        ship={ship}
        nation={nation}
        shipType={shipType}
        onClose={vi.fn()}
      />,
    );

    const image = screen.getByRole('img', {
      name: 'Hindenburg',
    });

    expect(image).toHaveAttribute(
      'src',
      'https://cdn.example.com/hindenburg-large.png',
    );

    fireEvent.error(image);

    expect(screen.getByText('Image unavailable')).toBeInTheDocument();

    expect(
      screen.queryByRole('img', {
        name: 'Hindenburg',
      }),
    ).not.toBeInTheDocument();
  });

  it('closes and calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ShipDetailsDialog
        ship={ship}
        nation={nation}
        shipType={shipType}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Hindenburg',
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Close ship details',
      }),
    );

    expect(dialog).not.toHaveAttribute('open');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders safe fallbacks for missing metadata', () => {
    render(
      <ShipDetailsDialog
        ship={{
          ...ship,
          description: null,
          nationCode: null,
          typeKey: null,
          imageUrls: {
            medium: null,
            large: null,
          },
        }}
        nation={null}
        shipType={null}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Unknown nation')).toBeInTheDocument();

    expect(screen.getByText('Unknown type')).toBeInTheDocument();

    expect(
      screen.getByText('No description is available for this ship.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
  });
});
