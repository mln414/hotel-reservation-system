import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  FilePenLine,
  Info,
  MapPin,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import useHotels from "../../context/useHotels.js";
import useReservations from "../../context/useReservations.js";
import useRooms from "../../context/useRooms.js";
import { applyImageFallback, getRoomMainImage } from "../../utils/roomMedia.js";
import { canCustomerModifyReservation, getReservationCode } from "../../utils/reservationDomain.js";
import {
  calculateReservationNights,
  formatLkr,
  formatReservationDate,
  pluralizeReservationCount,
} from "../../utils/reservationFormatting.js";
import "./ModifyReservation.css";

const adultOptions = [1, 2, 3, 4, 5, 6];
const childrenOptions = [0, 1, 2, 3, 4];
const roomOptions = [1, 2, 3, 4, 5];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSafeAmount(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback;
}

function ModifyReservationState({ children, description, title }) {
  return (
    <section className="modify-reservation-state" aria-labelledby="modify-reservation-state-title">
      <span aria-hidden="true"><CircleAlert size={26} /></span>
      <h1 id="modify-reservation-state-title">{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}

function ModifyReservationForm({ hotel, reservation, room }) {
  const { updateReservation } = useReservations();
  const today = formatLocalDate(new Date());
  const originalSpecialRequests = reservation.specialRequests || "";
  const originalNights = calculateReservationNights(reservation.checkIn, reservation.checkOut);
  const roomRate = getSafeAmount(reservation.roomRate, getSafeAmount(room?.price));
  const originalCalculatedTotal = roomRate * originalNights * getSafeAmount(reservation.rooms);
  const originalEstimatedTotal = getSafeAmount(reservation.estimatedTotal, originalCalculatedTotal);

  const [checkIn, setCheckIn] = useState(reservation.checkIn || "");
  const [checkOut, setCheckOut] = useState(reservation.checkOut || "");
  const [adults, setAdults] = useState(Number(reservation.adults) || 1);
  const [children, setChildren] = useState(Number(reservation.children) || 0);
  const [roomCount, setRoomCount] = useState(Number(reservation.rooms) || 1);
  const [specialRequests, setSpecialRequests] = useState(originalSpecialRequests);
  const [errors, setErrors] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState("");

  const nights = useMemo(
    () => calculateReservationNights(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const totalGuests = adults + children;
  const totalCapacity = room ? Number(room.capacity) * roomCount : null;
  const capacityExceeded = totalCapacity !== null && totalGuests > totalCapacity;
  const updatedEstimatedTotal = roomRate * nights * roomCount;
  const normalizedSpecialRequests = specialRequests.trim();
  const hasChanges =
    checkIn !== reservation.checkIn ||
    checkOut !== reservation.checkOut ||
    adults !== Number(reservation.adults) ||
    children !== Number(reservation.children) ||
    roomCount !== Number(reservation.rooms) ||
    normalizedSpecialRequests !== originalSpecialRequests.trim();

  const hotelName = hotel?.name || "Hotel information unavailable";
  const roomName = room?.name || "Room information unavailable";

  const clearErrors = (...fields) => {
    setErrors((current) => {
      const next = { ...current };
      fields.forEach((field) => delete next[field]);
      if (fields.some((field) => ["adults", "children", "rooms"].includes(field))) {
        delete next.capacity;
      }
      return next;
    });
    setSubmissionMessage("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!canCustomerModifyReservation(reservation, 1)) {
      nextErrors.form = "Only upcoming reservations can be modified.";
    }
    if (!checkIn) nextErrors.checkIn = "Check-in date is required.";
    else if (checkIn < today) nextErrors.checkIn = "Check-in date cannot be in the past.";
    if (!checkOut) nextErrors.checkOut = "Check-out date is required.";
    else if (checkIn && checkOut <= checkIn) nextErrors.checkOut = "Check-out must be after check-in.";
    if (adults < 1) nextErrors.adults = "Select at least one adult.";
    if (roomCount < 1) nextErrors.rooms = "Select at least one room.";
    if (capacityExceeded) {
      nextErrors.capacity = "The selected guest count exceeds the capacity of this room type.";
    }
    if (!hasChanges) nextErrors.changes = "No changes have been made.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveChanges = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setSubmissionMessage("Please review the highlighted stay details.");
      return;
    }

    const primary = reservation.items?.[0];
    const result = updateReservation(reservation.id, {
      checkIn, checkOut, adults, children, rooms: roomCount,
      items: primary ? [{ ...primary, quantity: roomCount }] : reservation.items,
      specialRequests: normalizedSpecialRequests,
      totalAmount: updatedEstimatedTotal,
      estimatedTotal: updatedEstimatedTotal,
    });
    if (result.error) {
      setErrors({ form: result.error });
      setSubmissionMessage(result.error);
      return;
    }
    setErrors({});
    setSubmissionMessage("Reservation updated successfully.");
  };

  const renderError = (field) => errors[field] ? (
    <span className="modify-field-error" id={`modify-${field}-error`}>{errors[field]}</span>
  ) : null;

  return (
    <div className="modify-reservation-page">
      <nav className="modify-reservation-breadcrumb" aria-label="Breadcrumb">
        <Link to="/my-reservations">My Reservations</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <Link to={`/reservations/${reservation.id}`}>Reservation Details</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span aria-current="page">Modify Reservation</span>
      </nav>

      <header className="modify-reservation-header">
        <div>
          <span>Reservation #{getReservationCode(reservation)}</span>
          <h1>Modify Reservation</h1>
          <p>Update your stay details before submitting your changes.</p>
        </div>
        <Link to={`/reservations/${reservation.id}`}>
          <ArrowLeft aria-hidden="true" size={16} />Back to Details
        </Link>
      </header>

      <div className="modify-reservation-layout">
        <form id="modify-reservation-form" className="modify-reservation-form" noValidate onSubmit={handleSaveChanges}>
          <section className="modify-reservation-card modify-property-overview" aria-labelledby="modify-property-title">
            <div className="modify-property-image">
              {room?.image ? (
                <img src={getRoomMainImage(room)} onError={applyImageFallback} alt={`${roomName} at ${hotelName}`} />
              ) : (
                <span><BedDouble aria-hidden="true" size={30} />Room image unavailable</span>
              )}
            </div>
            <div className="modify-property-content">
              <span>Selected stay</span>
              <h2 id="modify-property-title">{hotelName}</h2>
              {hotel && <p><MapPin aria-hidden="true" size={15} />{hotel.destination}, {hotel.country}</p>}
              <strong><BedDouble aria-hidden="true" size={16} />{roomName}</strong>
              {room && (
                <div className="modify-room-features">
                  {room.bedType && <span>{room.bedType}</span>}
                  {room.view && <span>{room.view}</span>}
                  {room.size && <span>{room.size}</span>}
                  {room.capacity && <span>Capacity: {room.capacity} guests per room</span>}
                </div>
              )}
              <small>Hotel and room type remain fixed for this modification.</small>
            </div>
          </section>

          <section className="modify-reservation-card modify-form-section" aria-labelledby="modify-stay-details-title">
            <div className="modify-card-heading">
              <span aria-hidden="true"><CalendarDays size={20} /></span>
              <div><h2 id="modify-stay-details-title">Stay Details</h2><p>Edit the dates, guests, and quantity of your selected room type.</p></div>
            </div>

            <div className="modify-fields-grid modify-fields-grid--two">
              <div className="modify-field">
                <label htmlFor="modify-check-in">Check-in <span aria-hidden="true">*</span></label>
                <input
                  id="modify-check-in"
                  name="checkIn"
                  type="date"
                  min={today}
                  value={checkIn}
                  aria-invalid={Boolean(errors.checkIn)}
                  aria-describedby={errors.checkIn ? "modify-checkIn-error" : undefined}
                  onChange={(event) => { setCheckIn(event.target.value); clearErrors("checkIn", "checkOut"); }}
                />
                {renderError("checkIn")}
              </div>
              <div className="modify-field">
                <label htmlFor="modify-check-out">Check-out <span aria-hidden="true">*</span></label>
                <input
                  id="modify-check-out"
                  name="checkOut"
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  aria-invalid={Boolean(errors.checkOut)}
                  aria-describedby={errors.checkOut ? "modify-checkOut-error" : undefined}
                  onChange={(event) => { setCheckOut(event.target.value); clearErrors("checkOut"); }}
                />
                {renderError("checkOut")}
              </div>
            </div>

            <div className="modify-fields-grid modify-fields-grid--three">
              <div className="modify-field">
                <label htmlFor="modify-adults">Adults</label>
                <select
                  id="modify-adults"
                  name="adults"
                  value={adults}
                  aria-invalid={capacityExceeded || Boolean(errors.adults)}
                  onChange={(event) => { setAdults(Number(event.target.value)); clearErrors("adults"); }}
                >
                  {adultOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                {renderError("adults")}
              </div>
              <div className="modify-field">
                <label htmlFor="modify-children">Children</label>
                <select
                  id="modify-children"
                  name="children"
                  value={children}
                  aria-invalid={capacityExceeded}
                  onChange={(event) => { setChildren(Number(event.target.value)); clearErrors("children"); }}
                >
                  {childrenOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <div className="modify-field">
                <label htmlFor="modify-rooms">Rooms</label>
                <select
                  id="modify-rooms"
                  name="rooms"
                  value={roomCount}
                  aria-invalid={capacityExceeded || Boolean(errors.rooms)}
                  aria-describedby={errors.rooms ? "modify-rooms-error" : undefined}
                  onChange={(event) => { setRoomCount(Number(event.target.value)); clearErrors("rooms"); }}
                >
                  {roomOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                {renderError("rooms")}
              </div>
            </div>

            {(capacityExceeded || errors.capacity) && (
              <p className="modify-capacity-error" role="alert">
                The selected guest count exceeds the capacity of this room type.
              </p>
            )}
            <p className="modify-room-note">
              <Info aria-hidden="true" size={15} />
              Rooms means the quantity of this room type. Physical room assignment is handled by the hotel reservation service.
            </p>
          </section>

          <section className="modify-reservation-card modify-form-section" aria-labelledby="modify-special-requests-title">
            <div className="modify-card-heading">
              <span aria-hidden="true"><FilePenLine size={20} /></span>
              <div><h2 id="modify-special-requests-title">Special Requests</h2><p>Add optional notes for the hotel.</p></div>
            </div>
            <div className="modify-field">
              <label htmlFor="modify-special-requests">Special Requests <small>(Optional)</small></label>
              <textarea
                id="modify-special-requests"
                name="specialRequests"
                rows={4}
                maxLength={500}
                value={specialRequests}
                placeholder="Let the hotel know about any special requests for your stay."
                onChange={(event) => { setSpecialRequests(event.target.value); clearErrors("changes"); }}
              />
              <div className="modify-textarea-meta">
                <span>Special requests are subject to hotel confirmation and availability.</span>
                <span>{specialRequests.length}/500</span>
              </div>
            </div>
          </section>

          <div className="modify-form-status" aria-live="polite">
            {!hasChanges && !submissionMessage && <p>No changes have been made.</p>}
            {submissionMessage && <p className={Object.keys(errors).length ? "is-error" : "is-success"}>{submissionMessage}</p>}
          </div>
        </form>

        <aside className="modify-summary" aria-labelledby="modify-summary-title">
          <div className="modify-summary-card">
            <div className="modify-summary-heading">
              <span aria-hidden="true"><CalendarCheck size={20} /></span>
              <div><span>Review changes</span><h2 id="modify-summary-title">Stay Summary</h2></div>
            </div>

            <section className="modify-summary-section modify-summary-section--original" aria-labelledby="original-reservation-title">
              <h3 id="original-reservation-title">Original Reservation</h3>
              <dl>
                <div><dt>Check-in</dt><dd>{formatReservationDate(reservation.checkIn)}</dd></div>
                <div><dt>Check-out</dt><dd>{formatReservationDate(reservation.checkOut)}</dd></div>
                <div><dt>Nights</dt><dd>{pluralizeReservationCount(originalNights, "Night")}</dd></div>
                <div><dt>Guests</dt><dd>{reservation.adults + reservation.children}</dd></div>
                <div><dt>Rooms</dt><dd>{reservation.rooms}</dd></div>
                <div className="modify-summary-total"><dt>Estimated Total</dt><dd>{formatLkr(originalEstimatedTotal)}</dd></div>
              </dl>
            </section>

            <section className="modify-summary-section modify-summary-section--updated" aria-labelledby="updated-reservation-title">
              <h3 id="updated-reservation-title">Your Changes</h3>
              <dl>
                <div className={checkIn !== reservation.checkIn ? "is-changed" : ""}><dt>Check-in</dt><dd>{formatReservationDate(checkIn)}</dd></div>
                <div className={checkOut !== reservation.checkOut ? "is-changed" : ""}><dt>Check-out</dt><dd>{formatReservationDate(checkOut)}</dd></div>
                <div className={nights !== originalNights ? "is-changed" : ""}><dt>Nights</dt><dd>{pluralizeReservationCount(nights, "Night")}</dd></div>
                <div className={totalGuests !== reservation.adults + reservation.children ? "is-changed" : ""}><dt>Guests</dt><dd>{totalGuests}</dd></div>
                <div className={roomCount !== reservation.rooms ? "is-changed" : ""}><dt>Rooms</dt><dd>{roomCount}</dd></div>
                <div className="modify-summary-total"><dt>Updated Estimated Stay Total</dt><dd>{formatLkr(updatedEstimatedTotal)}</dd></div>
              </dl>
            </section>

            <p className="modify-availability-note">
              <Info aria-hidden="true" size={15} />
              Updated dates and room availability will be verified when your changes are submitted.
            </p>

            <div className="modify-actions">
              <button type="submit" form="modify-reservation-form" disabled={!hasChanges}>
                <Save aria-hidden="true" size={16} />Save Changes
              </button>
              <Link to={`/reservations/${reservation.id}`}>
                <ArrowLeft aria-hidden="true" size={16} />Cancel Changes
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ModifyReservation() {
  const { id } = useParams();
  const { hotels } = useHotels();
  const { rooms } = useRooms();
  const { getReservationById } = useReservations();
  const reservation = getReservationById(id);

  if (!reservation) {
    return (
      <ModifyReservationState
        title="Reservation Not Found"
        description="The reservation you are trying to modify could not be found."
      >
        <Link to="/my-reservations"><ArrowLeft aria-hidden="true" size={16} />Back to My Reservations</Link>
      </ModifyReservationState>
    );
  }

  if (!canCustomerModifyReservation(reservation, 1)) {
    return (
      <ModifyReservationState
        title="This reservation cannot be modified."
        description="Only upcoming reservations can be modified."
      >
        <Link to={`/reservations/${reservation.id}`}><ArrowLeft aria-hidden="true" size={16} />Back to Reservation Details</Link>
      </ModifyReservationState>
    );
  }

  const hotel = hotels.find((item) => String(item.id) === String(reservation.hotelId));
  const room = rooms.find((item) => String(item.id) === String(reservation.roomId));

  return <ModifyReservationForm key={reservation.id} hotel={hotel} reservation={reservation} room={room} />;
}

export default ModifyReservation;
