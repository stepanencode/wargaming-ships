import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import type { Ship } from '../model/types';
import { ShipCard } from './ShipCard';
import './ShipList.css';

type ShipListProps = {
  ships: Ship[];
};

export function ShipList({ ships }: ShipListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual is intentionally used for list virtualization.
  // React Compiler skips memoization for this component because
  // useVirtualizer exposes an incompatible API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: ships.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 260,
    overscan: 10,
    getItemKey: (index) => ships[index].id,
  });

  return (
    <div
      ref={scrollContainerRef}
      className="ship-list-viewport"
      role="region"
      aria-label="Ships"
      tabIndex={0}
    >
      <ul
        className="ship-list"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const ship = ships[virtualRow.index];

          return (
            <li
              key={virtualRow.key}
              data-index={virtualRow.index}
              data-ship-row
              aria-posinset={virtualRow.index + 1}
              aria-setsize={ships.length}
              ref={virtualizer.measureElement}
              className="ship-list-row"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ShipCard ship={ship} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
