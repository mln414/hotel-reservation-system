import { ArrowRight, BedDouble, Building2, CalendarDays, Tag } from "lucide-react";
import { Link } from "react-router";

import offerFallbackImage from "../../assets/images/home/early-bird-offer.png";
import { CUSTOMER_OFFER_STATE_LABELS, getCustomerOfferState } from "../../utils/customerOffers.js";
import { formatOfferDate } from "../../utils/offerFormatting.js";
import { formatOfferDiscount } from "../../utils/offerEligibility.js";
import "./OfferCard.css";

function OfferCard({ offer, coverage, variant = "discovery" }) {
  const state = getCustomerOfferState(offer);
  const stateLabel = CUSTOMER_OFFER_STATE_LABELS[state];
  const date = state === "COMING_SOON" ? offer.validFrom : offer.validTo;
  const dateLabel = state === "COMING_SOON" ? "Available from" : "Valid until";
  const titleTag = variant === "home" ? "h3" : "h2";
  const Title = titleTag;
  return (
    <article className={`offer-card offer-card--${variant}`}>
      <Link className="offer-card-overlay-link" to={`/offers/${offer.slug}`} aria-label={`View ${offer.title}`} />
      <div className="offer-card-image-wrap">
        <img src={offer.image || offerFallbackImage} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = offerFallbackImage }} alt={`${offer.title} at LankaStay Hotels & Resorts`} loading="lazy" decoding="async" />
        <span className="offer-card-discount"><Tag aria-hidden="true" size={14} />{formatOfferDiscount(offer)}</span>
        <span className={`offer-card-status offer-card-status--${state?.toLowerCase()}`}>{stateLabel}</span>
      </div>
      <div className="offer-card-body">
        {variant === "home" && <p className="offer-card-kicker">{offer.badge || "A LankaStay exclusive"}</p>}
        <Title>{offer.title}</Title>
        <p>{offer.shortDescription}</p>
        <dl>
          <div><CalendarDays aria-hidden="true" size={15} /><dt>{dateLabel}</dt><dd>{formatOfferDate(date)}</dd></div>
          <div><BedDouble aria-hidden="true" size={15} /><dt>Minimum stay</dt><dd>{offer.minimumNights} {offer.minimumNights === 1 ? "Night" : "Nights"}</dd></div>
          {variant === "discovery" && <div><Building2 aria-hidden="true" size={15} /><dt>Coverage</dt><dd>{coverage?.hotels.length || 0} {(coverage?.hotels.length || 0) === 1 ? "Hotel" : "Hotels"} · {coverage?.roomTypes.length || 0} Room Types</dd></div>}
        </dl>
        <span className="offer-card-action" aria-hidden="true">{variant === "home" ? "Explore Offer" : "View Offer"}<ArrowRight size={16} /></span>
      </div>
    </article>
  );
}

export default OfferCard;
