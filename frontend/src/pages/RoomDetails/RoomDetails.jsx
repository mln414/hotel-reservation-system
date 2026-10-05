import {
  ArrowLeft,
  BedDouble,
  Building2,
  MapPin,
  Ruler,
  Users,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import RoomAvailability from "../../components/RoomAvailability/RoomAvailability.jsx";
import HotelPolicies from "../../components/HotelPolicies/HotelPolicies.jsx";
import useHotels from "../../context/useHotels.js";
import useRooms from "../../context/useRooms.js";
import useRates from "../../context/useRates.js";
import usePropertyContent from "../../context/usePropertyContent.js";
import { calculateOfferDiscount, formatOfferDiscount, getBestEligibleOffer, getCurrentOffersForRoom, getEligibleOffersForStay } from "../../utils/offerEligibility.js";
import { formatLkrNumber, formatRateAmount, resolveStayRateQuote } from "../../utils/rateFormatting.js";
import { calculateNights } from "../../utils/reservationDomain.js";
import { applyImageFallback, getRoomDisplayImages, getRoomImageOrPlaceholder } from "../../utils/roomMedia.js";
import { getRoomTypeCustomerVisibility } from "../../utils/roomDomain.js";
import { RoomAmenityIcon } from "../../utils/roomAmenityIcons.jsx";
import "./RoomDetails.css";
import "./RoomDetailsEnhancements.css";

function RoomDetails() {
  const { id } = useParams();
  const { publicHotels: hotels, hotelsLoading } = useHotels();
  const { rooms, physicalRooms, amenities, getRoomById, loading: roomsLoading } = useRooms();
  const { getCurrentRoomRate, ratesLoading } = useRates();
  const { offers } = usePropertyContent();
  const location = useLocation();
  const roomSearch = new URLSearchParams(location.search);
  const selectedCheckIn = roomSearch.get('checkIn') || '';
  const selectedCheckOut = roomSearch.get('checkOut') || '';
  const selectedRooms = Math.max(1, Number(roomSearch.get('rooms') || 1));
  const candidateRoom = getRoomById(id);
  const candidateHotel = candidateRoom ? hotels.find((item) => String(item.id) === String(candidateRoom.hotelId)) : null;
  const currentRate = candidateRoom ? getCurrentRoomRate(candidateRoom.id, selectedCheckIn ? new Date(`${selectedCheckIn}T12:00:00`) : new Date()) : null;
  const room = candidateRoom && getRoomTypeCustomerVisibility({ room: candidateRoom, hotel: candidateHotel, physicalRooms, currentRate }).bookable ? { ...candidateRoom, price: currentRate.amount } : null;
  const hotel = room
    ? hotels.find((item) => String(item.id) === String(room.hotelId))
    : null;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);

    if (location.hash === "#room-availability") {
      requestAnimationFrame(() => {
        document
          .querySelector("#room-availability")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id, location.hash]);

  if (!room && (roomsLoading || hotelsLoading || ratesLoading)) {
    return <section className="room-detail-state" role="status"><h1>Loading room details...</h1></section>;
  }

  if (!room) {
    return (
      <section className="room-detail-state" aria-labelledby="room-not-found-title">
        <span aria-hidden="true"><BedDouble size={28} /></span>
        <h1 id="room-not-found-title">Room Not Found</h1>
        <p>The room you are looking for is unavailable or no longer exists.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </section>
    );
  }

  if (!hotel) {
    return (
      <section className="room-detail-state" aria-labelledby="room-hotel-not-found-title">
        <span aria-hidden="true"><Building2 size={28} /></span>
        <h1 id="room-hotel-not-found-title">Hotel Information Unavailable</h1>
        <p>Hotel information for this room could not be found.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </section>
    );
  }

  const roomImages = getRoomDisplayImages(room);
  const roomOffers = getCurrentOffersForRoom(offers, room);
  const selectedNights = calculateNights(selectedCheckIn, selectedCheckOut);
  const stayQuote = selectedNights ? resolveStayRateQuote(getCurrentRoomRate, room.id, selectedCheckIn, selectedCheckOut, selectedRooms) : null;
  const datedOffers = selectedNights ? getEligibleOffersForStay(offers, room, selectedCheckIn, selectedCheckOut, selectedNights, { hotel }) : roomOffers;
  const requestedOffer = roomSearch.get('offerId') ? datedOffers.find((offer) => String(offer.id) === String(roomSearch.get('offerId'))) : null;
  const featuredOffer = roomSearch.get('offerId') ? requestedOffer : getBestEligibleOffer(datedOffers, { subtotal: stayQuote?.originalTotal || room.price, nights: selectedNights ? selectedNights * selectedRooms : 1 });
  const stayDiscount = stayQuote?.complete ? calculateOfferDiscount(featuredOffer, stayQuote.originalTotal, selectedNights * selectedRooms) : 0;
  const description =
    room.detailDescription || room.description || room.shortDescription;
  const relatedRooms = rooms
    .filter(
      (item) =>
        String(item.hotelId) === String(hotel.id) && String(item.id) !== String(room.id) && getRoomTypeCustomerVisibility({ room: item, hotel, physicalRooms, currentRate: getCurrentRoomRate(item.id) }).bookable,
    )
    .slice(0, 2)
    .map((item) => ({ ...item, price: getCurrentRoomRate(item.id)?.amount }))
    .filter((item) => Number(item.price) > 0);

  const scrollToAvailability = () => {
    document
      .querySelector("#room-availability")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="room-detail-page">
      <nav className="room-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/hotels">Hotels</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/hotels/${hotel.id}`}>{hotel.name}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{room.name}</span>
      </nav>

      <section className="room-detail-hero" aria-labelledby="room-detail-title">
        <div className="room-detail-media">
          <img
            className="room-detail-main-image"
            src={roomImages[activeImageIndex]}
            onError={applyImageFallback}
            alt={`${room.name} at ${hotel.name}`}
          />
          {roomImages.length > 1 && (
            <div className="room-detail-thumbnails" aria-label="Room photos">
              {roomImages.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  aria-label={`Show room photo ${index + 1}`}
                  aria-pressed={activeImageIndex === index}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} onError={applyImageFallback} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="room-detail-summary">
          <span className="room-detail-eyebrow">Room at {hotel.name}</span>
          <h1 id="room-detail-title">{room.name}</h1>
          <Link className="room-detail-hotel-link" to={`/hotels/${hotel.id}${location.search}`}>
            <Building2 aria-hidden="true" size={16} />
            {hotel.name}
          </Link>
          <p className="room-detail-location">
            <MapPin aria-hidden="true" size={15} />
            {hotel.destination}, {hotel.country}
          </p>

          <dl className="room-detail-facts">
            <div><Users aria-hidden="true" size={18} /><dt>Guests</dt><dd>{room.capacity} Guests</dd></div>
            <div><BedDouble aria-hidden="true" size={18} /><dt>Bed</dt><dd>{room.bedType}</dd></div>
            <div><Ruler aria-hidden="true" size={18} /><dt>Size</dt><dd>{room.size}</dd></div>
            <div><Waves aria-hidden="true" size={18} /><dt>View</dt><dd>{room.view}</dd></div>
          </dl>

          <div className="room-detail-price">
            <span>{selectedNights ? `${selectedNights} night stay` : 'From'}</span>
            <strong>{selectedNights && stayQuote?.complete ? formatRateAmount(Math.max(0, stayQuote.originalTotal - stayDiscount)) : formatRateAmount(room.price)}</strong>
            <small>{selectedNights ? `for ${selectedRooms} ${selectedRooms === 1 ? 'room' : 'rooms'}` : '/ night'}</small>
            {stayDiscount > 0 && <em>You save LKR {formatLkrNumber(stayDiscount)}</em>}
          </div>
          {roomOffers.length > 0 && <div className="room-detail-offer-availability"><strong>{formatOfferDiscount(roomOffers[0])} available</strong><span>{roomOffers[0].title}{roomOffers.length > 1 ? ` · +${roomOffers.length - 1} more` : ''}</span><small>Eligibility is confirmed after you choose stay dates.</small></div>}

          <button
            className="room-detail-check-button"
            type="button"
            onClick={scrollToAvailability}
          >
            Check Availability
          </button>
          <Link className="room-detail-back-link" to={`/hotels/${hotel.id}${location.search}`}>
            <ArrowLeft aria-hidden="true" size={16} />
            Back to {hotel.name}
          </Link>
        </div>
      </section>

      <div className="room-detail-information-grid">
        <section className="room-detail-description" aria-labelledby="room-description-title">
          <div className="room-detail-section-heading">
            <span aria-hidden="true">1</span>
            <div>
              <h2 id="room-description-title">About This Room</h2>
              <p>Comfort and thoughtful details for a relaxing stay.</p>
            </div>
          </div>
          <p>{description}</p>
        </section>

        <section className="room-detail-amenities" aria-labelledby="room-amenities-title">
          <div className="room-detail-section-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h2 id="room-amenities-title">Room Amenities</h2>
              <p>Included features for this room type.</p>
            </div>
          </div>
          <ul>
            {(room.amenityIds || []).map((amenityId) => amenities.find((item) => item.id === amenityId)).filter((item) => item?.active).sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)).map((amenity) => {
              return (
                <li key={amenity.id}>
                  <span aria-hidden="true"><RoomAmenityIcon iconKey={amenity.iconKey} size={18} /></span>
                  {amenity.name}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <RoomAvailability key={room.id} hotel={hotel} room={room} />
      <HotelPolicies hotel={hotel} />

      {relatedRooms.length > 0 && (
        <section className="room-related-section" aria-labelledby="related-rooms-title">
          <div className="room-detail-section-heading">
            <span aria-hidden="true">4</span>
            <div>
              <h2 id="related-rooms-title">Other Rooms at {hotel.name}</h2>
              <p>Explore more room options at this hotel.</p>
            </div>
          </div>
          <div className="room-related-grid">
            {relatedRooms.map((relatedRoom) => (
              <article key={relatedRoom.id}>
                <img
                  src={getRoomImageOrPlaceholder(relatedRoom)}
                  onError={applyImageFallback}
                  alt={`${relatedRoom.name} at ${hotel.name}`}
                  loading="lazy"
                />
                <div>
                  <h3>{relatedRoom.name}</h3>
                  <p>From <strong>{formatRateAmount(relatedRoom.price)}</strong> / night</p>
                  <Link to={`/rooms/${relatedRoom.id}${location.search}`}>View Room</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default RoomDetails;
