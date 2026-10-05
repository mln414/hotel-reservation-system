import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  Hotel,
  Info,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import useHotels from "../../context/useHotels.js";
import useRooms from "../../context/useRooms.js";
import useRates from "../../context/useRates.js";
import useReservations from "../../context/useReservations.js";
import usePropertyContent from "../../context/usePropertyContent.js";
import useCustomer from "../../context/useCustomer.js";
import { calculateOfferDiscount, getBestEligibleOffer, getEligibleOffersForStay, isOfferEligible } from "../../utils/offerEligibility.js";
import { calculateNights, formatStayDate } from "../../utils/reservationDomain.js";
import { formatLkrNumber, formatRateAmount, resolveStayRateQuote } from "../../utils/rateFormatting.js";
import { applyImageFallback, getRoomMainImage } from "../../utils/roomMedia.js";
import { getHotelPolicies } from "../../utils/hotelPolicies.js";
import CalendarPicker from "../../components/SearchBar/CalendarPicker.jsx";
import GuestSelect from "../../components/SearchBar/GuestSelect.jsx";
import "../../components/SearchBar/SearchBar.css";
import "./Booking.css";
import "./BookingEnhancements.css";

const adultOptions = [1, 2, 3, 4, 5, 6].map((value) => ({ value: String(value), label: String(value) }));
const childrenOptions = [0, 1, 2, 3, 4].map((value) => ({ value: String(value), label: String(value) }));
const roomOptions = [1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: String(value) }));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d\s-]+$/;

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addOneDay(value) { const date = value ? new Date(`${value}T12:00:00`) : new Date(); date.setDate(date.getDate() + 1); return formatLocalDate(date); }

function getSafeCount(value, fallback, minimum, maximum) {
  const count = Number(value);
  return Number.isInteger(count) && count >= minimum && count <= maximum
    ? count
    : fallback;
}

function formatDisplayDate(value) {
  return value ? formatStayDate(value) : "Select a date";
}

