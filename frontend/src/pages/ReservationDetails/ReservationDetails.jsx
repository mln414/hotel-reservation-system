import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  MessageSquareText,
  ReceiptText,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import CancelReservationModal from "../../components/CancelReservationModal/CancelReservationModal.jsx";
import ManagementDialog from "../../components/ManagementDialog/ManagementDialog.jsx";
import useHotels from "../../context/useHotels.js";
import useReservations from "../../context/useReservations.js";
import useRooms from "../../context/useRooms.js";
import useReviews from "../../context/useReviews.js";
import { applyReservationImageFallback, getReservationDisplayData, getReservationImage } from "../../utils/reservationMedia.js";
import { getReservationCode, toDateKey } from "../../utils/reservationDomain.js";
import {
  calculateReservationNights,
  formatLkr,
  formatReservationDate,
  pluralizeReservationCount,
} from "../../utils/reservationFormatting.js";
import "./ReservationDetails.css";

const statusLabels = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function getSafeAmount(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback;
}

function ReservationDetails() {
  const { id } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { hotels, publicHotels } = useHotels();
  const { rooms } = useRooms();
  const { reviewStays } = useReviews();
  const { getReservationById, cancelReservation, deleteReservation, reservationsLoading, reservationsError } = useReservations();
  const reservation = getReservationById(id);

  if (reservationsLoading) return <section className="reservation-details-state"><h1>Loading reservation…</h1></section>;
  if (reservationsError) return <section className="reservation-details-state" role="alert"><h1>Unable to load reservation</h1><p>{reservationsError}</p></section>;
  if (!reservation) {
    return (
      <section className="reservation-details-state" aria-labelledby="reservation-details-missing">
        <span className="reservation-details-state-icon" aria-hidden="true"><FileText size={25} /></span>
        <h1 id="reservation-details-missing">Reservation Not Found</h1>
        <p>The reservation you are looking for could not be found.</p>
        <div className="reservation-details-state-actions">
          <Link to="/my-reservations"><ArrowLeft aria-hidden="true" size={16} />Back to My Reservations</Link>
          <Link to="/hotels">Explore Hotels<ChevronRight aria-hidden="true" size={16} /></Link>
        </div>
      </section>
    );
  }

  const { hotel, room } = getReservationDisplayData(reservation, [...publicHotels, ...hotels], rooms, reviewStays);
  const hotelName = hotel?.name || "Hotel information unavailable";
  const roomName = room?.name || "Room information unavailable";
  const overviewImage = getReservationImage(hotel, room);
  const nights = calculateReservationNights(reservation.checkIn, reservation.checkOut);
  const roomCount = getSafeAmount(reservation.rooms);
  const roomRate = getSafeAmount(reservation.roomRate, getSafeAmount(room?.price));
  const calculatedTotal = roomRate * nights * roomCount;
  const estimatedTotal = getSafeAmount(reservation.estimatedTotal, calculatedTotal);
  const status = String(reservation.status || "").toUpperCase();
  const statusLabel = statusLabels[status] || "Status unavailable";
  const isUpcoming = status === "CONFIRMED" && reservation.checkIn > toDateKey();
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const timelineDate = isCancelled
    ? reservation.cancelledAt
    : isCompleted
      ? reservation.completedAt || reservation.checkOut
      : reservation.checkIn;
  const timelineLabel = isCancelled
    ? "Reservation Cancelled"
    : isCompleted
      ? "Stay Completed"
      : "Upcoming Stay";

  return (
    <div className="reservation-details-page">
      <nav className="reservation-details-breadcrumb" aria-label="Breadcrumb">
        <Link to="/my-reservations">My Reservations</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span aria-current="page">{getReservationCode(reservation)}</span>
      </nav>

      <header className="reservation-details-header">
        <div>
          <span>Reservation #{getReservationCode(reservation)}</span>
          <h1>Reservation Details</h1>
        </div>
        <span className={`reservation-details-status reservation-details-status--${status.toLowerCase()}`}>
          {statusLabel}
        </span>
      </header>
      {message && <p className="reservation-feedback" role="status">{message}</p>}

      <div className="reservation-details-layout">
        <main className="reservation-details-main">
          <section className="reservation-details-card reservation-details-overview" aria-labelledby="reservation-details-hotel">
            <div className="reservation-details-image-wrap">
              {overviewImage ? (
                <img src={overviewImage} onError={(event) => applyReservationImageFallback(event, hotel, room)} alt={`${hotelName}`} />
              ) : (
                <span><BedDouble aria-hidden="true" size={34} />Room image unavailable</span>
              )}
            </div>
            <div className="reservation-details-overview-content">
              <span className="reservation-details-eyebrow">Your Stay</span>
              <h2 id="reservation-details-hotel">{hotelName}</h2>
              {hotel && (
                <p className="reservation-details-location">
                  <MapPin aria-hidden="true" size={16} />{hotel.destination}, {hotel.country}
                </p>
              )}
              <div className="reservation-details-room-name">
                <BedDouble aria-hidden="true" size={18} />
                <div><span>Reserved room</span><strong>{roomName}</strong></div>
              </div>
              {room && (
                <div className="reservation-details-room-features">
                  {room.bedType && <span>{room.bedType}</span>}
                  {room.view && <span>{room.view}</span>}
                  {room.size && <span>{room.size}</span>}
                  {room.capacity && <span>Up to {room.capacity} guests</span>}
                </div>
              )}
              <div className="reservation-details-property-links">
                {hotel && <Link to={`/hotels/${hotel.id}`}>View Hotel<ChevronRight aria-hidden="true" size={15} /></Link>}
                {room && <Link to={`/rooms/${room.id}`}>View Room<ChevronRight aria-hidden="true" size={15} /></Link>}
              </div>
            </div>
          </section>

          <section className="reservation-details-card reservation-details-information" aria-labelledby="stay-details-title">
            <div className="reservation-details-section-heading">
              <span aria-hidden="true"><CalendarCheck size={20} /></span>
              <div><span>Booking overview</span><h2 id="stay-details-title">Stay Details</h2></div>
            </div>
            <dl className="reservation-details-facts">
              <div><dt>Check-in</dt><dd>{formatReservationDate(reservation.checkIn)}</dd></div>
              <div><dt>Check-out</dt><dd>{formatReservationDate(reservation.checkOut)}</dd></div>
              <div><dt>Nights</dt><dd>{pluralizeReservationCount(nights, "Night")}</dd></div>
              <div><dt>Adults</dt><dd>{pluralizeReservationCount(reservation.adults, "Adult")}</dd></div>
              <div><dt>Children</dt><dd>{pluralizeReservationCount(reservation.children, "Child", "Children")}</dd></div>
              <div><dt>Rooms</dt><dd>{pluralizeReservationCount(reservation.rooms, "Room")}</dd></div>
            </dl>

            <div className="reservation-details-divider" />

            <div className="reservation-details-section-heading reservation-details-section-heading--compact">
              <span aria-hidden="true"><ReceiptText size={20} /></span>
              <div><span>Reference details</span><h2>Reservation Information</h2></div>
            </div>
            <dl className="reservation-details-facts reservation-details-facts--information">
              <div><dt>Reservation Reference</dt><dd>{getReservationCode(reservation)}</dd></div>
              <div><dt>Created Date</dt><dd>{formatReservationDate(reservation.createdAt)}</dd></div>
              <div><dt>Current Status</dt><dd>{statusLabel}</dd></div>
            </dl>

            <div className="reservation-details-timeline" aria-label="Reservation timeline">
              <div className="is-complete">
                <span aria-hidden="true"><CheckCircle2 size={17} /></span>
                <div><strong>Reservation Created</strong><small>{formatReservationDate(reservation.createdAt)}</small></div>
              </div>
              <i aria-hidden="true" />
              <div className={isUpcoming ? "is-current" : "is-complete"}>
                <span aria-hidden="true">{isCancelled ? <CalendarX size={17} /> : isCompleted ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}</span>
                <div><strong>{timelineLabel}</strong><small>{formatReservationDate(timelineDate)}</small></div>
              </div>
            </div>
          </section>

          <section className="reservation-details-card reservation-details-note" aria-labelledby="special-requests-title">
            <span aria-hidden="true"><MessageSquareText size={20} /></span>
            <div>
              <h2 id="special-requests-title">Special Requests</h2>
              <p>{reservation.specialRequests?.trim() || "No special requests were added."}</p>
            </div>
          </section>

          {isCancelled && (
            <section className="reservation-details-card reservation-details-status-panel reservation-details-status-panel--cancelled" aria-labelledby="cancellation-details-title">
              <span aria-hidden="true"><CalendarX size={21} /></span>
              <div>
                <h2 id="cancellation-details-title">Cancellation Details</h2>
                <dl>
                  <div><dt>Cancelled Date</dt><dd>{formatReservationDate(reservation.cancelledAt)}</dd></div>
                  <div><dt>Reason</dt><dd>{reservation.cancellationReason || "Reason unavailable"}</dd></div>
                </dl>
              </div>
            </section>
          )}

          {isCompleted && reservation.completedAt && (
            <section className="reservation-details-card reservation-details-status-panel reservation-details-status-panel--completed" aria-labelledby="completed-details-title">
              <span aria-hidden="true"><CheckCircle2 size={21} /></span>
              <div><h2 id="completed-details-title">Stay Completed</h2><p>Your stay was completed on {formatReservationDate(reservation.completedAt)}.</p></div>
            </section>
          )}
        </main>

        <aside className="reservation-details-sidebar" aria-label="Reservation summary and actions">
          <div className="reservation-details-summary">
            <div className="reservation-details-summary-heading">
              <span aria-hidden="true"><ReceiptText size={20} /></span>
              <div><span>Price overview</span><h2>Stay Summary</h2></div>
            </div>
            <div className="reservation-details-price-lines">
              <div><span>Room rate</span><strong>{formatLkr(roomRate)}</strong></div>
              <div><span>Length of stay</span><strong>{pluralizeReservationCount(nights, "Night")}</strong></div>
              <div><span>Rooms</span><strong>{reservation.rooms}</strong></div>
            </div>
            <div className="reservation-details-total">
              <span>Estimated Stay Total</span>
              <strong>{formatLkr(estimatedTotal)}</strong>
            </div>
            <p className="reservation-details-summary-note">Based on the room rate and reservation details shown above.</p>

            <div className="reservation-details-actions">
              {isUpcoming && (
                <>
                  <button type="button" className="reservation-details-action-danger" onClick={() => setShowCancelModal(true)}>
                    <CalendarX aria-hidden="true" size={16} />Cancel Reservation
                  </button>
                </>
              )}
              {isCompleted && (
                <Link className="reservation-details-action-primary" to={`/reviews/write/${reservation.id}`}>
                  <Star aria-hidden="true" size={17} />Review Stay
                </Link>
              )}
              {isCancelled && (
                <button type="button" className="reservation-details-action-danger" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 aria-hidden="true" size={16} />Delete Permanently
                </button>
              )}
              <Link className="reservation-details-action-back" to="/my-reservations">
                <ArrowLeft aria-hidden="true" size={16} />Back to My Reservations
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <CancelReservationModal
        reservation={showCancelModal ? reservation : null}
        hotel={hotel}
        room={room}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async ({ reason, note }) => {
          const result = await cancelReservation(reservation.id, { cancellationReason: reason, cancellationNote: note });
          setMessage(result.error || "Reservation cancelled. Availability was released immediately.");
          setShowCancelModal(false);
        }}
      />
      {showDeleteDialog && (
        <ManagementDialog
          danger
          title="Permanently delete this reservation?"
          description="This action cannot be undone."
          onClose={() => setShowDeleteDialog(false)}
          actions={<>
            <button type="button" onClick={() => setShowDeleteDialog(false)}>Cancel</button>
            <button className="danger" type="button" onClick={async () => {
              const result = await deleteReservation(reservation.id);
              if (result.error) {
                setMessage(result.error);
                setShowDeleteDialog(false);
                return;
              }
              navigate("/my-reservations", { replace: true, state: { message: "Reservation permanently deleted." } });
            }}>Delete Permanently</button>
          </>}
        />
      )}
    </div>
  );
}

export default ReservationDetails;
