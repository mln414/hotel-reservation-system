export function parseReservationDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatReservationDate(value) {
  const date = parseReservationDate(value);
  if (!date) return "Date unavailable";
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function calculateReservationNights(checkIn, checkOut) {
  const start = parseReservationDate(checkIn);
  const end = parseReservationDate(checkOut);
  if (!start || !end) return 0;

  const nights = (end.getTime() - start.getTime()) / 86400000;
  return Number.isInteger(nights) && nights > 0 ? nights : 0;
}

export function pluralizeReservationCount(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatLkr(value) {
  const amount = Number(value);
  return `LKR ${Number.isFinite(amount) ? amount.toLocaleString("en-LK", { maximumFractionDigits: 0 }) : "0"}`;
}
