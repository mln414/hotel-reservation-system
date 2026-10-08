// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import {
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageSquareText,
  PanelsTopLeft,
  Percent,
  User,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router'
import logo from '../../assets/images/lankastay-logo.png'
import { getManagementNavigation } from '../../config/managementNavigation.js'
import './ManagementSidebar.css'

const icons = {
  dashboard: LayoutDashboard,
  hotels: Building2,
  destinations: MapPinned,
  rooms: BedDouble,
  reservations: CalendarDays,
  rates: BadgeDollarSign,
  offers: Percent,
  reviews: MessageSquareText,
  websiteContent: PanelsTopLeft,
  staff: Users,
  profile: User,
}

function ManagementSidebar({ isOpen, onClose, currentRole, onLogout, isCollapsed, onToggleCollapse }) {
  const navigation = getManagementNavigation(currentRole)

  return (
    <>
      <button className={`management-sidebar-overlay${isOpen ? ' is-open' : ''}`} type="button" aria-label="Close management menu" tabIndex={isOpen ? 0 : -1} onClick={onClose} />
      <aside className={`management-sidebar${isOpen ? ' is-open' : ''}${isCollapsed ? ' is-collapsed' : ''}`} aria-label="Management sidebar">
        <div className="management-sidebar-brand">
          <img src={logo} alt="" />
          {!isCollapsed && <span><strong>LankaStay</strong><small>Management Portal</small></span>}
          <button type="button" className="sidebar-close-btn" aria-label="Close management menu" onClick={onClose}><X aria-hidden="true" size={20} /></button>
          <button type="button" className="sidebar-collapse-toggle" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight aria-hidden="true" size={18} /> : <ChevronLeft aria-hidden="true" size={18} />}
          </button>
        </div>

        <nav className="management-sidebar-nav" aria-label="Management navigation">
          {navigation.map((item) => {
            const Icon = icons[item.icon]
            return (
              <NavLink key={item.path} to={item.path} onClick={onClose} title={isCollapsed ? item.label : undefined} className={({ isActive }) => isActive ? 'is-active' : undefined}>
                <Icon aria-hidden="true" size={19} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="management-sidebar-footer">
          <NavLink to="/" onClick={onClose} title={isCollapsed ? 'Back to Website' : undefined}><ExternalLink aria-hidden="true" size={18} />{!isCollapsed && <span>Back to Website</span>}</NavLink>
          <button type="button" onClick={onLogout} title={isCollapsed ? 'Logout' : undefined}><LogOut aria-hidden="true" size={18} />{!isCollapsed && <span>Logout</span>}</button>
        </div>
      </aside>
    </>
  )
}

export default ManagementSidebar
