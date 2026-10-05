export const USER_ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  MANAGER: 'MANAGER',
  HOTEL_STAFF: 'HOTEL_STAFF',
  RECEPTIONIST: 'RECEPTIONIST',
})

export const MANAGEMENT_ROLES = Object.freeze([
  USER_ROLES.MANAGER,
  USER_ROLES.HOTEL_STAFF,
  USER_ROLES.RECEPTIONIST,
])

export const MANAGEMENT_PERMISSIONS = Object.freeze({
  [USER_ROLES.MANAGER]: [
    'dashboard',
    'hotels',
    'destinations',
    'rooms',
    'reservations',
    'rates',
    'offers',
    'reviews',
    'websiteContent',
    'staff',
  ],
  [USER_ROLES.HOTEL_STAFF]: [
    'dashboard',
    'hotels',
    'destinations',
    'rooms',
    'reservations',
    'rates',
    'offers',
    'websiteContent',
  ],
  [USER_ROLES.RECEPTIONIST]: ['dashboard', 'reservations', 'availability'],
})

// Backend must enforce all role and resource permissions, including assignedHotelId scope.
// The first MANAGER must be provisioned securely by backend/database seeding, never public registration.
