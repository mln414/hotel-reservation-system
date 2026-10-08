import { Images } from "lucide-react";
import { applyImageFallback } from "../../utils/hotelMedia.js";

import "./HotelGallery.css";

const galleryDescriptors = [
  "exterior",
  "swimming pool",
  "guest room",
  "restaurant",
  "beach",
  "bathroom",
];

function getGalleryItemClass(index) {
  if (index === 0) return "hotel-gallery-item hotel-gallery-item--feature";
  if (index >= 3) return "hotel-gallery-item hotel-gallery-item--wide";
  return "hotel-gallery-item";
}

function HotelGallery({ hotel, images, onOpenGallery }) {
  const galleryImages = Array.isArray(images) ? images.filter(Boolean) : [];

  return (
    <section
      className="hotel-gallery-section"
      id="gallery"
      aria-labelledby="hotel-gallery-title"
    >
      <div className="hotel-gallery-heading">
        <span aria-hidden="true">9</span>
        <div>
          <h2 id="hotel-gallery-title">Gallery</h2>
          <p>
            Explore the rooms, facilities, dining spaces, and coastal
            surroundings of {hotel.name}.
          </p>
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <>
          <div className="hotel-gallery-grid">
            {galleryImages.map((image, index) => {
              const descriptor = galleryDescriptors[index] || `photo ${index + 1}`;
              const altText = `${hotel.name} ${descriptor}`;

              return (
                <button
                  className={getGalleryItemClass(index)}
                  type="button"
                  key={image}
                  aria-label={`View photo ${index + 1} of ${hotel.name}`}
                  onClick={() => onOpenGallery(index)}
                >
                  <img src={image} onError={applyImageFallback} alt={altText} loading="lazy" />
                  <span>
                    <Images aria-hidden="true" size={17} />
                    View Photo
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className="hotel-gallery-view-all"
            type="button"
            onClick={() => onOpenGallery(0)}
          >
            <Images aria-hidden="true" size={17} />
            View All Photos ({galleryImages.length})
          </button>
        </>
      ) : (
        <p className="hotel-gallery-empty">
          Gallery images for this hotel will be available soon.
        </p>
      )}
    </section>
  );
}

export default HotelGallery;
