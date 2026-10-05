import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import App from '../App.jsx'
import Home from '../pages/Home/Home.jsx'
import Destinations from '../pages/Destinations/Destinations.jsx'
import DestinationDetails from '../pages/DestinationDetails/DestinationDetails.jsx'
import Hotels from '../pages/Hotels/Hotels.jsx'
import HotelDetails from '../pages/HotelDetails/HotelDetails.jsx'
import RoomSearch from '../pages/RoomSearch/RoomSearch.jsx'
import RoomDetails from '../pages/RoomDetails/RoomDetails.jsx'
import Booking from '../pages/Booking/Booking.jsx'
import BookingConfirmation from '../pages/BookingConfirmation/BookingConfirmation.jsx'
import MyReservations from '../pages/MyReservations/MyReservations.jsx'
import ReservationDetails from '../pages/ReservationDetails/ReservationDetails.jsx'
import Login from '../pages/Login/Login.jsx'
import Register from '../pages/Register/Register.jsx'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from '../pages/ResetPassword/ResetPassword.jsx'
import Profile from '../pages/Profile/Profile.jsx'
import Reviews from '../pages/Reviews/Reviews.jsx'
import ReviewEditor from '../pages/ReviewEditor/ReviewEditor.jsx'
import Experiences from '../pages/Experiences/Experiences.jsx'
import ExperienceDetails from '../pages/ExperienceDetails/ExperienceDetails.jsx'
import Offers from '../pages/Offers/Offers.jsx'
import OfferDetails from '../pages/OfferDetails/OfferDetails.jsx'
import StaffLogin from '../pages/StaffLogin/StaffLogin.jsx'
import ManagementLayout from '../layouts/ManagementLayout/ManagementLayout.jsx'
import ManagementDashboard from '../pages/ManagementDashboard/ManagementDashboard.jsx'
import StaffManagement from '../pages/StaffManagement/StaffManagement.jsx'
import StaffChangePassword from '../pages/StaffChangePassword/StaffChangePassword.jsx'
import StaffForgotPassword from '../pages/StaffForgotPassword/StaffForgotPassword.jsx'
import StaffResetPassword from '../pages/StaffResetPassword/StaffResetPassword.jsx'
import ManagementAccountSecurity from '../pages/ManagementAccountSecurity/ManagementAccountSecurity.jsx'
import ManageHotels from '../pages/ManageHotels/ManageHotels.jsx'
import CreateHotel from '../pages/CreateHotel/CreateHotel.jsx'
import HotelSetup from '../pages/HotelSetup/HotelSetup.jsx'
import HotelManagementPreview from '../pages/HotelManagementPreview/HotelManagementPreview.jsx'
import ManageDestinations from '../pages/ManageDestinations/ManageDestinations.jsx'
import DestinationForm from '../pages/DestinationForm/DestinationForm.jsx'
import DestinationDetailsManagement from '../pages/DestinationDetailsManagement/DestinationDetailsManagement.jsx'
import ManageRooms from '../pages/ManageRooms/ManageRooms.jsx'
import RoomTypeForm from '../pages/ManageRooms/RoomTypeForm.jsx'
import RoomTypeDetailsManagement from '../pages/ManageRooms/RoomTypeDetailsManagement.jsx'
import RoomInventory from '../pages/ManageRooms/RoomInventory.jsx'
import ManageOffers from '../pages/ManageOffers/ManageOffers.jsx'
import ManageReviews from '../pages/ManageReviews/ManageReviews.jsx'
import ManageRates from '../pages/ManageRates/ManageRates.jsx'
import ReservationManagement from '../pages/ReservationManagement/ReservationManagement.jsx'
import WebsiteContentManagement from '../pages/WebsiteContentManagement/WebsiteContentManagement.jsx'
import StaffProfile from '../pages/StaffProfile/StaffProfile.jsx'
import ManagementProtectedRoute from '../components/ManagementProtectedRoute/ManagementProtectedRoute.jsx'
import useAuth from '../context/useAuth.js'
import useCustomer from '../context/useCustomer.js'

function ManagerPage({ children }) {
  const { user } = useAuth()
  return user?.role === 'MANAGER' ? children : <Navigate to="/management/dashboard" replace />
}

function ReviewManagementGuard({ children }) {
  const { user } = useAuth()
  return (user?.role === 'MANAGER' || user?.role === 'HOTEL_STAFF') ? children : <Navigate to="/management/dashboard" replace />
}

