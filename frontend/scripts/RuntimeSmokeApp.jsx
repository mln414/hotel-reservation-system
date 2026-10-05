import { MemoryRouter } from 'react-router'
import { SavedHotelsProvider } from '../src/context/SavedHotelsContext.jsx'
import { DestinationsProvider } from '../src/context/DestinationsContext.jsx'
import { StayCollectionsProvider } from '../src/context/StayCollectionsContext.jsx'
import { HotelDraftProvider } from '../src/context/HotelDraftContext.jsx'
import { RoomsProvider } from '../src/context/RoomsContext.jsx'
import { PropertyContentProvider } from '../src/context/PropertyContentContext.jsx'
import { RatesProvider } from '../src/context/RatesContext.jsx'
import { HotelsProvider } from '../src/context/HotelsContext.jsx'
import { ReservationsProvider } from '../src/context/ReservationsContext.jsx'
import { ReviewsProvider } from '../src/context/ReviewsContext.jsx'
import { WebsiteContentProvider } from '../src/context/WebsiteContentContext.jsx'
import AppRoutes from '../src/routes/AppRoutes.jsx'
import { ManagementFeedbackProvider } from '../src/context/ManagementFeedbackContext.jsx'
import { CustomerProvider } from '../src/context/CustomerContext.jsx'
import { StaffProvider } from '../src/context/StaffContext.jsx'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import AppErrorBoundary from '../src/components/AppErrorBoundary/AppErrorBoundary.jsx'

export default function RuntimeSmokeApp({ pathname }) {
  return <MemoryRouter initialEntries={[pathname]}><AuthProvider><CustomerProvider><SavedHotelsProvider><DestinationsProvider><StayCollectionsProvider><HotelDraftProvider><RoomsProvider><PropertyContentProvider><RatesProvider><HotelsProvider><ReservationsProvider><ReviewsProvider><WebsiteContentProvider><ManagementFeedbackProvider><StaffProvider><AppErrorBoundary><AppRoutes /></AppErrorBoundary></StaffProvider></ManagementFeedbackProvider></WebsiteContentProvider></ReviewsProvider></ReservationsProvider></HotelsProvider></RatesProvider></PropertyContentProvider></RoomsProvider></HotelDraftProvider></StayCollectionsProvider></DestinationsProvider></SavedHotelsProvider></CustomerProvider></AuthProvider></MemoryRouter>
}
