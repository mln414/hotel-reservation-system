import { USER_ROLES } from '../constants/roles.js'

const manager = USER_ROLES.MANAGER
const hotelStaff = USER_ROLES.HOTEL_STAFF
const receptionist = USER_ROLES.RECEPTIONIST

export const managementNavigation = [
  { key: 'dashboard', label: 'Dashboard', path: '/management/dashboard', icon: 'dashboard', roles: [manager, hotelStaff, receptionist] },
  { key: 'hotels', label: 'Hotels', path: '/management/hotels', icon: 'hotels', roles: [manager, hotelStaff] },
  { key: 'destinations', label: 'Destinations', path: '/management/destinations', icon: 'destinations', roles: [manager, hotelStaff] },
  { key: 'rooms', label: 'Rooms & Amenities', path: '/management/rooms', icon: 'rooms', roles: [manager, hotelStaff] },
  { key: 'reservations', label: 'Reservations', path: '/management/reservations', icon: 'reservations', roles: [manager, hotelStaff, receptionist] },
  { key: 'rates', label: 'Rates', path: '/management/rates', icon: 'rates', roles: [manager, hotelStaff] },
  { key: 'offers', label: 'Offers', path: '/management/offers', icon: 'offers', roles: [manager, hotelStaff] },
  { key: 'reviews', label: 'Reviews', path: '/management/reviews', icon: 'reviews', roles: [manager] },
  { key: 'websiteContent', label: 'Website Content', path: '/management/website-content', icon: 'websiteContent', roles: [manager, hotelStaff] },
  { key: 'staff', label: 'Staff Management', path: '/management/staff', icon: 'staff', roles: [manager] },
  { key: 'profile', label: 'My Profile', path: '/management/profile', icon: 'profile', roles: [manager, hotelStaff, receptionist] },
]

export function getManagementNavigation(role) {
  if (!role) return managementNavigation
  return managementNavigation.filter((item) => item.roles.includes(role))
}
