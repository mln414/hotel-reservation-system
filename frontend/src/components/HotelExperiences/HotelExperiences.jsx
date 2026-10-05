import { CircleCheck, Clock3, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

import "./HotelExperiences.css";

function HotelExperiences({ hotel, experiences }) {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const hotelExperiences = Array.isArray(experiences)
    ? experiences.filter(
        (experience) =>
          experience.contentType === "EXPERIENCE" && (String(experience.hotelId) === String(hotel.id) || (experience.relatedHotelIds || []).some((id) => String(id) === String(hotel.id))) && experience.active === true,
      )
    : [];

  useEffect(() => {
    if (!selectedExperience) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedExperience(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedExperience]);

  if (!hotelExperiences.length) return null;

  return (
    <section
      className="hotel-experiences-section"
      id="experiences"
      aria-labelledby="hotel-experiences-title"
    >
      <div className="hotel-experiences-heading">
        <span aria-hidden="true">7</span>
        <div>
          <h2 id="hotel-experiences-title">Experiences</h2>
          <p>
            Make your stay unforgettable with curated coastal, cultural, and
            adventure experiences.
          </p>
        </div>
      </div>

      {hotelExperiences.length > 0 ? (
        <div className="hotel-experiences-grid">
          {hotelExperiences.map((experience) => (
            <article className="hotel-experience-card" key={experience.id}>
              <div className="hotel-experience-image-wrap">
                <img
                  src={experience.image}
                  alt={`${experience.name} at ${hotel.name}`}
                />
                <span>{experience.category}</span>
              </div>

              <div className="hotel-experience-card-body">
                <h3>{experience.name}</h3>
                <p className="hotel-experience-description">
                  {experience.shortDescription}
                </p>

                <div className="hotel-experience-meta">
                  {experience.duration && <span>
                    <Clock3 aria-hidden="true" size={16} />
                    {experience.duration}
                  </span>}
                  {experience.bestTime && <span>
                    <Sun aria-hidden="true" size={16} />
                    <small>Best Time</small><strong>{experience.bestTime}</strong>
                  </span>}
                </div>

                <ul
                  className="hotel-experience-highlights"
                  aria-label="Experience highlights"
                >
                  {experience.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight}>
                      <CircleCheck aria-hidden="true" size={14} />
                      {highlight}
                    </li>
                  ))}
                </ul>

                <button
                  className="hotel-experience-details-button"
                  type="button"
                  onClick={() => setSelectedExperience(experience)}
                >
                  View Experience <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="hotel-experiences-empty">
          Experience information for this hotel will be available soon.
        </p>
      )}

      {selectedExperience && (
        <div
          className="hotel-experience-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedExperience(null);
            }
          }}
        >
          <div
            className="hotel-experience-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-experience-modal-title"
          >
            <button
              className="hotel-experience-modal-close"
              type="button"
              aria-label="Close experience details"
              onClick={() => setSelectedExperience(null)}
            >
              <X aria-hidden="true" size={21} />
            </button>

            <img
              className="hotel-experience-modal-image"
              src={selectedExperience.image}
              alt={`${selectedExperience.name} at ${hotel.name}`}
            />

            <div className="hotel-experience-modal-content">
              <span className="hotel-experience-modal-category">
                {selectedExperience.category}
              </span>
              <h3 id="hotel-experience-modal-title">
                {selectedExperience.name}
              </h3>
              <p>{selectedExperience.fullDescription || selectedExperience.description || selectedExperience.shortDescription}</p>

              <div className="hotel-experience-meta">
                <span>
                  <Clock3 aria-hidden="true" size={16} />
                  {selectedExperience.duration}
                </span>
                <span>
                  <Sun aria-hidden="true" size={16} />
                  <small>Best Time</small>
                  {selectedExperience.bestTime}
                </span>
              </div>

              <ul
                className="hotel-experience-highlights"
                aria-label="Experience highlights"
              >
                {selectedExperience.highlights.map((highlight) => (
                  <li key={highlight}>
                    <CircleCheck aria-hidden="true" size={14} />
                    {highlight}
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

export default HotelExperiences;
