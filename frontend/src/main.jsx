import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import AppRoutes from './routes/AppRoutes.jsx'
import { SavedHotelsProvider } from './context/SavedHotelsContext.jsx'
import { HotelsProvider } from './context/HotelsContext.jsx'
import { DestinationsProvider } from './context/DestinationsContext.jsx'
import { RoomsProvider } from './context/RoomsContext.jsx'
import { PropertyContentProvider } from './context/PropertyContentContext.jsx'
import { RatesProvider } from './context/RatesContext.jsx'
import { ReservationsProvider } from './context/ReservationsContext.jsx'
import { WebsiteContentProvider } from './context/WebsiteContentContext.jsx'
import { StayCollectionsProvider } from './context/StayCollectionsContext.jsx'
import { HotelDraftProvider } from './context/HotelDraftContext.jsx'
import { ManagementFeedbackProvider } from './context/ManagementFeedbackContext.jsx'
import { ReviewsProvider } from './context/ReviewsContext.jsx'
import { CustomerProvider } from './context/CustomerContext.jsx'
import { StaffProvider } from './context/StaffContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AppErrorBoundary from './components/AppErrorBoundary/AppErrorBoundary.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><CustomerProvider><SavedHotelsProvider>
        <DestinationsProvider>
          <StayCollectionsProvider>
          <HotelDraftProvider>
          <RoomsProvider>
            <PropertyContentProvider>
              <RatesProvider>
                <HotelsProvider><ReservationsProvider><ReviewsProvider><WebsiteContentProvider><ManagementFeedbackProvider><StaffProvider><AppErrorBoundary><AppRoutes /></AppErrorBoundary></StaffProvider></ManagementFeedbackProvider></WebsiteContentProvider></ReviewsProvider></ReservationsProvider></HotelsProvider>
              </RatesProvider>
            </PropertyContentProvider>
          </RoomsProvider>
          </HotelDraftProvider>
          </StayCollectionsProvider>
        </DestinationsProvider>
      </SavedHotelsProvider></CustomerProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
