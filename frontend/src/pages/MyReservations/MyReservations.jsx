import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Compass,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";

import CancelReservationModal from "../../components/CancelReservationModal/CancelReservationModal.jsx";
import ManagementDialog from "../../components/ManagementDialog/ManagementDialog.jsx";
import ReservationCard from "../../components/ReservationCard/ReservationCard.jsx";
import useHotels from "../../context/useHotels.js";
import useReservations from "../../context/useReservations.js";
import useRooms from "../../context/useRooms.js";
import useReviews from "../../context/useReviews.js";
import useCustomer from "../../context/useCustomer.js";
import { getReservationDisplayData } from "../../utils/reservationMedia.js";
import "./MyReservations.css";

const reservationTabs = [
  { status: "CONFIRMED", label: "Upcoming", Icon: CalendarDays },
  { status: "COMPLETED", label: "Past", Icon: CircleCheck },
  { status: "CANCELLED", label: "Cancelled", Icon: CircleX },
];

const emptyMessages = {
  CONFIRMED: "No upcoming reservations.",
  COMPLETED: "No completed stays yet.",
  CANCELLED: "No cancelled reservations.",
};

function sortReservationsByStatus(items, status) {
  return [...items].sort((first, second) => {
    if (status === "CONFIRMED") {
      return first.checkIn.localeCompare(second.checkIn);
    }
    if (status === "COMPLETED") {
      const firstDate = first.completedAt || first.checkOut;
      const secondDate = second.completedAt || second.checkOut;
      return secondDate.localeCompare(firstDate);
    }

    return (second.cancelledAt || "").localeCompare(first.cancelledAt || "");
  });
}

function MyReservations() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("CONFIRMED");
  const [cancellationReservation, setCancellationReservation] = useState(null);
  const [deletionReservation, setDeletionReservation] = useState(null);
  const [message, setMessage] = useState(location.state?.message || "");
  const { hotels, publicHotels } = useHotels();
  const { rooms } = useRooms();
  const { customer } = useCustomer();
  const { reservations, reservationsLoading, reservationsError, cancelReservation, deleteReservation } = useReservations();
  const { getReviewForReservation, canCustomerReviewReservation, reviewStays } = useReviews();

  const customerReservations = reservations;
  const customerHotels = useMemo(
    () => [...publicHotels, ...hotels].filter((hotel, index, all) => all.findIndex((item) => String(item.id) === String(hotel.id)) === index),
    [hotels, publicHotels],
  );

  const counts = useMemo(
    () =>
      customerReservations.reduce(
        (summary, reservation) => ({
          ...summary,
          [reservation.status]: (summary[reservation.status] || 0) + 1,
        }),
        {},
      ),
    [customerReservations],
  );

  const visibleReservations = useMemo(
    () =>
      sortReservationsByStatus(
        customerReservations.filter((reservation) => reservation.status === activeTab),
        activeTab,
      ),
    [activeTab, customerReservations],
  );

  const { hotel: cancellationHotel, room: cancellationRoom } = getReservationDisplayData(cancellationReservation, customerHotels, rooms, reviewStays);

  return (
    <div className="my-reservations-page">
      <header className="my-reservations-header">
        <span>My Stays</span>
        <h1>My Reservations</h1>
        <p>View and manage your upcoming stays and reservation history.</p>
      </header>

      <section className="reservation-stats" aria-label="Reservation summary">
        {reservationTabs.map(({ status, label, Icon }) => (
          <article className={`reservation-stat reservation-stat--${status.toLowerCase()}`} key={status}>
            <span aria-hidden="true"><Icon size={20} /></span>
            <div>
              <span>{label}</span>
              <strong>{counts[status] || 0}</strong>
            </div>
          </article>
        ))}
      </section>

      <div className="reservation-tabs" role="tablist" aria-label="Reservation status">
        {reservationTabs.map(({ status, label }) => (
          <button
            id={`reservation-tab-${status.toLowerCase()}`}
            className={activeTab === status ? "reservation-tab reservation-tab--active" : "reservation-tab"}
            key={status}
            type="button"
            role="tab"
            aria-selected={activeTab === status}
            aria-controls="reservation-tab-panel"
            onClick={() => setActiveTab(status)}
          >
            {label}
            <span>{counts[status] || 0}</span>
          </button>
        ))}
      </div>

      <section
        className="reservation-tab-panel"
        id="reservation-tab-panel"
        role="tabpanel"
        aria-labelledby={`reservation-tab-${activeTab.toLowerCase()}`}
      >
        {reservationsLoading ? (
          <div className="reservation-empty-state"><h2>Loading reservations…</h2></div>
        ) : reservationsError ? (
          <div className="reservation-empty-state" role="alert"><h2>Unable to load reservations.</h2><p>{reservationsError}</p></div>
        ) : visibleReservations.length > 0 ? (
          <div className="reservation-list">
            {visibleReservations.map((reservation) => {
              const { hotel, room } = getReservationDisplayData(reservation, customerHotels, rooms, reviewStays);

              return (
                <ReservationCard
                  hotel={hotel}
                  key={reservation.id}
                  reservation={reservation}
                  room={room}
                  review={getReviewForReservation(reservation.id)}
                  canReview={canCustomerReviewReservation(customer.id, reservation.id).eligible}
                  customerId={customer.id}
                  onCancel={setCancellationReservation}
                  onDelete={setDeletionReservation}
                />
              );
            })}
          </div>
        ) : (
          <div className="reservation-empty-state">
            <span aria-hidden="true"><Compass size={25} /></span>
            <h2>{customerReservations.length ? emptyMessages[activeTab] : "You don't have any reservations yet."}</h2>
            <p>Your reservations for this status will appear here.</p>
            {activeTab === "CONFIRMED" && <Link to="/hotels">Explore Hotels</Link>}
          </div>
        )}
      </section>

      {message && <p className="reservation-feedback" role="status">{message}</p>}

      <CancelReservationModal
        hotel={cancellationHotel}
        reservation={cancellationReservation}
        room={cancellationRoom}
        onClose={() => setCancellationReservation(null)}
        onConfirm={async ({ reason, note }) => {
          const result = await cancelReservation(cancellationReservation.id, { cancellationReason: reason, cancellationNote: note });
          setMessage(result.error || "Reservation cancelled. Availability was released immediately.");
          setCancellationReservation(null);
        }}
      />

      {deletionReservation && (
        <ManagementDialog
          danger
          title={`Permanently delete reservation ${deletionReservation.reservationCode || deletionReservation.reference}?`}
          description="This permanently removes the cancelled reservation and its room details from your history. This action cannot be undone."
          onClose={() => setDeletionReservation(null)}
          actions={<>
            <button type="button" onClick={() => setDeletionReservation(null)}>Keep Reservation</button>
            <button className="danger" type="button" onClick={async () => {
              const result = await deleteReservation(deletionReservation.id);
              setMessage(result.error || "Reservation permanently deleted.");
              if (!result.error) setDeletionReservation(null);
            }}>Permanently Delete</button>
          </>}
        />
      )}
    </div>
  );
}

export default MyReservations;
