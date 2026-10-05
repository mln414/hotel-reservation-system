import { useEffect, useState } from "react";
import "./CalendarPicker.css";

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const displayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function parseDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarPicker({
  id,
  name,
  value,
  minDate,
  isOpen,
  onChange,
  onToggle,
}) {
  const startingDate = parseDateValue(value) ?? parseDateValue(minDate) ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(startingDate.getFullYear(), startingDate.getMonth(), 1),
  );

  useEffect(() => {
    if (!isOpen) return;
    const nextDate = parseDateValue(value) ?? parseDateValue(minDate) ?? new Date();
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [isOpen, value, minDate]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minimumDate = parseDateValue(minDate);
  const selectedDate = parseDateValue(value);
  const todayValue = formatDateValue(new Date());
  const previousMonthLastDay = new Date(year, month, 0);
  const isPreviousMonthDisabled =
    minimumDate && previousMonthLastDay < minimumDate;

  function changeMonth(amount) {
    setVisibleMonth((currentMonth) =>
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1),
    );
  }

  function chooseDate(day) {
    onChange(formatDateValue(new Date(year, month, day)));
    onToggle(false);
  }

  return (
    <div className="custom-picker">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        className="custom-picker-button"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-calendar`}
        onClick={() => onToggle(!isOpen)}
      >
        <span className={value ? "picker-value" : "picker-placeholder"}>
          {selectedDate ? displayDateFormatter.format(selectedDate) : "dd/mm/yyyy"}
        </span>
        <span className="calendar-icon" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={`${id}-calendar`}
          className="calendar-popover"
          role="dialog"
          aria-label="Choose a date"
        >
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-button"
              aria-label="Previous month"
              disabled={isPreviousMonthDisabled}
              onClick={() => changeMonth(-1)}
            >
              &lt;
            </button>
            <strong>{monthFormatter.format(visibleMonth)}</strong>
            <button
              type="button"
              className="calendar-nav-button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              &gt;
            </button>
          </div>

          <div className="calendar-grid" role="grid">
            {weekDays.map((weekDay) => (
              <span className="calendar-weekday" key={weekDay}>
                {weekDay}
              </span>
            ))}

            {Array.from({ length: firstWeekDay }, (_, index) => (
              <span key={`empty-${index}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dateValue = formatDateValue(date);
              const isDisabled = minimumDate && date < minimumDate;
              const isSelected = value === dateValue;
              const isToday = todayValue === dateValue;

              return (
                <button
                  key={dateValue}
                  type="button"
                  className={`calendar-day ${isSelected ? "calendar-day--selected" : ""} ${isToday ? "calendar-day--today" : ""}`}
                  aria-label={displayDateFormatter.format(date)}
                  aria-selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => chooseDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPicker;
