import { ArrowRight, BedDouble, CalendarRange } from "lucide-react";
import { Link } from "react-router";

import { formatOfferDate } from "../../utils/offerFormatting.js";
import useRooms from "../../context/useRooms.js";
import useRates from "../../context/useRates.js";
import { CUSTOMER_OFFER_STATE_LABELS, getCustomerOfferState, isCustomerOfferVisible } from "../../utils/customerOffers.js";
import "./HotelOffers.css";

function HotelOffers({ hotel, offers }) {
  const { rooms, physicalRooms } = useRooms();
  const { getCurrentRoomRate } = useRates();
  const hotelOffers = Array.isArray(offers)
    ? offers.filter((offer) => isCustomerOfferVisible(offer, [hotel], rooms, { physicalRooms, getCurrentRoomRate }))
    : [];

  if (!hotelOffers.length) return null;

  return (
    <section className="hotel-offers-section" id="offers" aria-labelledby="hotel-offers-title">
      <div className="hotel-offers-heading">
        <span aria-hidden="true">8</span>
        <div><h2 id="hotel-offers-title">Offers at This Hotel</h2><p>Explore currently useful LankaStay offers mapped to {hotel.name}.</p></div>
      </div>
      <div className="hotel-offers-grid">
        {hotelOffers.map((offer) => {
          const status = getCustomerOfferState(offer);
          return <article className="hotel-offer-card" key={offer.id}>
            <div className="hotel-offer-image-wrap"><img src={offer.image} alt={`${offer.title} at ${hotel.name}`} /><span>{offer.discountType === 'FIXED_AMOUNT' ? `LKR ${Number(offer.discountValue).toLocaleString('en-LK')} OFF` : `${offer.discountValue}% OFF`}</span></div>
            <div className="hotel-offer-card-body">
              <h3>{offer.title}</h3><p className="hotel-offer-description">{offer.shortDescription}</p>
              <div className="hotel-offer-validity"><CalendarRange aria-hidden="true" size={16}/><span><small>{status === "COMING_SOON" ? "Available from" : CUSTOMER_OFFER_STATE_LABELS[status]}</small>{formatOfferDate(status === "COMING_SOON" ? offer.validFrom : offer.validTo)}</span></div>
              <div className="hotel-offer-requirements"><span><BedDouble aria-hidden="true" size={16}/>Minimum stay: {offer.minimumNights} {offer.minimumNights === 1 ? "night" : "nights"}</span></div>
              <Link className="hotel-offer-details-button" to={`/offers/${offer.slug}`}>View Offer<ArrowRight aria-hidden="true" size={15}/></Link>
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}

export default HotelOffers;
