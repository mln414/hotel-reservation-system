import { CircleCheck, Clock, Utensils, X } from "lucide-react";
import { useEffect, useState } from "react";

import "./HotelDining.css";

function HotelDining({ hotel, diningItems }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const hotelDiningItems = Array.isArray(diningItems)
    ? diningItems.filter(
        (item) => String(item.hotelId) === String(hotel.id) && item.active === true,
      )
    : [];

  useEffect(() => {
    if (!selectedItem) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedItem(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedItem]);

  if (!hotelDiningItems.length) return null;

  return (
    <section
      className="hotel-dining-section"
      id="dining"
      aria-labelledby="hotel-dining-title"
    >
      <div className="hotel-dining-heading">
        <span aria-hidden="true">5</span>
        <div>
          <h2 id="hotel-dining-title">Dining</h2>
          <p>
            Discover fresh local flavours, international favourites, and
            relaxing oceanfront dining experiences.
          </p>
        </div>
      </div>

      {hotelDiningItems.length > 0 ? (
        <div className="hotel-dining-grid">
          {hotelDiningItems.map((item) => (
            <article className="hotel-dining-card" key={item.id}>
              <div className="hotel-dining-image-wrap">
                <img src={item.image} alt={`${item.name} at ${hotel.name}`} />
                <span>{item.type}</span>
              </div>

              <div className="hotel-dining-card-body">
                <h3>{item.name}</h3>
                <p className="hotel-dining-cuisine">
                  <Utensils aria-hidden="true" size={15} />
                  {item.cuisine}
                </p>
                <p className="hotel-dining-description">
                  {item.shortDescription}
                </p>

                <div className="hotel-dining-hours">
                  <Clock aria-hidden="true" size={15} />
                  <span>{item.openingHours}</span>
                </div>

                <ul className="hotel-dining-meals" aria-label="Meal periods">
                  {(item.mealPeriods || item.mealServices || []).map((mealPeriod) => (
                    <li key={mealPeriod}>{mealPeriod}</li>
                  ))}
                </ul>

                <ul className="hotel-dining-features" aria-label="Dining features">
                  {(item.features || item.highlights || []).slice(0, 3).map((feature) => (
                    <li key={feature}>
                      <CircleCheck aria-hidden="true" size={14} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className="hotel-dining-details-button"
                  type="button"
                  onClick={() => setSelectedItem(item)}
                >
                  View Dining Details <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="hotel-dining-empty">
          Dining information for this hotel will be available soon.
        </p>
      )}

      {selectedItem && (
        <div
          className="hotel-dining-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <div
            className="hotel-dining-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-dining-modal-title"
          >
            <button
              className="hotel-dining-modal-close"
              type="button"
              aria-label="Close dining details"
              onClick={() => setSelectedItem(null)}
            >
              <X aria-hidden="true" size={21} />
            </button>

            <img
              className="hotel-dining-modal-image"
              src={selectedItem.image}
              alt={`${selectedItem.name} at ${hotel.name}`}
            />

            <div className="hotel-dining-modal-content">
              <span className="hotel-dining-modal-type">{selectedItem.type}</span>
              <h3 id="hotel-dining-modal-title">{selectedItem.name}</h3>
              <p className="hotel-dining-cuisine">
                <Utensils aria-hidden="true" size={15} />
                {selectedItem.cuisine}
              </p>
              <p className="hotel-dining-modal-description">
                {selectedItem.fullDescription || selectedItem.description || selectedItem.shortDescription}
              </p>
              <div className="hotel-dining-hours">
                <Clock aria-hidden="true" size={15} />
                <span>{selectedItem.openingHours}</span>
              </div>
              <ul className="hotel-dining-meals" aria-label="Meal periods">
                {(selectedItem.mealPeriods || selectedItem.mealServices || []).map((mealPeriod) => (
                  <li key={mealPeriod}>{mealPeriod}</li>
                ))}
              </ul>
              <ul className="hotel-dining-features" aria-label="Dining features">
                {(selectedItem.features || selectedItem.highlights || []).map((feature) => (
                  <li key={feature}>
                    <CircleCheck aria-hidden="true" size={14} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HotelDining;
