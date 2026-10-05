import {
  ArrowRight,
  Building2,
  Image as ImageIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ThemeIcon } from "../../utils/destinationIcons.jsx";
import "./DestinationCard.css";

export default function DestinationCard({ data }) {
  const {
    destination,
    route,
    mainImage,
    primaryTheme,
    secondaryThemes,
    highlights,
    remainingHighlightCount,
    publicHotelCount,
  } = data;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [mainImage]);
  const showImage = Boolean(mainImage) && !imageFailed;
  const stayLabel =
    publicHotelCount === 0
      ? "No stays listed yet"
      : `${publicHotelCount} ${publicHotelCount === 1 ? "Hotel" : "Hotels"}`;
  const focalPosition = `${destination.imageFocalPoint?.x ?? 50}% ${destination.imageFocalPoint?.y ?? 50}%`;

  return (
    <article className="customer-destination-card">
      <Link
        className="customer-destination-card-overlay-link"
        to={route}
        aria-label={`Explore ${destination.name}`}
      />
      <div className="customer-destination-card-media">
        {showImage ? (
          <img
            src={mainImage}
            alt={`${destination.name}, Sri Lanka`}
            decoding="async"
            loading="lazy"
            style={{ objectPosition: focalPosition }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="customer-destination-card-fallback">
            <ImageIcon aria-hidden="true" size={30} />
            Destination image unavailable
          </span>
        )}
        {primaryTheme && (
          <span className="customer-destination-card-primary-theme">
            <ThemeIcon themeKey={primaryTheme.key} size={14} />
            {primaryTheme.label}
          </span>
        )}
      </div>
      <div className="customer-destination-card-body">
        <header>
          <div>
            <MapPin aria-hidden="true" size={17} />
            <span>{destination.region || "Sri Lanka"}</span>
          </div>
          <h3>{destination.name}</h3>
        </header>
        <p className="customer-destination-card-description">
          {destination.shortDescription}
        </p>
        {highlights.length > 0 && (
          <ul
            className="customer-destination-card-highlights"
            aria-label={`${destination.name} highlights`}
          >
            {highlights.map((highlight) => (
              <li key={highlight}>
                <Sparkles aria-hidden="true" size={13} />
                {highlight}
              </li>
            ))}
            {remainingHighlightCount > 0 && (
              <li className="customer-destination-card-more">
                +{remainingHighlightCount} more
              </li>
            )}
          </ul>
        )}
        {secondaryThemes.length > 0 && (
          <div
            className="customer-destination-card-secondary-themes"
            aria-label={`More ${destination.name} travel themes`}
          >
            {secondaryThemes.map((theme) => (
              <span key={theme.key}>
                <ThemeIcon themeKey={theme.key} size={13} />
                {theme.label}
              </span>
            ))}
          </div>
        )}
        <footer>
          <span
            className={
              publicHotelCount === 0
                ? "customer-destination-card-stays customer-destination-card-stays--empty"
                : "customer-destination-card-stays"
            }
          >
            <Building2 aria-hidden="true" size={16} />
            {stayLabel}
          </span>
          <Link
            className="customer-destination-card-cta"
            to={route}
            aria-label={`Explore ${destination.name} Destination`}
          >
            Explore Destination
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </footer>
      </div>
    </article>
  );
}
