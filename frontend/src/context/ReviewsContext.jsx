import { useCallback, useEffect, useMemo, useState } from 'react'
import ReviewsContext from './reviewsContext.js'
import useReservations from './useReservations.js'
import useCustomer from './useCustomer.js'
import useAuth from './useAuth.js'
import reviewApi from '../services/reviewApi.js'
import {
  canCustomerDeleteReview,
  canCustomerEditReview,
  canCustomerReviewReservation,
  getActiveReviews,
  getHotelAverageRating,
  getHotelCategoryAverages,
  getHotelRatingDistribution,
  getHotelReviewCount,
  getHotelReviews,
  getReviewById,
  getReviewForReservation,
  getReviewsNeedingModerationAttention,
  getUnansweredReviews,
} from '../utils/reviewDomain.js'

function mapBackendReview(item) {
  if (!item) return null
  return {
    id: item.id,
    customerId: item.customerId,
    customerName: item.customerName || item.reviewerName || 'LankaStay Guest',
    reservationId: item.reservationId,
    reservationCode: item.reservationCode,
    hotelId: item.hotelId,
    overallRating: Number(item.overallRating),
    categoryRatings: {
      cleanliness: item.cleanlinessRating,
      comfort: item.comfortRating,
      staffService: item.staffServiceRating,
      facilities: item.facilitiesRating,
      location: item.locationRating,
      value: item.valueForMoneyRating,
    },
    title: item.title || '',
    comment: item.comment || '',
    photos: item.photos || [],
    status: item.status || 'ACTIVE',
    verifiedStay: item.verifiedStay !== false,
    stayMonth: item.stayMonth,
    roomName: item.roomName,
    stayCheckIn: item.stayCheckIn,
    stayCheckOut: item.stayCheckOut,
    managementResponse: item.managementResponse || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt,
    customerUpdatedAt: item.customerUpdatedAt,
    deletedAt: item.deletedAt,
    moderationReason: item.moderationReason,
    moderationNote: item.moderationNote,
    hiddenAt: item.hiddenAt,
  }
}

