import { useMemo, useState } from "react";
import SavedHotelsContext from "./savedHotelsContext.js";

export function SavedHotelsProvider({ children }) {
  const [savedHotelIds, setSavedHotelIds] = useState([]);

  const value = useMemo(() => ({
    savedHotelIds,
    isHotelSaved: (hotelId) => savedHotelIds.some((id) => String(id) === String(hotelId)),
    saveHotel: (hotelId) => setSavedHotelIds((current) => (
      current.some((id) => String(id) === String(hotelId)) ? current : [...current, hotelId]
    )),
    unsaveHotel: (hotelId) => setSavedHotelIds((current) => (
      current.filter((id) => String(id) !== String(hotelId))
    )),
    toggleSavedHotel: (hotelId) => setSavedHotelIds((current) => (
      current.some((id) => String(id) === String(hotelId))
        ? current.filter((id) => String(id) !== String(hotelId))
        : [...current, hotelId]
    )),
  }), [savedHotelIds]);

  return <SavedHotelsContext.Provider value={value}>{children}</SavedHotelsContext.Provider>;
}