function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function Booking() {
  const formRef = useRef(null);
  const { customer } = useCustomer();
  const { publicHotels: hotels } = useHotels();
  const { getRoomById } = useRooms();
  const { getCurrentRoomRate } = useRates();
  const { getReservationQuote } = useReservations();
  const { offers } = usePropertyContent();
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const candidateRoom = getRoomById(roomId);
  const room = candidateRoom?.status === 'ACTIVE' ? candidateRoom : null;
  const hotel = room
    ? hotels.find((item) => String(item.id) === String(room.hotelId))
    : null;
  const availability = location.state ?? {};
  const restoredDraft = availability.reservationDraft ?? {};
  const restoredGuest = restoredDraft.guest ?? {};
  const restoredStay = restoredDraft.stay ?? {};
  const today = formatLocalDate(new Date());

  const [firstName, setFirstName] = useState(
    typeof restoredGuest.firstName === "string" ? restoredGuest.firstName : customer.firstName,
  );
  const [lastName, setLastName] = useState(
    typeof restoredGuest.lastName === "string" ? restoredGuest.lastName : customer.lastName,
  );
  const [email, setEmail] = useState(
    typeof restoredGuest.email === "string" ? restoredGuest.email : customer.email,
  );
  const [phone, setPhone] = useState(
    typeof restoredGuest.phone === "string" ? restoredGuest.phone : customer.phone,
  );
  const [checkIn, setCheckIn] = useState(
    typeof restoredStay.checkIn === "string"
      ? restoredStay.checkIn
      : typeof availability.checkIn === "string"
        ? availability.checkIn
        : queryParams.get("checkIn") || "",
  );
  const [checkOut, setCheckOut] = useState(
    typeof restoredStay.checkOut === "string"
      ? restoredStay.checkOut
      : typeof availability.checkOut === "string"
        ? availability.checkOut
        : queryParams.get("checkOut") || "",
  );
  const [adults, setAdults] = useState(() =>
    getSafeCount(restoredStay.adults ?? availability.adults ?? queryParams.get("adults"), 2, 1, 6),
  );
  const [children, setChildren] = useState(() =>
    getSafeCount(restoredStay.children ?? availability.children ?? queryParams.get("children"), 0, 0, 4),
  );
  const [roomCount, setRoomCount] = useState(() =>
    getSafeCount(restoredStay.rooms ?? availability.rooms ?? queryParams.get("rooms"), 1, 1, 5),
  );
  const [specialRequests, setSpecialRequests] = useState(
    typeof restoredDraft.specialRequests === "string"
      ? restoredDraft.specialRequests
      : "",
  );
  const [errors, setErrors] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [openPicker, setOpenPicker] = useState(null);
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [backendQuote, setBackendQuote] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => { const close = (event) => { if (formRef.current && !formRef.current.contains(event.target)) setOpenPicker(null) }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close) }, []);

  const nights = useMemo(
    () => calculateNights(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const currentRate = room ? getCurrentRoomRate(room.id, checkIn ? new Date(`${checkIn}T12:00:00`) : new Date()) : null;
  const stayRateQuote = room && nights > 0 ? resolveStayRateQuote(getCurrentRoomRate, room.id, checkIn, checkOut, roomCount) : null;
  const nightlyRate = Number(stayRateQuote?.averageNightlyRate || currentRate?.amount || 0);
  const totalGuests = adults + children;
  const totalCapacity = room ? room.capacity * roomCount : 0;
  const capacityExceeded = Boolean(room && totalGuests > totalCapacity);
  const subtotal = stayRateQuote?.originalTotal || 0;
  const requestedOfferId = new URLSearchParams(location.search).get("offerId") || availability.offerId;
  const requestedOffer = offers.find((offer) => String(offer.id) === String(requestedOfferId));
  const eligibleOffers = getEligibleOffersForStay(offers, room, checkIn, checkOut, nights, { hotel });
  const eligibleOffer = requestedOfferId
    ? (requestedOffer && isOfferEligible(requestedOffer, { room, hotel, checkIn, checkOut, nights }) ? requestedOffer : null)
    : getBestEligibleOffer(eligibleOffers, { subtotal, nights: nights * roomCount });
  const offerDiscount = calculateOfferDiscount(eligibleOffer, subtotal, nights * roomCount);
  const estimatedTotal = Number(backendQuote?.finalTotal ?? (subtotal - offerDiscount));
  const hotelPolicies = hotel ? getHotelPolicies(hotel) : [];

  useEffect(() => {
    if (!room || !hotel || nights < 1 || !currentRate?.id || !Number.isFinite(Number(currentRate.id))) { setAvailabilityCheck(null); setBackendQuote(null); return undefined; }
    let active = true;
    setAvailabilityLoading(true);
    getReservationQuote({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: Number(currentRate.id),
      checkIn,
      checkOut,
      adults,
      children,
      quantity: roomCount,
      offerId: eligibleOffer?.id ? Number(eligibleOffer.id) : null,
    })
      .then((result) => { if (active) { setAvailabilityCheck(result); setBackendQuote(result.finalTotal != null ? result : null); } })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [room, hotel, nights, checkIn, checkOut, roomCount, adults, children, currentRate?.id, eligibleOffer?.id, getReservationQuote]);

  const clearError = (field) => {
    setErrors((current) => {
      if (!current[field] && !current.capacity) return current;
      const next = { ...current };
      delete next[field];
      if (["adults", "children", "rooms"].includes(field)) delete next.capacity;
      return next;
    });
    setSubmissionMessage("");
  };

  if (!room) {
    return (
      <section className="booking-state" aria-labelledby="booking-room-error-title">
        <span aria-hidden="true"><Hotel size={28} /></span>
        <h1 id="booking-room-error-title">Reservation Cannot Be Started</h1>
        <p>The selected room could not be found.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </section>
    );
  }

  if (!hotel) {
    return (
      <section className="booking-state" aria-labelledby="booking-hotel-error-title">
        <span aria-hidden="true"><Hotel size={28} /></span>
        <h1 id="booking-hotel-error-title">Reservation Cannot Be Started</h1>
        <p>Hotel information for the selected room is unavailable.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </section>
    );
  }

  const validateForm = () => {
    const nextErrors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const phoneDigits = trimmedPhone.replace(/\D/g, "");

    if (!trimmedFirstName) nextErrors.firstName = "First name is required.";
    else if (trimmedFirstName.length > 50) nextErrors.firstName = "Use 50 characters or fewer.";

    if (!trimmedLastName) nextErrors.lastName = "Last name is required.";
    else if (trimmedLastName.length > 50) nextErrors.lastName = "Use 50 characters or fewer.";

    if (!trimmedEmail) nextErrors.email = "Email address is required.";
    else if (!emailPattern.test(trimmedEmail)) nextErrors.email = "Enter a valid email address.";

    if (!trimmedPhone) nextErrors.phone = "Phone number is required.";
    else if (!phonePattern.test(trimmedPhone) || phoneDigits.length < 9 || phoneDigits.length > 15) {
      nextErrors.phone = "Enter a valid phone number using digits, spaces, + or -.";
    }

    if (!checkIn) nextErrors.checkIn = "Check-in date is required.";
    else if (checkIn < today) nextErrors.checkIn = "Check-in date cannot be in the past.";

    if (!checkOut) nextErrors.checkOut = "Check-out date is required.";
    else if (checkIn && checkOut <= checkIn) nextErrors.checkOut = "Check-out must be after check-in.";

    if (adults < 1) nextErrors.adults = "Select at least one adult.";
    if (roomCount < 1) nextErrors.rooms = "Select at least one room.";
    if (!stayRateQuote?.complete) nextErrors.availability = "A valid shared Room Type Rate is required for every night before booking.";
    if (capacityExceeded) {
      nextErrors.capacity = "The selected guest count exceeds the capacity of this room type.";
    }
    if (availabilityLoading) nextErrors.availability = "Checking room availability…";
    else if (availabilityCheck && !availabilityCheck.available) {
      nextErrors.availability = availabilityCheck.message;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setSubmissionMessage("Please review the highlighted reservation details.");
      return;
    }

    const reservationDraft = {
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomId: room.id,
      roomName: room.name,
      guest: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
      stay: {
        checkIn,
        checkOut,
        adults,
        children,
        rooms: roomCount,
        nights,
      },
      specialRequests: specialRequests.trim(),
      roomRate: nightlyRate,
      originalRateSnapshot: { nightlyRate, nightlyRates: stayRateQuote.nightlyRates.map((rate) => Number(rate.amount)), nights, quantity: roomCount, subtotal },
      estimatedTotal,
      appliedOfferId: requestedOfferId || eligibleOffer?.id || null,
      offerDiscountSnapshot: eligibleOffer ? { title: eligibleOffer.title, discountType: eligibleOffer.discountType, discountValue: eligibleOffer.discountValue, amount: offerDiscount } : null,
    };

    navigate("/booking-confirmation", { state: { reservationDraft } });
  };

  const renderError = (field) =>
    errors[field] ? (
      <span className="booking-field-error" id={`${field}-error`}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <div className="booking-page">
      <nav className="booking-breadcrumb" aria-label="Breadcrumb">
        <Link to="/hotels">Hotels</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <Link to={`/hotels/${hotel.id}`}>{hotel.name}</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <Link to={`/rooms/${room.id}`}>{room.name}</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <span aria-current="page">Reservation</span>
      </nav>

      <header className="booking-header">
        <div>
          <span className="booking-eyebrow">LankaStay Reservation</span>
          <h1>Complete Your Reservation</h1>
          <p>Enter your guest details and review your stay before continuing.</p>
        </div>
        <Link className="booking-back-link" to={`/rooms/${room.id}`}>
          <ArrowLeft aria-hidden="true" size={16} />
          Back to Room
        </Link>
      </header>

      <ol className="booking-progress" aria-label="Reservation progress"><li aria-current="step"><span>1</span>Details</li><li><span>2</span>Review</li><li><span>3</span>Confirmation</li></ol>

      <div className="booking-layout">
        <form ref={formRef} id="reservation-form" className="booking-form" noValidate onSubmit={handleSubmit}>
          <section className="booking-form-card" aria-labelledby="guest-details-title">
            <div className="booking-card-heading">
              <span aria-hidden="true"><UserRound size={19} /></span>
              <div>
                <h2 id="guest-details-title">Guest Details</h2>
                <p>Details for the primary guest on this reservation.</p>
              </div>
            </div>

            <div className="booking-fields-grid booking-fields-grid--two">
              <div className="booking-field">
                <label htmlFor="firstName">First Name <span aria-hidden="true">*</span></label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  maxLength={50}
                  value={firstName}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  onChange={(event) => { setFirstName(event.target.value); clearError("firstName"); }}
                />
                {renderError("firstName")}
              </div>
              <div className="booking-field">
                <label htmlFor="lastName">Last Name <span aria-hidden="true">*</span></label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  maxLength={50}
                  value={lastName}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  onChange={(event) => { setLastName(event.target.value); clearError("lastName"); }}
                />
                {renderError("lastName")}
              </div>
              <div className="booking-field">
                <label htmlFor="email">Email Address <span aria-hidden="true">*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  onChange={(event) => { setEmail(event.target.value); clearError("email"); }}
                />
                {renderError("email")}
              </div>
              <div className="booking-field">
                <label htmlFor="phone">Phone Number <span aria-hidden="true">*</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0712345678 or +94712345678"
                  value={phone}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  onChange={(event) => { setPhone(event.target.value); clearError("phone"); }}
                />
                {renderError("phone")}
              </div>
            </div>
          </section>

          <section className="booking-form-card" aria-labelledby="stay-details-title">
            <div className="booking-card-heading">
              <span aria-hidden="true"><CalendarDays size={19} /></span>
              <div>
                <h2 id="stay-details-title">Stay Details</h2>
                <p>You can review or edit the details passed from room availability.</p>
              </div>
            </div>

            <div className="booking-fields-grid booking-fields-grid--two">
              <div className="booking-field">
                <label htmlFor="checkIn">Check-in <span aria-hidden="true">*</span></label>
                <CalendarPicker
                  id="checkIn"
                  name="checkIn"
                  minDate={today}
                  isOpen={openPicker === 'checkIn'}
                  value={checkIn}
                  aria-invalid={Boolean(errors.checkIn)}
                  aria-describedby={errors.checkIn ? "checkIn-error" : undefined}
                  onChange={(value) => { setCheckIn(value); if (checkOut && checkOut <= value) setCheckOut(''); clearError("checkIn"); clearError("checkOut"); }}
                  onToggle={(isOpen) => setOpenPicker(isOpen ? 'checkIn' : null)}
                />
                {renderError("checkIn")}
              </div>
              <div className="booking-field">
                <label htmlFor="checkOut">Check-out <span aria-hidden="true">*</span></label>
                <CalendarPicker
                  id="checkOut"
                  name="checkOut"
                  minDate={addOneDay(checkIn)}
                  isOpen={openPicker === 'checkOut'}
                  value={checkOut}
                  aria-invalid={Boolean(errors.checkOut)}
                  aria-describedby={errors.checkOut ? "checkOut-error" : undefined}
                  onChange={(value) => { setCheckOut(value); clearError("checkOut"); }}
                  onToggle={(isOpen) => setOpenPicker(isOpen ? 'checkOut' : null)}
                />
                {renderError("checkOut")}
              </div>
            </div>

            <div className="booking-fields-grid booking-fields-grid--three">
              <div className="booking-field">
                <label htmlFor="adults">Adults</label>
                <GuestSelect id="adults" name="adults" value={String(adults)} options={adultOptions} isOpen={openPicker === 'adults'} onChange={(value) => { setAdults(Number(value)); clearError("adults"); }} onToggle={(isOpen) => setOpenPicker(isOpen ? 'adults' : null)} />
                {renderError("adults")}
              </div>
              <div className="booking-field">
                <label htmlFor="children">Children</label>
                <GuestSelect id="children" name="children" value={String(children)} options={childrenOptions} isOpen={openPicker === 'children'} onChange={(value) => { setChildren(Number(value)); clearError("children"); }} onToggle={(isOpen) => setOpenPicker(isOpen ? 'children' : null)} />
              </div>
              <div className="booking-field">
                <label htmlFor="rooms">Rooms</label>
                <GuestSelect id="rooms" name="rooms" value={String(roomCount)} options={roomOptions} isOpen={openPicker === 'rooms'} onChange={(value) => { setRoomCount(Number(value)); clearError("rooms"); }} onToggle={(isOpen) => setOpenPicker(isOpen ? 'rooms' : null)} />
                {renderError("rooms")}
              </div>
            </div>

            {(capacityExceeded || errors.capacity) && (
              <p className="booking-capacity-error" role="alert">
                The selected guest count exceeds the capacity of this room type.
              </p>
            )}
            {availabilityLoading && <p className="booking-info-note" role="status">Checking room availability…</p>}
            {!availabilityLoading && availabilityCheck && (
              <p className={availabilityCheck.available ? "booking-info-note" : "booking-capacity-error"} role={availabilityCheck.available ? "status" : "alert"}>
                {availabilityCheck.available ? availabilityCheck.message : `Sold Out for Selected Dates. ${availabilityCheck.message}`}
              </p>
            )}
            <p className="booking-info-note">
              <Info aria-hidden="true" size={15} />
              Final room availability will be verified when the reservation is submitted.
            </p>
          </section>

          <section className="booking-form-card" aria-labelledby="special-requests-title">
            <div className="booking-card-heading">
              <span aria-hidden="true"><Clock3 size={19} /></span>
              <div>
                <h2 id="special-requests-title">Special Requests</h2>
                <p>Optional details the hotel should know about your stay.</p>
              </div>
            </div>
            <div className="booking-field">
              <label htmlFor="specialRequests">Special Requests <small>(Optional)</small></label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                rows={4}
                maxLength={500}
                placeholder="Let the hotel know about any special requests for your stay."
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
              />
              <div className="booking-textarea-meta">
                <span>Special requests are subject to hotel confirmation and availability.</span>
                <span>{specialRequests.length}/500</span>
              </div>
            </div>
          </section>

          <p className="booking-submit-status" role="alert" aria-live="polite">
            {submissionMessage}
          </p>
        </form>

        <aside className="booking-summary" aria-labelledby="booking-summary-title">
          <div className="booking-summary-card">
            <div className="booking-summary-image">
              <img src={getRoomMainImage(room)} onError={applyImageFallback} alt={`${room.name} at ${hotel.name}`} />
            </div>
            <div className="booking-summary-property">
              <span>Reservation Summary</span>
              <h2 id="booking-summary-title">{hotel.name}</h2>
              <strong>{room.name}</strong>
              <p><MapPin aria-hidden="true" size={14} />{hotel.destination}, {hotel.country}</p>
            </div>

            <dl className="booking-summary-stay">
              <div><dt>Check-in</dt><dd>{formatDisplayDate(checkIn)}</dd></div>
              <div><dt>Check-out</dt><dd>{formatDisplayDate(checkOut)}</dd></div>
              <div><dt>Nights</dt><dd>{pluralize(nights, "Night")}</dd></div>
              <div><dt>Guests</dt><dd>{pluralize(adults, "Adult")} · {pluralize(children, "Child", "Children")}</dd></div>
              <div><dt>Rooms</dt><dd>{pluralize(roomCount, "Room")}</dd></div>
            </dl>

            <div className="booking-summary-price">
              <div><span>{stayRateQuote?.nightlyRates.some((rate) => Number(rate.amount) !== Number(stayRateQuote.nightlyRates[0]?.amount)) ? "Average Room Rate" : "Room Rate"}</span><strong>{nightlyRate ? `${formatRateAmount(nightlyRate)} / room / night` : "Rate unavailable"}</strong></div>
              <div><span>Nights</span><strong>{nights}</strong></div>
              <div><span>Rooms</span><strong>{roomCount}</strong></div>
              <div><span>Original Room Total</span><strong>{formatRateAmount(subtotal)}</strong></div>
              {stayRateQuote?.nightlyRates?.length > 0 && <details className="booking-nightly-breakdown"><summary>View nightly Rate breakdown</summary>{stayRateQuote.nightlyRates.map((rate) => <div key={rate.date}><span>{formatDisplayDate(rate.date)}</span><strong>{formatRateAmount(rate.amount)} × {roomCount}</strong></div>)}</details>}
              {eligibleOffer && <><div><span>Offer</span><strong>{eligibleOffer.title} · {eligibleOffer.discountType === "FIXED_AMOUNT" ? `${formatRateAmount(eligibleOffer.discountValue)} OFF` : `${eligibleOffer.discountValue}% OFF`}</strong></div><div><span>You Save</span><strong>- LKR {formatLkrNumber(offerDiscount)}</strong></div></>}
              {requestedOfferId && !eligibleOffer && <div className="booking-summary-offer-warning"><span>Requested Offer</span><strong>Not eligible for this stay</strong></div>}
              <div className="booking-summary-total">
                <span>Estimated Stay Total</span>
                <strong>{formatRateAmount(estimatedTotal)}</strong>
              </div>
            </div>

            {hotelPolicies.length > 0 && <div className="booking-policy-summary"><strong>Important Hotel Policies</strong>{hotelPolicies.slice(0, 3).map(([id, policy]) => <p key={id}><span>{policy.title}</span>{policy.summary}</p>)}<Link to={`/hotels/${hotel.id}#policies`}>View all Hotel policies</Link></div>}

            <button className="booking-continue-button" type="submit" form="reservation-form" disabled={availabilityLoading || Boolean(availabilityCheck && !availabilityCheck.available)}>
              Continue Reservation
              <ChevronRight aria-hidden="true" size={17} />
            </button>
            <p className="booking-trust-note">
              <ShieldCheck aria-hidden="true" size={15} />
              No payment is collected on this page. Reservation details will be verified before confirmation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Booking;
