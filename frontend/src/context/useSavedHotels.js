import { useContext } from "react";

import SavedHotelsContext from "./savedHotelsContext.js";

export default function useSavedHotels() {
  const context = useContext(SavedHotelsContext);
  if (!context) throw new Error("useSavedHotels must be used within SavedHotelsProvider.");
  return context;
}
