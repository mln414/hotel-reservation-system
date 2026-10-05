import { Bell, Menu, ShieldCheck, User } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import useHotels from '../../context/useHotels.js'
import './ManagementTopbar.css'

const pageTitles = {
  dashboard: 'Dashboard',
  hotels: 'Hotels',
  destinations: 'Destinations',
  rooms: 'Rooms & Amenities',
  reservations: 'Reservations',
  rates: 'Rates',
  offers: 'Offers',
  reviews: 'Reviews',
  staff: 'Staff Management',
  profile: 'My Profile',
  account: 'Account Security',
}

function getRoleDisplay(user, hotels) {
  if (!user) return { badge: 'STAFF', label: 'Authorized Staff', tone: 'neutral' }
  const role = user.role
  if (role === 'MANAGER') {
    return { badge: 'MANAGER', label: 'Portfolio Manager', tone: 'gold' }
  }
  if (role === 'HOTEL_STAFF') {
    const property = hotels.find((h) => String(h.id) === String(user.assignedHotelId))
    return { badge: 'HOTEL STAFF', label: property ? property.name : 'Assigned Property', tone: 'navy' }
  }
  if (role === 'RECEPTIONIST') {
    const property = hotels.find((h) => String(h.id) === String(user.assignedHotelId))
    return { badge: 'RECEPTIONIST', label: property ? property.name : 'Front Desk Operations', tone: 'blue' }
  }
  return { badge: role, label: 'Staff Member', tone: 'neutral' }
}

function ManagementTopbar({ isMenuOpen, onMenuOpen, user }) {
  const location = useLocation()
  const { hotels } = useHotels()
  const section = location.pathname.split('/')[2] || 'dashboard'
  const title = pageTitles[section] || 'Management Portal'
  const roleInfo = getRoleDisplay(user, hotels)

  return (
    <header className="management-topbar">
      <div className="management-topbar-title">
        <button type="button" aria-label="Open management menu" aria-expanded={isMenuOpen} onClick={onMenuOpen}>
          <Menu aria-hidden="true" size={21} />
        </button>
        <div>
          <span>Management</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="management-topbar-account">
        <button type="button" aria-label="Notifications">
          <Bell aria-hidden="true" size={19} />
        </button>
        <Link className="management-account-icon" to="/management/profile" title="My Profile" aria-label="My Profile">
          <User aria-hidden="true" size={19} />
        </Link>
        <Link className="management-account-icon" to="/management/account/security" title="Change Password" aria-label="Change password">
          <ShieldCheck aria-hidden="true" size={19} />
        </Link>
        <div className="management-topbar-user-info">
          <div className="management-topbar-user-row">
            <strong>{user ? `${user.firstName} ${user.lastName}` : 'Authorized Staff'}</strong>
            <span className={`management-role-badge tone-${roleInfo.tone}`}>{roleInfo.badge}</span>
          </div>
          <span className="management-role-sublabel">{roleInfo.label}</span>
        </div>
      </div>
    </header>
  )
}

export default ManagementTopbar
