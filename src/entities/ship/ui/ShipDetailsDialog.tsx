import { useEffect, useRef, useState } from 'react';

import type { Nation, Ship, ShipType } from '../model/types';
import { formatTier } from '../model/formatTier';

import './ShipDetailsDialog.css';

type ShipDetailsDialogProps = {
  ship: Ship | null;
  nation: Nation | null;
  shipType: ShipType | null;
  onClose: () => void;
};

export function ShipDetailsDialog({
  ship,
  nation,
  shipType,
  onClose,
}: ShipDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (ship && !dialog.open) {
      dialog.showModal();
    }

    if (!ship && dialog.open) {
      dialog.close();
    }
  }, [ship]);

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const imageSrc = ship
    ? (ship.imageUrls.large ?? ship.imageUrls.medium)
    : null;

  const imageFailed = imageSrc !== null && failedImageSrc === imageSrc;

  const imageSrcSet =
    ship?.imageUrls.medium && ship?.imageUrls.large
      ? `${ship.imageUrls.medium} 435w, ${ship.imageUrls.large} 870w`
      : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="ship-details-dialog"
      aria-labelledby="ship-details-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
    >
      {ship && (
        <>
          <button
            className="ship-details-close"
            type="button"
            aria-label="Close ship details"
            onClick={closeDialog}
          >
            <span className="ship-details-close-icon" aria-hidden="true">
              ×
            </span>
          </button>
          <div className="ship-details-panel">
            <div className="ship-details-image">
              {imageSrc && !imageFailed ? (
                <img
                  src={imageSrc ?? undefined}
                  srcSet={imageSrcSet}
                  sizes="(max-width: 640px) calc(100vw - 32px), 520px"
                  alt={ship.displayName}
                  decoding="async"
                  onError={() => {
                    if (imageSrc) {
                      setFailedImageSrc(imageSrc);
                    }
                  }}
                />
              ) : (
                <div className="ship-details-image-placeholder">
                  Image unavailable
                </div>
              )}
            </div>

            <div className="ship-details-content">
              <div className="ship-details-heading">
                <p className="ship-details-tier">
                  Tier {formatTier(ship.tier)}
                </p>

                <h2 id="ship-details-title">{ship.displayName}</h2>

                {ship.shortDisplayName && (
                  <p className="ship-details-short-name">
                    {ship.shortDisplayName}
                  </p>
                )}
              </div>

              <div className="ship-details-meta">
                <div className="ship-details-meta-item">
                  {nation?.flagUrl && (
                    <img
                      className="ship-details-nation-flag"
                      src={nation.flagUrl}
                      alt=""
                      width={30}
                      height={20}
                    />
                  )}

                  <span>
                    {nation?.displayName ?? ship.nationCode ?? 'Unknown nation'}
                  </span>
                </div>

                <div className="ship-details-meta-item">
                  {shipType?.iconUrl && (
                    <img
                      className="ship-details-type-icon"
                      src={shipType.iconUrl}
                      alt=""
                      width={24}
                      height={24}
                    />
                  )}

                  <span>
                    {shipType?.displayName ?? ship.typeKey ?? 'Unknown type'}
                  </span>
                </div>
              </div>

              <div className="ship-details-description">
                <h3>About this ship</h3>

                <p>
                  {ship.description ??
                    'No description is available for this ship.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
