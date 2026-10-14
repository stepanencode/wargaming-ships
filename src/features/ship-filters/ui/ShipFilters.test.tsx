import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ShipFilterOptions } from '../model/getFilterOptions';
import type { ShipFiltersState } from '../model/types';
import { ShipFilters } from './ShipFilters';

const options: ShipFilterOptions = {
  nations: [
    {
      value: 'germany',
      label: 'Germany',
    },
    {
      value: 'usa',
      label: 'United States',
    },
  ],
  types: [
    {
      value: 'Destroyer',
      label: 'Destroyer',
    },
    {
      value: 'Cruiser',
      label: 'Cruiser',
    },
  ],
  tiers: [8, 10],
};

const initialFilters: ShipFiltersState = {
  search: '',
  nation: null,
  type: null,
  tier: null,
};

describe('ShipFilters', () => {
  it('renders available filter options', () => {
    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('group', { name: /filter ships/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Germany' })).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Cruiser' })).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Tier X' })).toBeInTheDocument();
  });

  it('emits updated search value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    const searchInput = screen.getByRole('searchbox');

    await user.type(searchInput, 'Y');

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      search: 'Y',
    });
  });

  it('emits selected nation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Nation'), 'germany');

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      nation: 'germany',
    });
  });

  it('emits selected ship type', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Ship type'), 'Cruiser');

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      type: 'Cruiser',
    });
  });

  it('emits selected tier as a number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Tier'), '10');

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      tier: 10,
    });
  });

  it('disables reset when no filters are active', () => {
    render(
      <ShipFilters
        filters={initialFilters}
        options={options}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /reset filters/i }),
    ).toBeDisabled();
  });

  it('enables reset and calls onReset when filters are active', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <ShipFilters
        filters={{
          ...initialFilters,
          nation: 'germany',
        }}
        options={options}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    );

    const resetButton = screen.getByRole('button', {
      name: /reset filters/i,
    });

    expect(resetButton).toBeEnabled();

    await user.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