export function ReviewsProvider({ children }) {
  const { reservations, refreshReservations } = useReservations()
  const { customer } = useCustomer()
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [reviewStays, setReviewStays] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState('')

  const isStaff = Boolean(user && (user.role === 'MANAGER' || user.role === 'HOTEL_STAFF'))
  const customerAccountId = customer?.isLoggedIn ? customer.id : null

  const refreshReviews = useCallback(async () => {
    // Remove private/hidden reviews from the previous account immediately.
    setReviews([])
    setReviewStays([])
    setLoading(true)
    setReviewsError('')
    try {
      if (isStaff) {
        const data = await reviewApi.listManagementReviews()
        if (Array.isArray(data)) {
          setReviews(data.map(mapBackendReview))
          return
        }
      }
      // Public reviews
      const publicData = await reviewApi.listPublicReviews().catch(() => [])
      let combined = Array.isArray(publicData) ? publicData.map(mapBackendReview) : []

      // If customer is logged in, merge their own reviews (including deleted/hidden)
      if (customerAccountId) {
        const [myReviewsResult, eligibleStaysResult] = await Promise.allSettled([
          reviewApi.listMyReviews(),
          reviewApi.listEligibleStays(),
        ])
        if (myReviewsResult.status === 'rejected') throw myReviewsResult.reason
        if (eligibleStaysResult.status === 'rejected') throw eligibleStaysResult.reason
        if (myReviewsResult.status === 'fulfilled') {
          const myReviews = myReviewsResult.value
          if (Array.isArray(myReviews)) {
            const mappedMine = myReviews.map(mapBackendReview)
            const mapById = new Map()
            combined.forEach((r) => mapById.set(String(r.id), r))
            mappedMine.forEach((r) => mapById.set(String(r.id), r))
            combined = Array.from(mapById.values())
          }
        }
        if (eligibleStaysResult.status === 'fulfilled' && Array.isArray(eligibleStaysResult.value)) {
          setReviewStays(eligibleStaysResult.value)
        }
      }
      setReviews(combined)
    } catch (error) {
      setReviewsError(error.message || 'Unable to load your reviews. Please try again.')
      // Fallback empty if backend error
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [isStaff, customerAccountId])

  useEffect(() => {
    refreshReviews()
  }, [refreshReviews])

  const createReview = useCallback(
    async (data) => {
      try {
        const payload = {
          reservationId: Number(data.reservationId),
          overallRating: Number(data.overallRating),
          cleanlinessRating: data.categoryRatings?.cleanliness ? Number(data.categoryRatings.cleanliness) : null,
          comfortRating: data.categoryRatings?.comfort ? Number(data.categoryRatings.comfort) : null,
          staffServiceRating: data.categoryRatings?.staffService ? Number(data.categoryRatings.staffService) : null,
          facilitiesRating: data.categoryRatings?.facilities ? Number(data.categoryRatings.facilities) : null,
          locationRating: data.categoryRatings?.location ? Number(data.categoryRatings.location) : null,
          valueForMoneyRating: data.categoryRatings?.value ? Number(data.categoryRatings.value) : null,
          title: data.title.trim(),
          comment: data.comment.trim(),
          photos: (data.photos || []).slice(0, 5),
        }
        const created = await reviewApi.createReview(payload)
        const mapped = mapBackendReview(created)
        setReviews((prev) => [mapped, ...prev.filter((item) => String(item.id) !== String(mapped.id))])
        setReviewStays((prev) => prev.map((stay) => String(stay.reservationId) === String(mapped.reservationId)
          ? { ...stay, eligible: false, alreadyReviewed: true, reviewId: mapped.id }
          : stay))
        return { review: mapped }
      } catch (err) {
        return { error: err.message || 'CREATE_REVIEW_FAILED' }
      }
    },
    []
  )

  const updateReview = useCallback(
    async (reviewId, customerId, updates) => {
      try {
        const payload = {
          overallRating: Number(updates.overallRating),
          cleanlinessRating: updates.categoryRatings?.cleanliness ? Number(updates.categoryRatings.cleanliness) : null,
          comfortRating: updates.categoryRatings?.comfort ? Number(updates.categoryRatings.comfort) : null,
          staffServiceRating: updates.categoryRatings?.staffService ? Number(updates.categoryRatings.staffService) : null,
          facilitiesRating: updates.categoryRatings?.facilities ? Number(updates.categoryRatings.facilities) : null,
          locationRating: updates.categoryRatings?.location ? Number(updates.categoryRatings.location) : null,
          valueForMoneyRating: updates.categoryRatings?.value ? Number(updates.categoryRatings.value) : null,
          title: updates.title.trim(),
          comment: updates.comment.trim(),
          photos: (updates.photos || []).slice(0, 5),
        }
        const updated = await reviewApi.updateReview(reviewId, payload)
        const mapped = mapBackendReview(updated)
        setReviews((prev) => prev.map((item) => (String(item.id) === String(reviewId) ? mapped : item)))
        return { review: mapped }
      } catch (err) {
        return { error: err.message || 'UPDATE_REVIEW_FAILED' }
      }
    },
    []
  )

  const deleteCustomerReview = useCallback(
    async (reviewId, _customerId) => {
      try {
        await reviewApi.deleteReview(reviewId)
        setReviews((prev) => prev.filter((item) => String(item.id) !== String(reviewId)))
        setReviewStays((prev) => prev.map((stay) => String(stay.reviewId) === String(reviewId)
          ? { ...stay, eligible: true, alreadyReviewed: false, reviewId: null }
          : stay))
        // Re-read the server's eligibility and reservation state after the
        // delete transaction commits; do not rely only on cached review IDs.
        await Promise.allSettled([refreshReviews(), refreshReservations()])
        return { success: true }
      } catch (err) {
        return { error: err.message || 'DELETE_REVIEW_FAILED' }
      }
    },
    [refreshReviews, refreshReservations]
  )

  const hideReviewForModeration = useCallback(
    async (reviewId, { reason, note = '' } = {}) => {
      try {
        const updated = await reviewApi.hideReview(reviewId, { moderationReason: reason, moderationNote: note })
        const mapped = mapBackendReview(updated)
        setReviews((prev) => prev.map((item) => (String(item.id) === String(reviewId) ? mapped : item)))
        return { success: true, review: mapped }
      } catch (err) {
        return { error: err.message || 'HIDE_REVIEW_FAILED' }
      }
    },
    []
  )

  const restoreReview = useCallback(
    async (reviewId) => {
      try {
        const updated = await reviewApi.restoreReview(reviewId)
        const mapped = mapBackendReview(updated)
        setReviews((prev) => prev.map((item) => (String(item.id) === String(reviewId) ? mapped : item)))
        return { success: true, review: mapped }
      } catch (err) {
        return { error: err.message || 'RESTORE_REVIEW_FAILED' }
      }
    },
    []
  )

  const addManagementResponse = useCallback(
    async (reviewId, data) => {
      try {
        const text = data.responseText?.trim()
        if (!text) return { error: 'RESPONSE_REQUIRED' }
        const updated = await reviewApi.addResponse(reviewId, {
          responseText: text,
          responseRole: data.respondedRole || 'Hotel Management',
        })
        const mapped = mapBackendReview(updated)
        setReviews((prev) => prev.map((item) => (String(item.id) === String(reviewId) ? mapped : item)))
        return { response: mapped.managementResponse }
      } catch (err) {
        return { error: err.message || 'ADD_RESPONSE_FAILED' }
      }
    },
    []
  )

  const updateManagementResponse = useCallback(
    async (reviewId, data) => {
      try {
        const text = data.responseText?.trim()
        if (!text) return { error: 'RESPONSE_REQUIRED' }
        const updated = await reviewApi.updateResponse(reviewId, {
          responseText: text,
          responseRole: data.respondedRole || 'Hotel Management',
        })
        const mapped = mapBackendReview(updated)
        setReviews((prev) => prev.map((item) => (String(item.id) === String(reviewId) ? mapped : item)))
        return { success: true }
      } catch (err) {
        return { error: err.message || 'UPDATE_RESPONSE_FAILED' }
      }
    },
    []
  )

  const removeManagementResponse = useCallback(
    async (reviewId) => {
      try {
        await reviewApi.removeResponse(reviewId)
        setReviews((prev) =>
          prev.map((item) =>
            String(item.id) === String(reviewId)
              ? { ...item, managementResponse: null }
              : item
          )
        )
        return { success: true }
      } catch (err) {
        return { error: err.message || 'REMOVE_RESPONSE_FAILED' }
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      reviews,
      reviewStays,
      loading,
      reviewsError,
      refreshReviews,
      createReview,
      updateReview,
      deleteCustomerReview,
      hideReviewForModeration,
      restoreReview,
      addManagementResponse,
      updateManagementResponse,
      removeManagementResponse,
      getReviewById: (reviewId) => getReviewById(reviews, reviewId),
      getReviewForReservation: (reservationId) => getReviewForReservation(reviews, reservationId),
      getActiveReviews: () => getActiveReviews(reviews),
      getHotelReviews: (hotelId, options) => getHotelReviews(reviews, hotelId, options),
      getHotelAverageRating: (hotelId) => getHotelAverageRating(reviews, hotelId),
      getHotelReviewCount: (hotelId) => getHotelReviewCount(reviews, hotelId),
      getHotelRatingDistribution: (hotelId) => getHotelRatingDistribution(reviews, hotelId),
      getHotelCategoryAverages: (hotelId) => getHotelCategoryAverages(reviews, hotelId),
      getReviewEligibleReservations: () => reviewStays
        .filter((stay) => stay.eligible)
        .map((stay) => reservations.find((reservation) => String(reservation.id) === String(stay.reservationId)) || {
          ...stay,
          id: stay.reservationId,
          status: 'COMPLETED',
        }),
      canCustomerReviewReservation: (customerId, reservationId) => {
        if (customerId == null) return canCustomerReviewReservation(customerId, reservationId, reservations, reviews)
        const stay = reviewStays.find((item) => String(item.reservationId) === String(reservationId))
        if (!stay) {
          const reservation = reservations.find((item) => String(item.id) === String(reservationId))
          const existingReview = getReviewForReservation(reviews, reservationId)
          if (!reservation) return { eligible: false, reason: 'NOT_FOUND' }
          if (existingReview) return { eligible: false, reason: 'ALREADY_REVIEWED', review: existingReview }
          return reservation.status === 'COMPLETED'
            ? { eligible: true, reason: 'ELIGIBLE', reservation }
            : { eligible: false, reason: 'NOT_COMPLETED' }
        }
        if (stay.alreadyReviewed) {
          return { eligible: false, reason: 'ALREADY_REVIEWED', review: getReviewById(reviews, stay.reviewId) }
        }
        return stay.eligible
          ? { eligible: true, reason: 'ELIGIBLE', reservation: reservations.find((item) => String(item.id) === String(reservationId)) }
          : { eligible: false, reason: 'NOT_COMPLETED' }
      },
      canCustomerEditReview: (customerId, review) => canCustomerEditReview(customerId, review),
      canCustomerDeleteReview: (customerId, review) => canCustomerDeleteReview(customerId, review),
      getUnansweredReviews: () => getUnansweredReviews(reviews),
      getReviewsNeedingModerationAttention: () => getReviewsNeedingModerationAttention(reviews),
    }),
    [
      reviews,
      reviewStays,
      loading,
      reviewsError,
      refreshReviews,
      reservations,
      createReview,
      updateReview,
      deleteCustomerReview,
      hideReviewForModeration,
      restoreReview,
      addManagementResponse,
      updateManagementResponse,
      removeManagementResponse,
    ]
  )

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}
