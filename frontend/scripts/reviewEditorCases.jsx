import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router'
import ReviewEditor from '../src/pages/ReviewEditor/ReviewEditor.jsx'
import HotelsContext from '../src/context/hotelsContext.js'
import RoomsContext from '../src/context/roomsContext.js'
import ReservationsContext from '../src/context/reservationsContext.js'
import CustomerContext from '../src/context/customerContext.js'
import ReviewsContext from '../src/context/reviewsContext.js'
import FeedbackContext from '../src/context/managementFeedbackContext.js'
import { canCustomerEditReview, canCustomerReviewReservation } from '../src/utils/reviewDomain.js'

const reservation = { id: 38, hotelId: 301, customerId: 'guest', status: 'COMPLETED', checkIn: '2026-09-06', checkOut: '2026-09-09', items: [{ roomTypeId: 30101, roomName: 'Booked King Room' }] }
const review = { id: 7, reservationId: 38, customerId: 'guest', status: 'ACTIVE', overallRating: 5, categoryRatings: {}, title: 'Lovely stay', comment: 'The room and service were excellent.', photos: [] }

function render(path, overrides = {}) {
  const reservations = overrides.reservations || [reservation, { ...reservation, id: 39 }]
  const reviews = overrides.reviews || []
  const reviewValue = {
    loading: false, reviewStays: [{ reservationId: 38, hotelName: 'Booked Heritage Hotel', roomName: 'Booked King Room' }],
    getReviewById: (id) => reviews.find((item) => String(item.id) === String(id)),
    canCustomerEditReview,
    canCustomerReviewReservation: (customerId, id) => canCustomerReviewReservation(customerId, id, reservations, reviews),
    ...overrides.reviewContext,
  }
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <CustomerContext.Provider value={{ customer: { id: 'guest', isLoggedIn: true }, loading: false }}>
        <HotelsContext.Provider value={{ hotels: [], hotelsLoading: false }}>
          <RoomsContext.Provider value={{ rooms: [], loading: false }}>
            <ReservationsContext.Provider value={{ reservations, reservationsLoading: Boolean(overrides.loading), reservationsError: '' }}>
              <ReviewsContext.Provider value={reviewValue}>
                <FeedbackContext.Provider value={{ notify() {} }}>
                  <Routes>
                    <Route path="/reviews/write/:reservationId" element={<ReviewEditor />} />
                    <Route path="/reviews/:id/edit" element={<ReviewEditor />} />
                  </Routes>
                </FeedbackContext.Provider>
              </ReviewsContext.Provider>
            </ReservationsContext.Provider>
          </RoomsContext.Provider>
        </HotelsContext.Provider>
      </CustomerContext.Provider>
    </MemoryRouter>,
  )
}

export default function run() {
  // Reproduces the reported screen: completed stay, room absent from public catalog.
  const form = render('/reviews/write/38')
  assert.match(form, /Submit Review/)
  assert.match(form, /Booked Heritage Hotel/)
  assert.match(form, /Booked King Room/)
  assert.doesNotMatch(form, /cannot be edited|Review unavailable/)
  assert.match(render('/reviews/write/38', { loading: true }), /Loading your stay/)
  assert.doesNotMatch(render('/reviews/write/38', { loading: true }), /Review unavailable/)
  assert.match(render('/reviews/write/38', { reviews: [review] }), /already reviewed this stay/)
  assert.match(render('/reviews/write/39', { reviews: [review] }), /Submit Review/)
  assert.match(render('/reviews/write/999'), /requested reservation could not be found/)
  assert.match(render('/reviews/7/edit', { reviews: [review] }), /value="Lovely stay"/)
  assert.match(render('/reviews/7/edit', { reviews: [{ ...review, customerId: 'other' }] }), /cannot be edited/)
  assert.match(render('/reviews/write/38', { reviewContext: { reviewsError: 'Unable to load your reviews.' } }), /Try again/)
  console.log('Review editor route/render regression tests passed')
}