function CustomerProtectedRoute() {
  const { customer, loading } = useCustomer()
  const location = useLocation()

  if (loading) return null
  if (!customer?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="staff/login" element={<StaffLogin />} />
      <Route path="staff/change-password" element={<StaffChangePassword />} />
      <Route path="staff/forgot-password" element={<StaffForgotPassword />} />
      <Route path="staff/reset-password" element={<StaffResetPassword />} />

      <Route element={<ManagementProtectedRoute />}>
      <Route path="management" element={<ManagementLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManagementDashboard />} />
        <Route path="hotels" element={<ManageHotels />} />
        <Route path="hotels/new" element={<CreateHotel />} />
        <Route path="hotels/:id/setup" element={<HotelSetup />} />
        <Route path="hotels/:id/preview" element={<HotelManagementPreview />} />
        <Route path="destinations" element={<ManageDestinations />} />
        <Route path="destinations/new" element={<DestinationForm />} />
        <Route path="destinations/:id" element={<DestinationDetailsManagement />} />
        <Route path="destinations/:id/edit" element={<DestinationForm />} />
        <Route path="rooms" element={<ManageRooms />} />
        <Route path="rooms/new" element={<RoomTypeForm />} />
        <Route path="rooms/:id" element={<RoomTypeDetailsManagement />} />
        <Route path="rooms/:id/edit" element={<RoomTypeForm />} />
        <Route path="rooms/:id/inventory" element={<RoomInventory />} />
        <Route path="reservations" element={<ReservationManagement />} />
        <Route path="reservations/new" element={<ReservationManagement />} />
        <Route path="reservations/availability" element={<ReservationManagement />} />
        <Route path="reservations/calendar" element={<ReservationManagement />} />
        <Route path="reservations/assignments" element={<ReservationManagement />} />
        <Route path="reservations/stay-board" element={<ReservationManagement />} />
        <Route path="reservations/:id" element={<ReservationManagement />} />
        <Route path="reservations/:id/edit" element={<ReservationManagement />} />
        <Route path="rates" element={<ManageRates />} />
        <Route path="offers" element={<ManageOffers />} />
        <Route path="offers/new" element={<ManageOffers />} />
        <Route path="offers/:id" element={<ManageOffers />} />
        <Route path="offers/:id/edit" element={<ManageOffers />} />
        <Route path="reviews" element={<ReviewManagementGuard><ManageReviews /></ReviewManagementGuard>} />
        <Route path="reviews/:id" element={<ReviewManagementGuard><ManageReviews /></ReviewManagementGuard>} />
        <Route path="website-content" element={<WebsiteContentManagement />} />
        <Route path="website-content/home-showcase" element={<WebsiteContentManagement />} />
        <Route path="website-content/hero" element={<WebsiteContentManagement />} />
        <Route path="website-content/featured-hotels" element={<WebsiteContentManagement />} />
        <Route path="website-content/featured-experiences" element={<WebsiteContentManagement />} />
        <Route path="website-content/experiences" element={<WebsiteContentManagement />} />
        <Route path="website-content/experiences/new" element={<WebsiteContentManagement />} />
        <Route path="website-content/experiences/:id/edit" element={<WebsiteContentManagement />} />
        <Route path="website-content/experiences/:id/preview" element={<WebsiteContentManagement />} />
        <Route path="staff" element={<ManagerPage><StaffManagement /></ManagerPage>} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="account/security" element={<ManagementAccountSecurity />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
      </Route>

      <Route element={<App />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:slug" element={<DestinationDetails />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="hotels/:id" element={<HotelDetails />} />
        <Route path="rooms/search" element={<RoomSearch />} />
        <Route path="rooms/:id" element={<RoomDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="reviews/:id" element={<ReviewEditor />} />
        <Route path="experiences" element={<Experiences />} />
        <Route path="experiences/:slug" element={<ExperienceDetails />} />
        <Route path="offers" element={<Offers />} />
        <Route path="offers/:slug" element={<OfferDetails />} />

        {/* Customer Protected Routes: require customer authentication */}
        <Route element={<CustomerProtectedRoute />}>
          <Route path="reviews/write/:reservationId" element={<ReviewEditor />} />
          <Route path="reviews/:id/edit" element={<ReviewEditor />} />
          <Route path="booking/:roomId" element={<Booking />} />
          <Route path="booking-confirmation" element={<BookingConfirmation />} />
          <Route path="my-reservations" element={<MyReservations />} />
          <Route path="reservations/:id" element={<ReservationDetails />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
