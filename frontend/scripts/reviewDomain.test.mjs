import assert from 'node:assert/strict'
import { REVIEW_ELIGIBILITY, REVIEW_STATUS, canCustomerDeleteReview, canCustomerEditReview, canCustomerReviewReservation, getHotelAverageRating, getHotelCategoryAverages, getHotelRatingDistribution, getHotelReviewCount, getManagementReviewSummary, getReviewEligibleReservations, getReviewForReservation } from '../src/utils/reviewDomain.js'

const reservations = [
  { id: 'completed', customerId: 1, hotelId: 10, status: 'COMPLETED' },
  { id: 'upcoming', customerId: 1, hotelId: 10, status: 'CONFIRMED' },
  { id: 'other-owner', customerId: 2, hotelId: 10, status: 'COMPLETED' },
]
const active = { id: 'active', customerId: 1, reservationId: 'completed', hotelId: 10, overallRating: 5, categoryRatings: { cleanliness: 5 }, status: REVIEW_STATUS.ACTIVE }
const hidden = { ...active, id: 'hidden', reservationId: 'hidden-stay', overallRating: 1, status: REVIEW_STATUS.HIDDEN }
const deleted = { ...active, id: 'deleted', reservationId: 'deleted-stay', overallRating: 1, status: REVIEW_STATUS.DELETED }

assert.equal(canCustomerReviewReservation(1, 'completed', reservations, []).eligible, true)
assert.equal(canCustomerReviewReservation(1, 'upcoming', reservations, []).reason, REVIEW_ELIGIBILITY.NOT_COMPLETED)
assert.equal(canCustomerReviewReservation(1, 'other-owner', reservations, []).reason, REVIEW_ELIGIBILITY.NOT_OWNER)
assert.equal(canCustomerReviewReservation(null, 'completed', reservations, []).reason, REVIEW_ELIGIBILITY.NOT_AUTHENTICATED)
assert.equal(canCustomerReviewReservation(1, 'completed', reservations, [active]).reason, REVIEW_ELIGIBILITY.ALREADY_REVIEWED)
assert.deepEqual(getReviewEligibleReservations(1, reservations, []), [reservations[0]])
assert.equal(getReviewForReservation([deleted], 'deleted-stay'), null)
assert.equal(canCustomerEditReview(1, active), true)
assert.equal(canCustomerEditReview(2, active), false)
assert.equal(canCustomerDeleteReview(1, hidden), true)
assert.equal(canCustomerDeleteReview(2, hidden), false)

const aggregate = [active, { ...active, id: 'second', reservationId: 'second-stay', overallRating: 3, categoryRatings: { cleanliness: 3 } }, hidden, deleted]
assert.equal(getHotelReviewCount(aggregate, 10), 2)
assert.equal(getHotelAverageRating(aggregate, 10), 4)
assert.equal(getHotelRatingDistribution(aggregate, 10).find((item) => item.rating === 5).count, 1)
assert.equal(getHotelCategoryAverages(aggregate, 10).cleanliness, 4)

const managementReviews = [
  active,
  { ...active, id: 'hotel-ten-unanswered', reservationId: 'second-stay', overallRating: 3, managementResponse: null },
  { ...hidden, id: 'hotel-ten-hidden' },
  { ...active, id: 'hotel-eleven', hotelId: 11, overallRating: 1, managementResponse: null },
]
assert.deepEqual(getManagementReviewSummary(managementReviews, 10), {
  publishedCount: 2,
  averageRating: 4,
  unansweredCount: 2,
  moderationCount: 1,
})
assert.equal(getManagementReviewSummary(managementReviews).publishedCount, 3)

console.log('Review domain tests passed')
