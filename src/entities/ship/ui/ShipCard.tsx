import { memo, useState } from 'react';
import type { Ship } from '../model/types';
import './ShipCard.css';

type ShipCardProps = {
  ship: Ship;
};

export const ShipCard = memo(function ShipCard({ ship }: ShipCardProps) {
  const imageSrc = ship.imageUrls.medium ?? ship.imageUrls.large;

  const imageSrcSet =
    ship.imageUrls.medium && ship.imageUrls.large
      ? `${ship.imageUrls.medium} 1x, ${ship.imageUrls.large} 2x`
      : undefined;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const shouldShowImage = imageSrc && !imageFailed;

  return (
    <article className="ship-card">
      <div className="ship-card-image">
        {shouldShowImage ? (
          <img
            className={imageLoaded ? 'is-loaded' : ''}
            src={imageSrc}
            srcSet={imageSrcSet}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="ship-card-image-placeholder">Image unavailable</div>
        )}
      </div>

      <div className="ship-card-content">
        <strong className="ship-card-name">{ship.displayName}</strong>

        <div className="ship-card-meta">
          <span className="ship-card-tier">Tier {ship.tier ?? 'Unknown'}</span>

          <span className="ship-card-nation">
            {ship.nationCode ?? 'Unknown nation'}
          </span>

          <span className="ship-card-type">
            {ship.typeKey ?? 'Unknown type'}
          </span>
        </div>
      </div>
    </article>
  );
});
