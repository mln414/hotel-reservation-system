import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Eye,
  Filter,
  MoreVertical,
  Percent,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import useRates from '../../context/useRates.js'
import useReservations from '../../context/useReservations.js'
import useRooms from '../../context/useRooms.js'
import { dashboardApi } from '../../services/dashboardApi.js'
import {
  getAvailabilityBreakdown,
  getPrimaryReservationItem,
  getReservationAssignmentState,
  getReservationCode,
  toDateKey,
} from '../../utils/reservationDomain.js'
import { getHotelSetupReadiness } from '../../utils/hotelManagement.js'
import './ManagementDashboard.css'

const formatDate = (value) => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(value.includes('T') ? value : `${value}T00:00:00`)
    )
  } catch {
    return value
  }
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function ManagementDashboard() {
  const { user } = useAuth()
  const { hotels, destinations, setHotelPublicationStatus, deleteHotel } = useHotels()
  const { rooms, physicalRooms } = useRooms()
  const { roomRates } = useRates()
  const { reservations } = useReservations()

  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [backendData, setBackendData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeMenuHotelId, setActiveMenuHotelId] = useState(null)
  const [deleteConfirmHotel, setDeleteConfirmHotel] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDeletingHotel, setIsDeletingHotel] = useState(false)

  const isManager = user?.role === 'MANAGER'
  const isStaff = user?.role === 'HOTEL_STAFF'
  const isReceptionist = user?.role === 'RECEPTIONIST'

  const fetchDashboard = useCallback(async (hotelId = '') => {
    try {
      setRefreshing(true)
      const data = await dashboardApi.getDashboard(hotelId)
      setBackendData(data)
      setLastUpdated(new Date())
    } catch {
      // Graceful fallback to frontend state if API network is interrupted
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard(selectedHotelId)
  }, [fetchDashboard, selectedHotelId])

  // Context-derived calculations as fallback/supplement
  const readinessMap = new Map(
    hotels.map((hotel) => [String(hotel.id), getHotelSetupReadiness(hotel, destinations, rooms, roomRates)])
  )

  const effectiveHotels = selectedHotelId
    ? hotels.filter((h) => String(h.id) === String(selectedHotelId))
    : isStaff || isReceptionist
    ? hotels.filter((h) => String(h.id) === String(user?.assignedHotelId))
    : hotels

  const pendingHotels = effectiveHotels.filter((hotel) => !readinessMap.get(String(hotel.id))?.canPublish)
  const readyHotels = effectiveHotels.filter(
    (hotel) => readinessMap.get(String(hotel.id))?.canPublish && hotel.publicationStatus !== 'ACTIVE'
  )
  const activeHotels = effectiveHotels.filter((hotel) => hotel.publicationStatus === 'ACTIVE')

  const todayStr = toDateKey()
  const upcomingReservations = reservations.filter(
    (item) =>
      item.status === 'CONFIRMED' &&
      item.checkIn >= todayStr &&
      (!selectedHotelId || String(item.hotelId) === String(selectedHotelId))
  )

  const arrivalsToday = reservations.filter(
    (item) =>
      item.status === 'CONFIRMED' &&
      item.checkIn === todayStr &&
      (!selectedHotelId || String(item.hotelId) === String(selectedHotelId))
  )

  const departuresToday = reservations.filter(
    (item) =>
      item.status === 'CONFIRMED' &&
      item.checkOut === todayStr &&
      (!selectedHotelId || String(item.hotelId) === String(selectedHotelId))
  )

  const unassignedCount = reservations.filter(
    (item) =>
      item.status === 'CONFIRMED' &&
      getReservationAssignmentState(item) !== 'ASSIGNED' &&
      (!selectedHotelId || String(item.hotelId) === String(selectedHotelId))
  ).length

  const cancelledCount = reservations.filter(
    (item) =>
      item.status === 'CANCELLED' && (!selectedHotelId || String(item.hotelId) === String(selectedHotelId))
  ).length

  const lowAvailabilityCount = upcomingReservations.filter((item) => {
    const primary = getPrimaryReservationItem(item)
    return (
      getAvailabilityBreakdown({
        reservations,
        physicalRooms,
        hotelId: item.hotelId,
        roomTypeId: primary?.roomTypeId,
        inventoryCount: rooms.find((room) => String(room.id) === String(primary?.roomTypeId))?.inventoryCount,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
      }).availableQuantity <= 1
    )
  }).length

  // Build Attention Items list
  const attentionItems = []

  pendingHotels.forEach((hotel) => {
    const state = readinessMap.get(String(hotel.id))
    attentionItems.push({
      id: `setup-${hotel.id}`,
      severity: 'MEDIUM',
      title: 'Setup Incomplete',
      hotelName: hotel.name,
      reason: `${state?.incompleteRequired?.length || 0} required fields remaining before publication.`,
      actionLabel: 'Continue Setup',
      actionUrl: `/management/hotels/${hotel.id}/setup`,
    })
  })

  if (unassignedCount > 0) {
    attentionItems.push({
      id: 'unassigned-res',
      severity: 'HIGH',
      title: 'Unassigned Reservations',
      hotelName: selectedHotelId
        ? hotels.find((h) => String(h.id) === String(selectedHotelId))?.name || 'Selected Property'
        : 'All Properties',
      reason: `${unassignedCount} confirmed reservation(s) require physical room assignment.`,
      actionLabel: 'Assign Rooms',
      actionUrl: '/management/reservations/assignments',
    })
  }

  if (lowAvailabilityCount > 0) {
    attentionItems.push({
      id: 'low-avail',
      severity: 'MEDIUM',
      title: 'Low Room Availability',
      hotelName: 'Portfolio Inventory',
      reason: `${lowAvailabilityCount} upcoming reservation(s) are near maximum room capacity.`,
      actionLabel: 'View Availability',
      actionUrl: '/management/reservations/availability',
    })
  }

  // Active metrics values (backed by backend DTO or context calculation)
  const portfolioKPIs = backendData?.portfolio || {
    totalProperties: effectiveHotels.length,
    activeProperties: activeHotels.length,
    inactiveProperties: effectiveHotels.length - activeHotels.length,
    pendingSetupProperties: pendingHotels.length,
    readyForReviewProperties: readyHotels.length,
  }

  const todayOperations = backendData?.today || {
    arrivalsToday: arrivalsToday.length,
    departuresToday: departuresToday.length,
    availableRoomsToday: physicalRooms.length || 0,
    occupancyPercentage: 0,
    upcomingReservations: upcomingReservations.length,
    attentionRequiredCount: attentionItems.length,
  }

  const recentReservationsList = [...reservations]
    .filter((item) => !selectedHotelId || String(item.hotelId) === String(selectedHotelId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const handleToggleActivate = async (hotel) => {
    if (!isManager) return
    const newStatus = hotel.publicationStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await setHotelPublicationStatus(hotel.id, newStatus)
    fetchDashboard(selectedHotelId)
  }

  const handleDeleteHotelConfirm = async () => {
    if (!isManager || !deleteConfirmHotel || deleteConfirmName !== deleteConfirmHotel.name || isDeletingHotel) return
    setIsDeletingHotel(true)
    try {
      await deleteHotel(deleteConfirmHotel.id, deleteConfirmName)
      setDeleteConfirmHotel(null)
      setDeleteConfirmName('')
      fetchDashboard(selectedHotelId)
    } finally {
      setIsDeletingHotel(false)
    }
  }

  return (
    <section className="management-dashboard-v2">
      {/* SECTION A: Dashboard Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-main">
          <div className="dashboard-title-group">
            <span className="dashboard-eyebrow">Portfolio Operations</span>
            <h1>Management Dashboard</h1>
            <p>Today&apos;s operational priorities, property setup, and reservation status.</p>
          </div>

          <div className="dashboard-header-actions">
            {/* Property Filter Dropdown */}
            {isManager && (
              <div className="dashboard-filter-wrap">
                <Filter size={15} aria-hidden="true" />
                <select
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  aria-label="Filter by property"
                >
                  <option value="">All Properties ({hotels.length})</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isManager && (
              <div className="dashboard-fixed-property-badge">
                <Building2 size={15} aria-hidden="true" />
                <span>
                  {hotels.find((h) => String(h.id) === String(user?.assignedHotelId))?.name ||
                    'Assigned Property'}
                </span>
              </div>
            )}

            {/* Refresh Action */}
            <button
              type="button"
              className={`dashboard-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
              onClick={() => fetchDashboard(selectedHotelId)}
              title="Refresh metrics"
              aria-label="Refresh metrics"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>

            {/* Timestamp */}
            <div className="dashboard-timestamp">
              <small>Last updated</small>
              <strong>{formatTime(lastUpdated.toISOString())}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION B: Primary Portfolio KPI Cards */}
      <div className="dashboard-kpi-grid">
        <article className="kpi-card tone-navy">
          <div className="kpi-icon-wrap">
            <Building2 size={22} />
          </div>
          <div className="kpi-content">
            <small>TOTAL PROPERTIES</small>
            <strong>{portfolioKPIs.totalProperties}</strong>
            <span className="kpi-subtext">LankaStay portfolio</span>
          </div>
        </article>

        <article className="kpi-card tone-green">
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <small>PUBLISHED PROPERTIES</small>
            <strong>{portfolioKPIs.activeProperties}</strong>
            <span className="kpi-subtext">Active in booking engine</span>
          </div>
        </article>

        <article className="kpi-card tone-gold">
          <div className="kpi-icon-wrap">
            <Clock3 size={22} />
          </div>
          <div className="kpi-content">
            <small>PENDING SETUPS</small>
            <strong>{portfolioKPIs.pendingSetupProperties}</strong>
            <span className="kpi-subtext">Setup incomplete</span>
          </div>
        </article>

        <article className="kpi-card tone-blue">
          <div className="kpi-icon-wrap">
            <CalendarDays size={22} />
          </div>
          <div className="kpi-content">
            <small>UPCOMING RESERVATIONS</small>
            <strong>{todayOperations.upcomingReservations}</strong>
            <span className="kpi-subtext">Confirmed stays</span>
          </div>
        </article>

        <article className={`kpi-card ${attentionItems.length > 0 ? 'tone-alert' : 'tone-neutral'}`}>
          <div className="kpi-icon-wrap">
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-content">
            <small>ATTENTION REQUIRED</small>
            <strong>{todayOperations.attentionRequiredCount || attentionItems.length}</strong>
            <span className="kpi-subtext">Actionable items</span>
          </div>
        </article>
      </div>

      {/* SECTION C: Today's Operations Panel */}
      <section className="dashboard-panel today-operations-panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">Front Desk Operations</span>
            <h2>Today&apos;s Operations ({formatDate(todayStr)})</h2>
          </div>
          <Link to="/management/reservations" className="panel-link">
            View All Stays <ArrowRight size={15} />
          </Link>
        </header>

        <div className="today-metrics-row">
          <Link to="/management/reservations" className="today-metric-item">
            <DoorOpen size={20} className="text-blue" />
            <div>
              <strong>{arrivalsToday.length}</strong>
              <span>Arrivals Today</span>
            </div>
          </Link>

          <Link to="/management/reservations" className="today-metric-item">
            <UserCheck size={20} className="text-green" />
            <div>
              <strong>{departuresToday.length}</strong>
              <span>Departures Today</span>
            </div>
          </Link>

          <Link to="/management/rooms" className="today-metric-item">
            <Building2 size={20} className="text-gold" />
            <div>
              <strong>{physicalRooms.length || '—'}</strong>
              <span>Available Inventory</span>
            </div>
          </Link>

          <Link to="/management/reservations/assignments" className="today-metric-item">
            <AlertCircle size={20} className="text-amber" />
            <div>
              <strong>{unassignedCount}</strong>
              <span>Unassigned Rooms</span>
            </div>
          </Link>

          <Link to="/management/reservations" className="today-metric-item">
            <ShieldAlert size={20} className="text-muted" />
            <div>
              <strong>{cancelledCount}</strong>
              <span>Cancelled Today</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Main Grid: Attention Required & Setup Pending */}
      <div className="dashboard-grid-two-col">
        {/* SECTION D: Attention Required Panel */}
        <section className="dashboard-panel attention-panel">
          <header className="panel-header">
            <div>
              <span className="panel-eyebrow">Operational Alert Queue</span>
              <h2>Attention Required</h2>
            </div>
            <small>{attentionItems.length} items</small>
          </header>

          <div className="attention-list">
            {attentionItems.length > 0 ? (
              attentionItems.slice(0, 5).map((item) => (
                <article key={item.id} className={`attention-card severity-${item.severity.toLowerCase()}`}>
                  <div className="attention-card-header">
                    <span className={`severity-badge severity-${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                    <strong>{item.title}</strong>
                    <span className="attention-hotel">{item.hotelName}</span>
                  </div>
                  <p>{item.reason}</p>
                  <div className="attention-card-footer">
                    <Link to={item.actionUrl} className="attention-action-btn">
                      {item.actionLabel} <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-panel-message">
                <CheckCircle2 size={28} className="text-green" />
                <p>No properties or operations require immediate attention.</p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION E: Setup Pending Work Queue */}
        <section className="dashboard-panel setup-queue-panel">
          <header className="panel-header">
            <div>
              <span className="panel-eyebrow">Publication Readiness</span>
              <h2>Setup Pending Properties</h2>
            </div>
            <Link to="/management/hotels" className="panel-link">
              All Properties <ArrowRight size={15} />
            </Link>
          </header>

          <div className="setup-queue-list">
            {pendingHotels.length > 0 ? (
              pendingHotels.slice(0, 5).map((hotel) => {
                const readiness = readinessMap.get(String(hotel.id))
                return (
                  <div key={hotel.id} className="setup-queue-row">
                    <div className="setup-row-main">
                      <strong>{hotel.name}</strong>
                      <span className="setup-progress-label">
                        {readiness?.percentage || 0}% Complete
                      </span>
                    </div>

                    <div className="setup-progress-bar">
                      <div
                        className="setup-progress-fill"
                        style={{ width: `${readiness?.percentage || 0}%` }}
                      />
                    </div>

                    <div className="setup-row-footer">
                      <small>
                        {readiness?.incompleteRequired?.map((i) => i.label).join(', ') ||
                          'Pending required setup fields'}
                      </small>
                      <Link to={`/management/hotels/${hotel.id}/setup`} className="continue-setup-link">
                        Continue Setup <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-panel-message">
                <CheckCircle2 size={28} className="text-green" />
                <p>All LankaStay properties have completed required setup configuration.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Main Grid: Recent Reservations & Property Status Overview */}
      <div className="dashboard-grid-two-col">
        {/* SECTION G: Recent Reservations Table */}
        <section className="dashboard-panel recent-reservations-panel">
          <header className="panel-header">
            <div>
              <span className="panel-eyebrow">Recent Bookings</span>
              <h2>Recent Reservations</h2>
            </div>
            <Link to="/management/reservations" className="panel-link">
              View All <ArrowRight size={15} />
            </Link>
          </header>

          <div className="dashboard-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Status</th>
                  <th>Assignment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReservationsList.length > 0 ? (
                  recentReservationsList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/management/reservations/${item.id}`} className="res-code-link">
                          <strong>{getReservationCode(item)}</strong>
                        </Link>
                      </td>
                      <td>
                        {hotels.find((h) => String(h.id) === String(item.hotelId))?.name ||
                          'LankaStay Resort'}
                      </td>
                      <td>{formatDate(item.checkIn)}</td>
                      <td>
                        <span className={`status-chip status-${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{getReservationAssignmentState(item)}</td>
                      <td>
                        <Link to={`/management/reservations/${item.id}`} className="table-action-icon">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No recent reservations recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION H: Property Status Overview & Manager Actions */}
        <section className="dashboard-panel property-status-panel">
          <header className="panel-header">
            <div>
              <span className="panel-eyebrow">Property Directory</span>
              <h2>Property Status Overview</h2>
            </div>
            {isManager && (
              <Link to="/management/hotels/new" className="btn-primary-sm">
                <Plus size={15} /> New Hotel
              </Link>
            )}
          </header>

          <div className="property-status-list">
            {effectiveHotels.slice(0, 5).map((hotel) => {
              const isActive = hotel.publicationStatus === 'ACTIVE'
              const isPending = hotel.setupStatus === 'PENDING'
              return (
                <div key={hotel.id} className="property-status-row">
                  <div className="property-info-col">
                    <strong>{hotel.name}</strong>
                    <small>{hotel.propertyType || 'Hotel Resort'}</small>
                  </div>

                  <div className="property-status-badges">
                    <span
                      className={`status-chip ${
                        isActive
                          ? 'status-confirmed'
                          : isPending
                          ? 'status-pending'
                          : 'status-cancelled'
                      }`}
                    >
                      {isActive ? 'PUBLISHED' : isPending ? 'SETUP PENDING' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="property-actions-col">
                    <Link to={`/management/hotels/${hotel.id}/setup`} className="btn-secondary-xs">
                      Edit
                    </Link>

                    {/* Manager-only activation and context menu */}
                    {isManager && (
                      <div className="manager-menu-wrap">
                        <button
                          type="button"
                          className="btn-icon-xs"
                          onClick={() =>
                            setActiveMenuHotelId(activeMenuHotelId === hotel.id ? null : hotel.id)
                          }
                          aria-label="Property actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuHotelId === hotel.id && (
                          <div className="manager-dropdown-menu">
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleActivate(hotel)
                                setActiveMenuHotelId(null)
                              }}
                            >
                              {isActive ? 'Deactivate Property' : 'Activate Property'}
                            </button>
                            <button
                              type="button"
                              className="text-danger"
                              onClick={() => {
                                setDeleteConfirmHotel(hotel)
                                setDeleteConfirmName('')
                                setActiveMenuHotelId(null)
                              }}
                            >
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isManager && <span className="managed-by-manager-tag">Manager Protected</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Grid: Quick Actions & Recent Security Activity (Manager) */}
      <div className="dashboard-grid-two-col">
        {/* SECTION I: Quick Actions Panel */}
        <section className="dashboard-panel quick-actions-panel">
          <header className="panel-header">
            <div>
              <span className="panel-eyebrow">Operational Shortcuts</span>
              <h2>Quick Actions</h2>
            </div>
          </header>

          <div className="quick-actions-grid">
            <Link to="/management/reservations" className="quick-action-card">
              <CalendarDays size={20} className="text-blue" />
              <span>View Reservations</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/management/reservations/availability" className="quick-action-card">
              <DoorOpen size={20} className="text-gold" />
              <span>Check Availability</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/management/rates" className="quick-action-card">
              <Percent size={20} className="text-green" />
              <span>Manage Rates & Offers</span>
              <ArrowRight size={16} />
            </Link>

            {isManager && (
              <>
                <Link to="/management/hotels" className="quick-action-card">
                  <Building2 size={20} className="text-navy" />
                  <span>Manage Hotels</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/management/staff" className="quick-action-card">
                  <Users size={20} className="text-purple" />
                  <span>Staff Administration</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}

            {isReceptionist && (
              <Link to="/management/reservations/assignments" className="quick-action-card">
                <UserCheck size={20} className="text-blue" />
                <span>Room Assignments</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>

        {/* SECTION J: Recent Management Activity Feed (Manager Only) */}
        {isManager && (
          <section className="dashboard-panel activity-feed-panel">
            <header className="panel-header">
              <div>
                <span className="panel-eyebrow">Audit Log</span>
                <h2>Recent Management Activity</h2>
              </div>
              <ShieldCheck size={18} className="text-gold" />
            </header>

            <div className="activity-feed-list">
              {backendData?.recentActivity?.length > 0 ? (
                backendData.recentActivity.slice(0, 5).map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="activity-icon">
                      <Sparkles size={15} />
                    </div>
                    <div className="activity-content">
                      <strong>{act.title}</strong>
                      <small>{act.detailMessage}</small>
                      <span className="activity-time">{formatTime(act.occurredAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-panel-message">
                  <ShieldCheck size={26} className="text-muted" />
                  <p>Security and management actions will appear here in real time.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Delete Confirmation Modal (Manager Safety Pattern) */}
      {deleteConfirmHotel && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <header className="modal-header text-danger">
              <AlertTriangle size={24} />
              <h3>Delete Property Permanently?</h3>
            </header>
            <p>
              This permanently deletes <strong>{deleteConfirmHotel.name}</strong> and all associated
              rooms, rates, reservations, reviews, gallery and configuration. This cannot be undone.
            </p>
            <label className="dashboard-delete-confirm-field">
              <span>Type <strong>{deleteConfirmHotel.name}</strong> to confirm:</span>
              <input
                autoFocus
                value={deleteConfirmName}
                placeholder={deleteConfirmHotel.name}
                disabled={isDeletingHotel}
                onChange={(event) => setDeleteConfirmName(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeletingHotel}
                onClick={() => setDeleteConfirmHotel(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn-danger" disabled={deleteConfirmName !== deleteConfirmHotel.name || isDeletingHotel} onClick={handleDeleteHotelConfirm}>
                {isDeletingHotel ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
