import { memo, useState } from 'react';
import type { Nation, Ship, ShipType } from '../model/types';
import { formatTier } from '../model/formatTier';
import './ShipCard.css';

type ShipCardProps = {
  ship: Ship;
  nation: Nation | null;
  shipType: ShipType | null;
  onOpen: (shipId: string) => void;
};

export const ShipCard = memo(function ShipCard({
  ship,
  nation,
  shipType,
  onOpen,
}: ShipCardProps) {
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
      <button
        className="ship-card-trigger"
        type="button"
        onClick={() => onOpen(ship.id)}
        aria-label={`View details for ${ship.displayName}`}
      />
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
          <span className="ship-card-tier">Tier {formatTier(ship.tier)}</span>

          <span className="ship-card-nation">
            {nation?.flagUrl && (
              <img
                className="ship-card-meta-icon ship-card-nation-flag"
                src={nation.flagUrl}
                alt=""
                width={24}
                height={16}
                loading="lazy"
                decoding="async"
              />
            )}

            {nation?.displayName ?? ship.nationCode ?? 'Unknown nation'}
          </span>

          <span className="ship-card-type">
            {shipType?.iconUrl && (
              <img
                className="ship-card-meta-icon ship-card-type-icon"
                src={shipType.iconUrl}
                alt=""
                width={20}
                height={20}
                loading="lazy"
                decoding="async"
              />
            )}

            {shipType?.displayName ?? ship.typeKey ?? 'Unknown type'}
          </span>
        </div>
      </div>
    </article>
  );
});
