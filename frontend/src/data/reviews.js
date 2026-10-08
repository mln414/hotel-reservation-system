// Development-session seed. Every public review is linked to an actual completed reservation.
export const reviews = [
  {
    id: 'review-res-1007', customerId: 1, reservationId: 'res-1007', hotelId: 302,
    overallRating: 5,
    categoryRatings: { cleanliness: 5, comfort: 5, staffService: 5, facilities: 4, location: 5, value: 4 },
    title: 'Wonderful coastal stay',
    comment: 'Beautiful location, thoughtful service and a very comfortable suite. The ocean view made the stay especially memorable.',
    photos: [], status: 'ACTIVE', managementResponse: null,
    createdAt: '2026-08-02T09:30:00.000Z', updatedAt: '2026-08-02T09:30:00.000Z', customerUpdatedAt: '2026-08-02T09:30:00.000Z',
    deletedAt: null, moderatedAt: null, moderatedBy: null, moderationReason: null, moderationNote: '',
  },
]

export default reviews
