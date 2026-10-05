import {
  BedDouble,
  CalendarDays,
  CalendarX,
  Eye,
  MapPin,
  Pencil,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import {
  calculateReservationNights,
  formatLkr,
  formatReservationDate,
  pluralizeReservationCount,
} from "../../utils/reservationFormatting.js";
import { canCustomerCancelReservation, canCustomerModifyReservation, getReservationCode } from "../../utils/reservationDomain.js";
import { applyReservationImageFallback, getReservationImage } from "../../utils/reservationMedia.js";
import "./ReservationCard.css";

const statusLabels = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function createReviewUrl(reservationId) { return `/reviews/write/${reservationId}`; }

function ReservationCard({ canReview = false, customerId, hotel, onCancel, onDelete, reservation, review, room }) {
  const hotelName = hotel?.name || "Hotel information unavailable";
  const roomName = room?.name || "Room information unavailable";
  const reservationImage = getReservationImage(hotel, room);
  const nights = calculateReservationNights(
    reservation.checkIn,
    reservation.checkOut,
  );
  const adultCount = Number(reservation.adults) || 0;
  const childCount = Number(reservation.children) || 0;
  const roomCount = Number(reservation.rooms) || 0;
  const statusLabel = statusLabels[reservation.status] || reservation.status;
  const canModify = canCustomerModifyReservation(reservation, customerId);
  const canCancel = canCustomerCancelReservation(reservation, customerId);
  // This list is returned by the authenticated customer endpoint. Ownership is
  // enforced again by the DELETE service, so eligibility here is status-only.
  const canDelete = reservation.status === "CANCELLED";

  return (
    <article className="reservation-card">
      <div className="reservation-card-image">
        {reservationImage ? (
          <img src={reservationImage} onError={(event) => applyReservationImageFallback(event, hotel, room)} alt={`${hotelName}`} />
        ) : (
          <span aria-label="Room image unavailable"><BedDouble aria-hidden="true" size={28} /></span>
        )}
      </div>

      <div className="reservation-card-main">
        <div className="reservation-card-heading">
          <span className="reservation-reference">Reservation #{getReservationCode(reservation)}</span>
          <span className={`reservation-status reservation-status--${reservation.status.toLowerCase()}`}>
            {statusLabel}
          </span>
        </div>
        <h2>{hotelName}</h2>
        <strong className="reservation-room-name">{roomName}</strong>
        {hotel && (
          <p className="reservation-location">
            <MapPin aria-hidden="true" size={14} />
            {hotel.destination}, {hotel.country}
          </p>
        )}

        <dl className="reservation-card-facts">
          <div>
            <CalendarDays aria-hidden="true" size={16} />
            <dt>Stay</dt>
            <dd>{formatReservationDate(reservation.checkIn)} → {formatReservationDate(reservation.checkOut)}</dd>
          </div>
          <div>
            <BedDouble aria-hidden="true" size={16} />
            <dt>Duration</dt>
            <dd>{pluralizeReservationCount(nights, "Night")} · {pluralizeReservationCount(roomCount, "Room")}</dd>
          </div>
          <div>
            <Users aria-hidden="true" size={16} />
            <dt>Guests</dt>
            <dd>
              {pluralizeReservationCount(adultCount, "Adult")}
              {childCount > 0 ? `, ${pluralizeReservationCount(childCount, "Child", "Children")}` : ""}
            </dd>
          </div>
        </dl>
        {reservation.status === "CANCELLED" && (
          <p className="reservation-cancellation-summary">
            Cancelled {reservation.cancelledAt ? `on ${formatReservationDate(reservation.cancelledAt.slice(0, 10))}` : ""}
            {reservation.cancellationReason ? ` · ${reservation.cancellationReason}` : ""}
          </p>
        )}
      </div>

      <div className="reservation-card-side">
        <div className="reservation-card-total">
          <span>Estimated Stay Total</span>
          <strong>{formatLkr(reservation.estimatedTotal)}</strong>
        </div>

        <div className="reservation-card-actions">
          <Link className="reservation-action reservation-action--primary" to={`/reservations/${reservation.id}`}>
            <Eye aria-hidden="true" size={15} />
            View Details
          </Link>

          {(canModify || canCancel) && (
            <>
              {canModify && <Link className="reservation-action" to={`/reservations/${reservation.id}/edit`}>
                <Pencil aria-hidden="true" size={14} />
                Modify
              </Link>}
              {canCancel && <button className="reservation-action reservation-action--danger" type="button" onClick={() => onCancel(reservation)}>
                <CalendarX aria-hidden="true" size={15} />
                Cancel
              </button>}
            </>
          )}

          {canDelete && (
            <button className="reservation-action reservation-action--danger" type="button" onClick={() => onDelete(reservation)}>
              <Trash2 aria-hidden="true" size={15} />
              Permanently Delete
            </button>
          )}

          {review?.status === "ACTIVE" ? (
            <div className="reservation-review-actions">
              <span><Star aria-hidden="true" size={14} fill="currentColor" />Your Review {review.overallRating}/5</span>
              <Link className="reservation-action" to={`/reviews/${review.id}`}>View Review</Link>
              <Link className="reservation-action" to={`/reviews/${review.id}/edit`}>Edit Review</Link>
            </div>
          ) : canReview && (
            <Link className="reservation-action" to={createReviewUrl(reservation.id)}>
              <Star aria-hidden="true" size={14} />
              Write Review
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default ReservationCard;
