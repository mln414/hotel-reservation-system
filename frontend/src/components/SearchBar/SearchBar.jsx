import { useEffect, useRef, useState } from "react";
import CalendarPicker from "./CalendarPicker.jsx";
import DestinationAutocomplete from "./DestinationAutocomplete.jsx";
import GuestSelect from "./GuestSelect.jsx";
import "./SearchBar.css";

const adultOptions = ["1", "2", "3", "4", "5+"].map((value) => ({
  value,
  label: value,
}));

const childrenOptions = ["0", "1", "2", "3", "4+"].map((value) => ({
  value,
  label: value,
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

function SearchBar({ initialValues = {}, onSearch = () => {} }) {
  const formRef = useRef(null);
  const [openPicker, setOpenPicker] = useState(null);
  const [destination, setDestination] = useState(initialValues.destination || "");
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || "");
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || "");
  const [adults, setAdults] = useState(String(initialValues.adults || "2"));
  const [children, setChildren] = useState(String(initialValues.children || "0"));
  const [formError, setFormError] = useState("");
  const today = formatLocalDate(new Date());

  useEffect(() => {
    setDestination(initialValues.destination || "");
    setCheckIn(initialValues.checkIn || "");
    setCheckOut(initialValues.checkOut || "");
    setAdults(String(initialValues.adults || "2"));
    setChildren(String(initialValues.children || "0"));
  }, [initialValues.destination, initialValues.checkIn, initialValues.checkOut, initialValues.adults, initialValues.children]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!formRef.current?.contains(event.target)) {
        setOpenPicker(null);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpenPicker(null);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function handleCheckInChange(value) {
    setCheckIn(value);
    setFormError("");

    if (checkOut && checkOut <= value) {
      setCheckOut("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!checkIn || !checkOut) {
      setFormError("Please select both check-in and check-out dates.");
      return;
    }

    setFormError("");
    const formData = new FormData(event.currentTarget);
    onSearch(Object.fromEntries(formData.entries()));
  }

  return (
    <form
      ref={formRef}
      className="booking-search-form"
      aria-label="Search available hotel rooms"
      onSubmit={handleSubmit}
    >
      <div className="search-field search-field--destination">
        <label htmlFor="destination">Destination / Hotel</label>
        <DestinationAutocomplete value={destination} onChange={setDestination} />
      </div>

      <div className="search-field">
        <label htmlFor="checkIn">Check In</label>
        <CalendarPicker
          id="checkIn"
          name="checkIn"
          value={checkIn}
          minDate={today}
          isOpen={openPicker === "checkIn"}
          onChange={handleCheckInChange}
          onToggle={(isOpen) => setOpenPicker(isOpen ? "checkIn" : null)}
        />
      </div>

      <div className="search-field">
        <label htmlFor="checkOut">Check Out</label>
        <CalendarPicker
          id="checkOut"
          name="checkOut"
          value={checkOut}
          minDate={addOneDay(checkIn)}
          isOpen={openPicker === "checkOut"}
          onChange={(value) => {
            setCheckOut(value);
            setFormError("");
          }}
          onToggle={(isOpen) => setOpenPicker(isOpen ? "checkOut" : null)}
        />
      </div>

      <div className="search-field search-field--small">
        <label htmlFor="adults">Adults</label>
        <GuestSelect
          id="adults"
          name="adults"
          value={adults}
          options={adultOptions}
          isOpen={openPicker === "adults"}
          onChange={setAdults}
          onToggle={(isOpen) => setOpenPicker(isOpen ? "adults" : null)}
        />
      </div>

      <div className="search-field search-field--small">
        <label htmlFor="children">Children</label>
        <GuestSelect
          id="children"
          name="children"
          value={children}
          options={childrenOptions}
          isOpen={openPicker === "children"}
          onChange={setChildren}
          onToggle={(isOpen) => setOpenPicker(isOpen ? "children" : null)}
        />
      </div>

      <div className="search-field">
        <label htmlFor="promoCode">Promo Code</label>
        <input
          id="promoCode"
          name="promoCode"
          type="text"
          placeholder="Enter code"
        />
      </div>

      <button className="search-submit-button" type="submit">
        Check Availability
      </button>

      {formError && (
        <p className="search-form-error" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}

export default SearchBar;
