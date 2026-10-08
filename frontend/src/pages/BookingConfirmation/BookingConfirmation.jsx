import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Info,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ReceiptText,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useHotels from "../../context/useHotels.js";
import useRooms from "../../context/useRooms.js";
import useReservations from "../../context/useReservations.js";
import usePropertyContent from "../../context/usePropertyContent.js";
import useRates from "../../context/useRates.js";
import { calculateOfferDiscount, isOfferEligible } from "../../utils/offerEligibility.js";
import { formatLkrNumber, formatRateAmount, resolveStayRateQuote } from "../../utils/rateFormatting.js";
import { calculateNights, formatStayDate } from "../../utils/reservationDomain.js";
import { applyImageFallback, getRoomMainImage } from "../../utils/roomMedia.js";
import { getHotelPolicies } from "../../utils/hotelPolicies.js";
import "./BookingConfirmation.css";
import "./BookingConfirmationEnhancements.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getCount(value, fallback = 0) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : fallback;
}

function formatDisplayDate(value) {
  return value ? formatStayDate(value) : "Not provided";
}

function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function BookingConfirmation() {
  const { publicHotels: hotels } = useHotels();
  const { getRoomById } = useRooms();
  const { addReservation, checkReservationAvailabilityRemote } = useReservations();
  const { offers } = usePropertyContent();
  const { getCurrentRoomRate } = useRates();
  const location = useLocation();
  const navigate = useNavigate();
  const stateDraft = location.state?.reservationDraft;
  const reservationDraft =
    stateDraft && typeof stateDraft === "object" && !Array.isArray(stateDraft)
      ? stateDraft
      : null;
  const [confirmationStatus, setConfirmationStatus] = useState({
    type: "",
    text: "",
  });
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  if (!reservationDraft) {
    return (
      <section className="review-empty-state" aria-labelledby="review-empty-title">
        <span aria-hidden="true"><ReceiptText size={28} /></span>
        <h1 id="review-empty-title">Reservation Details Not Found</h1>
        <p>We could not find a reservation draft to review.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </section>
    );
  }

  const guest =
    reservationDraft.guest && typeof reservationDraft.guest === "object"
      ? reservationDraft.guest
      : {};
  const stay =
    reservationDraft.stay && typeof reservationDraft.stay === "object"
      ? reservationDraft.stay
      : {};
  const room = getRoomById(reservationDraft.roomId);
  const draftHotel = hotels.find(
    (item) => String(item.id) === String(reservationDraft.hotelId),
  );
  const hotel =
    draftHotel ||
    (room
      ? hotels.find((item) => String(item.id) === String(room.hotelId))
      : null);

  const hotelName = getText(reservationDraft.hotelName) || hotel?.name || "Hotel information unavailable";
  const roomName = getText(reservationDraft.roomName) || room?.name || "Room information unavailable";
  const firstName = getText(guest.firstName);
  const lastName = getText(guest.lastName);
  const email = getText(guest.email);
  const phone = getText(guest.phone);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Not provided";
  const checkIn = getText(stay.checkIn);
  const checkOut = getText(stay.checkOut);
  const adults = getCount(stay.adults);
  const children = getCount(stay.children);
  const roomCount = getCount(stay.rooms);
  const nights = calculateNights(checkIn, checkOut);
  const rateQuote = resolveStayRateQuote(getCurrentRoomRate, room?.id, checkIn, checkOut, roomCount);
  const roomRate = rateQuote.complete ? rateQuote.averageNightlyRate : 0;
  const subtotal = rateQuote.originalTotal;
  const requestedOffer = offers.find((offer) => String(offer.id) === String(reservationDraft.appliedOfferId));
  const eligibleOffer = requestedOffer && isOfferEligible(requestedOffer, { room, hotel, checkIn, checkOut, nights }) ? requestedOffer : null;
  const discountAmount = calculateOfferDiscount(eligibleOffer, subtotal, nights * roomCount);
  const discountSnapshot = eligibleOffer ? { title: eligibleOffer.title, discountType: eligibleOffer.discountType, discountValue: eligibleOffer.discountValue, fixedDiscountScope: eligibleOffer.fixedDiscountScope, amount: discountAmount } : null;
  const estimatedTotal = Math.max(0, subtotal - discountAmount);
  const specialRequests = getText(reservationDraft.specialRequests);
  const hotelPolicies = hotel ? getHotelPolicies(hotel) : [];

  const handleBackAndEdit = () => {
    if (!reservationDraft.roomId) {
      setConfirmationStatus({
        type: "error",
        text: "A room is required before these reservation details can be edited.",
      });
      return;
    }

    navigate(`/booking/${reservationDraft.roomId}`, {
      state: { reservationDraft, editMode: true },
    });
  };

  const handleConfirmReservation = async () => {
    const hasValidRecords = Boolean(
      room &&
      draftHotel &&
      String(room.hotelId) === String(draftHotel.id),
    );
    const isValid = Boolean(
      hasValidRecords &&
      firstName &&
      lastName &&
      emailPattern.test(email) &&
      phone &&
      checkIn &&
      checkOut &&
      nights >= 1 &&
      adults >= 1 &&
      roomCount >= 1 &&
      Number.isFinite(estimatedTotal) &&
      estimatedTotal > 0,
    );

    if (!isValid) {
      setConfirmationStatus({
        type: "error",
        text: "Some reservation details are incomplete. Please go back and review your information.",
      });
      return;
    }

    setConfirmationStatus({ type: "loading", text: "Confirming availability and price…" });
    const availabilityCheck = await checkReservationAvailabilityRemote({
      hotelId: reservationDraft.hotelId,
      roomTypeId: reservationDraft.roomId,
      checkIn,
      checkOut,
      requestedQuantity: roomCount,
    });
    if (!availabilityCheck.available) {
      setConfirmationStatus({
        type: "error",
        text: `Availability changed. This room type is no longer available for your selected dates. ${availabilityCheck.message} Try another room type, different dates, or return to availability search.`,
      });
      return;
    }

    const authoritativeRateId = rateQuote.nightlyRates[0]?.id;
    if (!authoritativeRateId || !Number.isFinite(Number(authoritativeRateId))) {
      setConfirmationStatus({ type: "error", text: "A valid backend room rate is required before this reservation can be confirmed." });
      return;
    }

    const reservationSubmission = {
      hotelId: reservationDraft.hotelId,
      roomId: reservationDraft.roomId,
      roomTypeId: reservationDraft.roomId,
      guest: { name: fullName, firstName, lastName, email, phone },
      checkIn,
      checkOut,
      adults,
      children,
      rooms: roomCount,
      specialRequests,
      roomRate,
      nights,
      estimatedTotal,
      totalAmount: estimatedTotal,
      originalRateSnapshot: { nightlyRate: roomRate, nightlyRates: rateQuote.nightlyRates.map((rate) => Number(rate.amount)), nights, quantity: roomCount, subtotal },
      appliedOfferId: reservationDraft.appliedOfferId || null,
      offerDiscountSnapshot: discountSnapshot || null,
      rateId: Number(authoritativeRateId),
      items: [{ roomTypeId: reservationDraft.roomId, quantity: roomCount, rateId: Number(authoritativeRateId), nightlyRateSnapshot: roomRate, assignedPhysicalRoomIds: [] }],
    };

    const result = await addReservation(reservationSubmission);
    if (result.error) {
      setConfirmationStatus({ type: "error", text: `${result.error}. ${result.message}` });
      return;
    }
    setConfirmedReservation(result.reservation);
    setConfirmationStatus({
      type: "success",
      text: `Reservation confirmed and saved. Your code is ${result.reservation.reservationCode}.`,
    });
  };

  if (confirmedReservation) {
    return (
      <section className="reservation-success-card" aria-labelledby="reservation-confirmed-title">
        <div className="reservation-success-icon" aria-hidden="true"><CircleCheck size={34} /></div>
        <p className="reservation-success-kicker">Reservation Confirmed</p>
        <h1 id="reservation-confirmed-title">Thank you, {firstName}</h1>
        <p className="reservation-success-message">Your stay is confirmed. Keep this reservation code for future reference.</p>
        <div className="reservation-success-code"><span>Reservation code</span><strong>{confirmedReservation.reservationCode}</strong></div>
        <dl className="review-detail-grid review-detail-grid--stay reservation-success-details">
          <div><dt>Hotel</dt><dd>{hotelName}</dd></div>
          <div><dt>Room</dt><dd>{roomName}</dd></div>
          <div><dt>Stay</dt><dd>{formatDisplayDate(checkIn)} – {formatDisplayDate(checkOut)}</dd></div>
          <div><dt>Guests</dt><dd>{pluralize(adults, "Adult")} · {pluralize(children, "Child", "Children")}</dd></div>
          <div><dt>Rooms</dt><dd>{pluralize(roomCount, "Room")}</dd></div>
          <div><dt>Total</dt><dd>{formatRateAmount(confirmedReservation.totalAmount)}</dd></div>
        </dl>
        <div className="review-success-actions"><Link className="is-primary" to={`/my-reservations#${confirmedReservation.id}`}>View Reservation</Link><Link to="/my-reservations">My Reservations</Link>{hotel && <Link to={`/hotels/${hotel.id}`}>Back to Hotel</Link>}</div>
      </section>
    );
  }

  return (
    <div className="reservation-review-page">
      <nav className="review-breadcrumb" aria-label="Breadcrumb">
        <Link to="/hotels">Hotels</Link>
        <ChevronRight aria-hidden="true" size={13} />
        {hotel ? <Link to={`/hotels/${hotel.id}`}>{hotelName}</Link> : <span>{hotelName}</span>}
        <ChevronRight aria-hidden="true" size={13} />
        {room ? <Link to={`/rooms/${room.id}`}>{roomName}</Link> : <span>{roomName}</span>}
        <ChevronRight aria-hidden="true" size={13} />
        <span aria-current="page">Review Reservation</span>
      </nav>

      <header className="review-header">
        <span>Final Review</span>
        <h1>Review Your Reservation</h1>
        <p>Please review your guest and stay details before confirming your reservation.</p>
      </header>

      <div className="review-layout">
        <div className="review-details">
          <section className="review-overview-card" aria-labelledby="review-property-title">
            {room?.image && (
              <div className="review-overview-image">
                <img src={getRoomMainImage(room)} onError={applyImageFallback} alt={`${roomName} at ${hotelName}`} />
              </div>
            )}
            <div className="review-overview-content">
              <span><Building2 aria-hidden="true" size={15} /> Selected Stay</span>
              <h2 id="review-property-title">{hotelName}</h2>
              <strong><BedDouble aria-hidden="true" size={16} />{roomName}</strong>
              {hotel && (
                <p><MapPin aria-hidden="true" size={15} />{hotel.destination}, {hotel.country}</p>
              )}
              <div className="review-overview-links">
                {hotel && <Link to={`/hotels/${hotel.id}`}>View Hotel</Link>}
                {room && <Link to={`/rooms/${room.id}`}>View Room</Link>}
              </div>
            </div>
          </section>

          <section className="review-card" aria-labelledby="review-guest-title">
            <div className="review-card-heading">
              <span aria-hidden="true"><Users size={19} /></span>
              <h2 id="review-guest-title">Guest Details</h2>
            </div>
            <dl className="review-detail-grid review-detail-grid--guest">
              <div><dt>Full Name</dt><dd>{fullName}</dd></div>
              <div><dt><Mail aria-hidden="true" size={14} />Email Address</dt><dd>{email || "Not provided"}</dd></div>
              <div><dt><Phone aria-hidden="true" size={14} />Phone Number</dt><dd>{phone || "Not provided"}</dd></div>
            </dl>
          </section>

          <section className="review-card" aria-labelledby="review-stay-title">
            <div className="review-card-heading">
              <span aria-hidden="true"><CalendarDays size={19} /></span>
              <h2 id="review-stay-title">Stay Details</h2>
            </div>
            <dl className="review-detail-grid review-detail-grid--stay">
              <div><dt>Check-in</dt><dd>{formatDisplayDate(checkIn)}</dd></div>
              <div><dt>Check-out</dt><dd>{formatDisplayDate(checkOut)}</dd></div>
              <div><dt>Nights</dt><dd>{pluralize(nights, "Night")}</dd></div>
              <div><dt>Adults</dt><dd>{pluralize(adults, "Adult")}</dd></div>
              <div><dt>Children</dt><dd>{pluralize(children, "Child", "Children")}</dd></div>
              <div><dt>Rooms</dt><dd>{pluralize(roomCount, "Room")}</dd></div>
            </dl>
          </section>

          <section className="review-card" aria-labelledby="review-request-title">
            <div className="review-card-heading">
              <span aria-hidden="true"><MessageSquareText size={19} /></span>
              <h2 id="review-request-title">Special Requests</h2>
            </div>
            <p className={specialRequests ? "review-request" : "review-request review-request--empty"}>
              {specialRequests || "No special requests added."}
            </p>
          </section>
          {hotelPolicies.length > 0 && <section className="review-card" aria-labelledby="review-policy-title"><div className="review-card-heading"><span aria-hidden="true"><Info size={19} /></span><h2 id="review-policy-title">Hotel Policies</h2></div><dl className="review-detail-grid">{hotelPolicies.slice(0, 4).map(([id, policy]) => <div key={id}><dt>{policy.title}</dt><dd>{policy.summary}</dd></div>)}</dl></section>}
        </div>

        <aside className="review-summary" aria-labelledby="review-summary-title">
          <div className="review-summary-card">
            <div className="review-summary-heading">
              <span aria-hidden="true"><ReceiptText size={19} /></span>
              <div>
                <span>Price Summary</span>
                <h2 id="review-summary-title">Reservation Summary</h2>
              </div>
            </div>

            <dl className="review-price-list">
              <div><dt>Room Rate</dt><dd>{formatRateAmount(roomRate)} / night</dd></div>
              <div><dt>Nights</dt><dd>{nights}</dd></div>
              <div><dt>Rooms</dt><dd>{roomCount}</dd></div>
              <div><dt>Original Room Total</dt><dd>{formatRateAmount(subtotal)}</dd></div>
              {discountSnapshot && <><div><dt>Offer</dt><dd>{discountSnapshot.title} · {discountSnapshot.discountType === "FIXED_AMOUNT" ? `${formatRateAmount(discountSnapshot.discountValue)} OFF` : `${discountSnapshot.discountValue}% OFF`}</dd></div><div><dt>You Save</dt><dd>- LKR {formatLkrNumber(discountAmount)}</dd></div></>}
            </dl>

            <p className="review-calculation">
              {formatRateAmount(roomRate)} × {nights} {nights === 1 ? "night" : "nights"} × {roomCount} {roomCount === 1 ? "room" : "rooms"}
            </p>

            <div className="review-total">
              <span>Final Room Total</span>
              <strong>{formatRateAmount(estimatedTotal)}</strong>
            </div>

            <div className="review-info-panel">
              <Info aria-hidden="true" size={17} />
              <p>Final room availability and reservation details will be verified when the reservation is submitted. No online payment is collected through this system.</p>
            </div>

            <div className="review-actions">
              <button className="review-edit-button" type="button" onClick={handleBackAndEdit}>
                <ArrowLeft aria-hidden="true" size={16} />
                Back &amp; Edit
              </button>
              <button className="review-confirm-button" type="button" disabled={["success", "loading"].includes(confirmationStatus.type)} onClick={handleConfirmReservation}>
                <CircleCheck aria-hidden="true" size={17} />
                Confirm Reservation
              </button>
            </div>

            {confirmationStatus.text && (
              <p
                className={`review-status review-status--${confirmationStatus.type}`}
                role={confirmationStatus.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {confirmationStatus.text}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BookingConfirmation;
