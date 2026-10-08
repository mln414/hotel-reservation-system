import { CalendarCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import useReservations from "../../context/useReservations.js";

import CalendarPicker from "../SearchBar/CalendarPicker.jsx";
import GuestSelect from "../SearchBar/GuestSelect.jsx";
import "../SearchBar/SearchBar.css";
import "./RoomAvailability.css";
import "./RoomAvailabilityEnhancements.css";

const adultOptions = [1, 2, 3, 4, 5, 6, 7, 8].map((value) => ({
  value: String(value),
  label: String(value),
}));
const childrenOptions = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
  value: String(value),
  label: String(value),
}));
const roomOptions = [1, 2, 3, 4, 5].map((value) => ({
  value: String(value),
  label: String(value),
}));

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneDay(dateValue) {
  if (!dateValue) return formatLocalDate(new Date());
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
}

function RoomAvailability({ room }) {
  const location = useLocation();
  const initialParams = new URLSearchParams(location.search);
  const { checkReservationAvailabilityRemote } = useReservations();
  const formRef = useRef(null);
  const [checkIn, setCheckIn] = useState(initialParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(initialParams.get("checkOut") || "");
  const [adults, setAdults] = useState(initialParams.get("adults") || "2");
  const [children, setChildren] = useState(initialParams.get("children") || "0");
  const [roomCount, setRoomCount] = useState(initialParams.get("rooms") || "1");
  const [openPicker, setOpenPicker] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [bookingTarget, setBookingTarget] = useState(null);
  const today = formatLocalDate(new Date());

  useEffect(() => {
    const closePickers = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setOpenPicker(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpenPicker(null);
    };

    document.addEventListener("pointerdown", closePickers);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closePickers);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const clearMessage = () => { setMessage({ type: "", text: "" }); setBookingTarget(null); };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!checkIn) {
      setMessage({ type: "error", text: "Please select a check-in date." });
      return;
    }
    if (!checkOut) {
      setMessage({ type: "error", text: "Please select a check-out date." });
      return;
    }
    if (checkIn < today) {
      setMessage({ type: "error", text: "Check-in date cannot be in the past." });
      return;
    }
    if (checkOut <= checkIn) {
      setMessage({
        type: "error",
        text: "Check-out date must be after check-in date.",
      });
      return;
    }

    const adultCount = Number(adults);
    const childCount = Number(children);
    const selectedRoomCount = Number(roomCount);

    if (adultCount < 1 || selectedRoomCount < 1) {
      setMessage({
        type: "error",
        text: "Please select at least one adult and one room.",
      });
      return;
    }
    const maximumGuests = Number(room.maxGuests ?? room.capacity ?? 0) * selectedRoomCount;
    const adultLimit = Number(room.adultCapacity ?? room.capacity ?? 0) * selectedRoomCount;
    const childLimit = Number(room.childCapacity ?? room.capacity ?? 0) * selectedRoomCount;
    if (adultCount + childCount > maximumGuests || adultCount > adultLimit || childCount > childLimit) {
      setMessage({
        type: "error",
        text: "The selected adults, children or total guests exceed this Room Type's capacity.",
      });
      return;
    }

    setMessage({ type: "info", text: "Checking live availability…" });
    const result = await checkReservationAvailabilityRemote({ hotelId: room.hotelId, roomId: room.id, checkIn, checkOut, quantity: selectedRoomCount });
    if (!result.available) {
      setMessage({ type: "error", text: result.message });
      return;
    }

    const availabilityData = {
      checkIn,
      checkOut,
      adults: adultCount,
      children: childCount,
      rooms: selectedRoomCount,
      offerId: initialParams.get("offerId") || "",
    };

    const bookingParams = new URLSearchParams({ checkIn, checkOut, adults: String(adultCount), children: String(childCount), rooms: String(selectedRoomCount) });
    if (availabilityData.offerId) bookingParams.set("offerId", availabilityData.offerId);
    setBookingTarget({ pathname: `/booking/${room.id}`, search: `?${bookingParams.toString()}`, state: availabilityData });
    setMessage({ type: "success", text: result.message });
  };

  const pickerToggle = (pickerName) => (isOpen) =>
    setOpenPicker(isOpen ? pickerName : null);

  return (
    <section
      className="room-availability-section"
      id="room-availability"
      aria-labelledby="room-availability-title"
    >
      <div className="room-detail-section-heading">
        <span aria-hidden="true">3</span>
        <div>
          <h2 id="room-availability-title">Check Availability</h2>
          <p>Choose dates and guest details for this room type.</p>
        </div>
      </div>

      <form
        ref={formRef}
        className="room-availability-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="room-availability-field">
          <label htmlFor="room-check-in">Check In</label>
          <CalendarPicker
            id="room-check-in"
            name="checkIn"
            value={checkIn}
            minDate={today}
            isOpen={openPicker === "checkIn"}
            onChange={(value) => {
              setCheckIn(value);
              clearMessage();
              if (checkOut && checkOut <= value) setCheckOut("");
            }}
            onToggle={pickerToggle("checkIn")}
          />
        </div>

        <div className="room-availability-field">
          <label htmlFor="room-check-out">Check Out</label>
          <CalendarPicker
            id="room-check-out"
            name="checkOut"
            value={checkOut}
            minDate={addOneDay(checkIn)}
            isOpen={openPicker === "checkOut"}
            onChange={(value) => {
              setCheckOut(value);
              clearMessage();
            }}
            onToggle={pickerToggle("checkOut")}
          />
        </div>

        {[
          ["adults", "Adults", adults, adultOptions, setAdults],
          ["children", "Children", children, childrenOptions, setChildren],
          ["rooms", "Rooms", roomCount, roomOptions, setRoomCount],
        ].map(([name, label, value, options, setter]) => (
          <div className="room-availability-field" key={name}>
            <label htmlFor={`room-${name}`}>{label}</label>
            <GuestSelect
              id={`room-${name}`}
              name={name}
              value={value}
              options={options}
              isOpen={openPicker === name}
              onChange={(nextValue) => {
                setter(nextValue);
                clearMessage();
              }}
              onToggle={pickerToggle(name)}
            />
          </div>
        ))}

        <button className="room-availability-submit" type="submit">
          <CalendarCheck aria-hidden="true" size={17} />
          Check Availability
        </button>

        {message.text && (
          <p
            className={`room-availability-message room-availability-message--${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message.text}
          </p>
        )}
        {bookingTarget && <Link className="room-availability-reserve" to={{ pathname: bookingTarget.pathname, search: bookingTarget.search }} state={bookingTarget.state}>Reserve This Room Type</Link>}
      </form>
    </section>
  );
}

export default RoomAvailability;
