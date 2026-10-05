// One-session seed data for ReservationsContext. Cross-user concurrency belongs to the future backend.
export const reservations = [
  {
    id: 'res-1024', reservationCode: 'LS-2026-01024', reference: 'LS-2026-01024', customerId: 1,
    hotelId: 302, checkIn: '2026-08-10', checkOut: '2026-08-13', estimatedArrivalTime: '14:30', expectedDepartureTime: '11:00',
    adults: 2, children: 0, guest: { name: 'Kavinada Lakshan', email: 'kavinada@example.com', phone: '+94 77 123 4567' },
    items: [{ roomTypeId: 30201, quantity: 1, rateId: 'legacy-rate-30201', nightlyRateSnapshot: 48000, assignedPhysicalRoomIds: ['pr-201'] }],
    roomId: 30201, roomTypeId: 30201, rooms: 1, roomRate: 48000, totalAmount: 144000, estimatedTotal: 144000,
    appliedOfferId: null, offerDiscountSnapshot: null, status: 'CONFIRMED', source: 'CUSTOMER', createdBy: 'customer:1',
    createdAt: '2026-08-02T09:30:00.000Z', updatedAt: '2026-08-02T09:30:00.000Z', specialRequests: 'High floor if available',
  },
  {
    id: 'res-1025', reservationCode: 'LS-2026-01025', reference: 'LS-2026-01025', customerId: 2,
    hotelId: 302, checkIn: '2026-08-10', checkOut: '2026-08-12', estimatedArrivalTime: '15:00', expectedDepartureTime: '11:00',
    adults: 4, children: 1, guest: { name: 'Amaya Perera', email: 'amaya@example.com', phone: '+94 71 555 0123' },
    items: [{ roomTypeId: 30202, quantity: 2, rateId: 'legacy-rate-30202', nightlyRateSnapshot: 62000, assignedPhysicalRoomIds: [] }],
    roomId: 30202, roomTypeId: 30202, rooms: 2, roomRate: 62000, totalAmount: 248000, estimatedTotal: 248000,
    status: 'CONFIRMED', source: 'RECEPTIONIST', createdBy: 'staff:preview', createdAt: '2026-08-04T07:10:00.000Z', updatedAt: '2026-08-04T07:10:00.000Z',
  },
  {
    id: 'res-1026', reservationCode: 'LS-2026-01026', reference: 'LS-2026-01026', customerId: 1,
    hotelId: 302, checkIn: '2026-08-15', checkOut: '2026-08-18', estimatedArrivalTime: '14:00', expectedDepartureTime: '11:00',
    adults: 2, children: 0, guest: { name: 'Kavinada Lakshan', email: 'kavinada@example.com', phone: '+94 77 123 4567' },
    items: [{ roomTypeId: 30201, quantity: 1, rateId: 'legacy-rate-30201', nightlyRateSnapshot: 48000, assignedPhysicalRoomIds: ['pr-201'] }],
    roomId: 30201, roomTypeId: 30201, rooms: 1, roomRate: 48000, totalAmount: 144000, estimatedTotal: 144000,
    status: 'CONFIRMED', source: 'CUSTOMER', createdBy: 'customer:1', createdAt: '2026-08-05T10:00:00.000Z', updatedAt: '2026-08-05T10:00:00.000Z',
  },
  {
    id: 'res-1007', reservationCode: 'LS-2026-01007', reference: 'LS-2026-01007', customerId: 1,
    hotelId: 302, checkIn: '2026-07-28', checkOut: '2026-08-01', expectedDepartureTime: '11:00', adults: 2, children: 0,
    guest: { name: 'Kavinada Lakshan', email: 'kavinada@example.com', phone: '+94 77 123 4567' },
    items: [{ roomTypeId: 30203, quantity: 1, rateId: 'legacy-rate-30203', nightlyRateSnapshot: 78000, assignedPhysicalRoomIds: ['pr-301'] }],
    roomId: 30203, roomTypeId: 30203, rooms: 1, roomRate: 78000, totalAmount: 312000, estimatedTotal: 312000,
    status: 'COMPLETED', source: 'CUSTOMER', createdBy: 'customer:1', createdAt: '2026-07-10T08:00:00.000Z', updatedAt: '2026-08-01T06:00:00.000Z', completedAt: '2026-08-01T06:00:00.000Z',
  },
  {
    id: 'res-1011', reservationCode: 'LS-2026-01011', reference: 'LS-2026-01011', customerId: 1,
    hotelId: 302, checkIn: '2026-08-20', checkOut: '2026-08-22', adults: 2, children: 0,
    guest: { name: 'Kavinada Lakshan', email: 'kavinada@example.com', phone: '+94 77 123 4567' },
    items: [{ roomTypeId: 30203, quantity: 1, rateId: 'legacy-rate-30203', nightlyRateSnapshot: 78000, assignedPhysicalRoomIds: [] }],
    roomId: 30203, roomTypeId: 30203, rooms: 1, roomRate: 78000, totalAmount: 156000, estimatedTotal: 156000,
    status: 'CANCELLED', source: 'CUSTOMER', createdBy: 'customer:1', createdAt: '2026-07-30T08:00:00.000Z', updatedAt: '2026-08-06T08:00:00.000Z',
    cancelledAt: '2026-08-06T08:00:00.000Z', cancelledBy: 'customer:1', cancellationReason: 'Change of Plans', cancellationNote: '',
  },
]

export default reservations
