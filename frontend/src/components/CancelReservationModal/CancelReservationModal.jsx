import { CalendarX, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ManagementSelect from "../ManagementSelect/ManagementSelect.jsx";

import { formatReservationDate } from "../../utils/reservationFormatting.js";
import "./CancelReservationModal.css";

const cancellationReasons = [
  "Change of travel plans",
  "Date change required",
  "Found another accommodation",
  "Personal reasons",
  "Unable to travel",
  "Other",
];

function CancelReservationModal({ hotel, onClose, onConfirm, reservation, room }) {
  const closeButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!reservation) return undefined;

    previouslyFocusedElementRef.current = document.activeElement;
    setCancellationReason("");
    setOtherReason("");
    setAdditionalDetails("");
    setErrors({});
    setStatus("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [reservation, onClose]);

  if (!reservation) return null;

  const hotelName = hotel?.name || "Hotel information unavailable";
  const roomName = room?.name || "Room information unavailable";
  const isEligible = reservation.status === "CONFIRMED";

  const clearFieldError = (field) => {
    setErrors((current) => {
      if (!current[field] && !current.eligibility) return current;
      const next = { ...current };
      delete next[field];
      delete next.eligibility;
      return next;
    });
    setStatus("");
  };

  const handleRequestCancellation = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const trimmedOtherReason = otherReason.trim();

    if (!reservation || !isEligible) {
      nextErrors.eligibility = "This reservation is not eligible for cancellation.";
    }
    if (!cancellationReason) {
      nextErrors.cancellationReason = "Select a cancellation reason before continuing.";
    }
    if (cancellationReason === "Other" && trimmedOtherReason.length < 5) {
      nextErrors.otherReason = "Please provide a reason using at least 5 characters.";
    }

    setErrors(nextErrors);
    setStatus("");
    if (Object.keys(nextErrors).length > 0) return;

    onConfirm?.({
      reason: cancellationReason === "Other" ? trimmedOtherReason : cancellationReason,
      note: additionalDetails.trim(),
    });
  };

  return (
    <div
      className="cancel-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        aria-describedby="cancel-modal-description"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && event.target.closest('.management-select')?.querySelector('[aria-expanded="true"]')) {
            event.stopPropagation();
          }
        }}
      >
        <button
          ref={closeButtonRef}
          className="cancel-modal-close"
          type="button"
          aria-label="Close cancellation dialog"
          onClick={onClose}
        >
          <X aria-hidden="true" size={19} />
        </button>

        <div className="cancel-modal-heading">
          <span aria-hidden="true"><CalendarX size={21} /></span>
          <div>
            <span>Cancellation Request</span>
            <h2 id="cancel-modal-title">Cancel Reservation?</h2>
          </div>
        </div>
        <p className="cancel-modal-description" id="cancel-modal-description">
          Please review the reservation and tell us why you would like to cancel.
        </p>

        <div className="cancel-modal-reservation" aria-label="Reservation summary">
          <span>Reservation #{reservation.reference}</span>
          <strong>{hotelName}</strong>
          <small>{roomName}</small>
          <p>{formatReservationDate(reservation.checkIn)} <span aria-hidden="true">–</span> {formatReservationDate(reservation.checkOut)}</p>
        </div>

        {!isEligible ? (
          <div className="cancel-modal-ineligible" role="alert">
            <CalendarX aria-hidden="true" size={18} />
            <div><strong>This reservation is not eligible for cancellation.</strong><p>Only upcoming reservations can submit a cancellation request.</p></div>
          </div>
        ) : status ? (
          <div className="cancel-modal-ready" role="status" aria-live="polite">
            <span aria-hidden="true"><Info size={19} /></span>
            <strong>{status}</strong>
            <p>The reservation status and availability have been updated.</p>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="cancel-modal-form" noValidate onSubmit={handleRequestCancellation}>
            <div className="cancel-modal-field">
              <ManagementSelect
                label="Cancellation Reason"
                required
                value={cancellationReason}
                options={[{ value: '', label: 'Select a reason' }, ...cancellationReasons.map((item) => ({ value: item, label: item }))]}
                error={errors.cancellationReason}
                onChange={(value) => {
                  setCancellationReason(value);
                  setOtherReason("");
                  setAdditionalDetails("");
                  clearFieldError("cancellationReason");
                  clearFieldError("otherReason");
                }}
              />
            </div>

            {cancellationReason === "Other" ? (
              <div className="cancel-modal-field">
                <label htmlFor="other-cancellation-reason">Please provide a reason <span aria-hidden="true">*</span></label>
                <textarea
                  id="other-cancellation-reason"
                  name="otherReason"
                  rows={3}
                  minLength={5}
                  maxLength={300}
                  placeholder="Tell us why you need to cancel."
                  value={otherReason}
                  aria-invalid={Boolean(errors.otherReason)}
                  aria-describedby={errors.otherReason ? "other-reason-error" : undefined}
                  onChange={(event) => { setOtherReason(event.target.value); clearFieldError("otherReason"); }}
                />
                <div className="cancel-modal-field-meta">
                  {errors.otherReason ? <span className="cancel-modal-field-error" id="other-reason-error">{errors.otherReason}</span> : <span>Minimum 5 characters</span>}
                  <span>{otherReason.length} / 300</span>
                </div>
              </div>
            ) : cancellationReason ? (
              <div className="cancel-modal-field">
                <label htmlFor="cancellation-additional-details">Additional Details <small>(Optional)</small></label>
                <textarea
                  id="cancellation-additional-details"
                  name="additionalDetails"
                  rows={3}
                  maxLength={300}
                  placeholder="Share any additional details."
                  value={additionalDetails}
                  onChange={(event) => setAdditionalDetails(event.target.value)}
                />
                <div className="cancel-modal-field-meta cancel-modal-field-meta--end"><span>{additionalDetails.length} / 300</span></div>
              </div>
            ) : null}

            {errors.eligibility && <p className="cancel-modal-error" role="alert">{errors.eligibility}</p>}

            <p className="cancel-modal-note">
              <Info aria-hidden="true" size={16} />
              <span>Cancellation keeps the reservation in your history and immediately releases its room-type inventory.</span>
            </p>

            <div className="cancel-modal-actions">
              <button type="button" onClick={onClose}>Keep Reservation</button>
              <button type="submit"><CalendarX aria-hidden="true" size={16} />Confirm Cancellation</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default CancelReservationModal;
