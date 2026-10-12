import { memo } from 'react';
import type { Ship } from '../model/types';
import './ShipCard.css';

type ShipCardProps = {
  ship: Ship;
};

export const ShipCard = memo(function ShipCard({ ship }: ShipCardProps) {
  return (
    <article className="ship-card">
      <div className="ship-card-image">
        {ship.imageUrl ? (
          <img src={ship.imageUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="ship-card-image-placeholder">No image</div>
        )}
      </div>

      <div className="ship-card-content">
        <strong>{ship.displayName}</strong>

        <span>Tier {ship.tier ?? 'Unknown'}</span>

        <span>{ship.nationCode ?? 'Unknown nation'}</span>

        <span>{ship.typeKey ?? 'Unknown type'}</span>
      </div>
    </article>
  );
});
