import { ArrowLeft, BedDouble, CheckCircle2, EyeOff, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import useRooms from '../../context/useRooms.js'
import useRates from '../../context/useRates.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import useReservations from '../../context/useReservations.js'
import { formatRateAmount, getRateStatus } from '../../utils/rateFormatting.js'
import { getNextRoomSetupAction, getRoomTypeCustomerVisibility, getRoomTypeDisplayImages } from '../../utils/roomDomain.js'
import { RoomAmenityIcon } from '../../utils/roomAmenityIcons.jsx'
import './RoomManagement.css'

export default function RoomTypeDetailsManagement() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'

  const [statusDialog, setStatusDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const { getHotelById } = useHotels()
  const { getRoomById, physicalRooms, amenities, deactivateRoomType, reactivateRoomType, deleteRoomType } = useRooms()
  const { getRatesByRoomId, getCurrentRoomRate } = useRates()
  const { notify } = useManagementFeedback()
  const { getReservationsForRoomType } = useReservations()

  const room = getRoomById(id)
  if (!room) {
    return (
      <section className="room-detail-page room-empty">
        <h1>Room Type Not Found</h1>
        <p>The requested Room Type does not exist.</p>
        <Link to="/management/rooms">Back to Rooms</Link>
      </section>
    )
  }

  const hotel = getHotelById(room.hotelId)
  const linkedAmenities = (room.amenityIds || []).map((amenityId) => amenities.find((item) => item.id === amenityId)).filter(Boolean).sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
  const images = getRoomTypeDisplayImages(room)
  const currentRate = getCurrentRoomRate(room.id)
  const rateRecords = getRatesByRoomId(room.id)
  const visibility = getRoomTypeCustomerVisibility({ room, hotel, physicalRooms, currentRate })
  const nextAction = getNextRoomSetupAction(visibility, room)
  const query = params.toString() ? `?${params.toString()}` : ''
  const backTarget = params.get('from') === 'hotelSetup' ? `/management/hotels/${room.hotelId}/setup?tab=accommodation` : `/management/rooms?hotelId=${room.hotelId}`
  const remainingSetup = [
    ['Configure Base Rate', !visibility.readiness.rate, `/management/rates?hotelId=${room.hotelId}&roomTypeId=${room.id}&section=roomTypeRates&from=roomDetails`],
    ['Configure Inventory', !visibility.readiness.inventory, `/management/rooms/${room.id}/edit`],
  ].filter((item) => item[1])

  const upcomingCount = getReservationsForRoomType(room.id).filter((item) => item.status === 'CONFIRMED' && item.checkOut > new Date().toISOString().slice(0, 10)).length

  const changeStatus = async () => {
    try {
      if (room.status === 'ACTIVE') {
        await deactivateRoomType(room.id)
        notify(`${room.name} is now inactive and customer-hidden.`, 'success')
      } else {
        await reactivateRoomType(room.id)
        notify(`${room.name} is now active. Readiness still controls customer visibility.`, 'success')
      }
    } catch (err) {
      notify(err.message || 'Failed to change status.', 'error')
    } finally {
      setStatusDialog(false)
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== room.name.trim().toLowerCase()) {
      notify('Room type name does not match confirmation.', 'error')
      return
    }

    setDeleting(true)
    try {
      await deleteRoomType(room.id)
      notify(`${room.name} was permanently deleted.`, 'success')
      navigate('/management/rooms')
    } catch (err) {
      notify(err.message || 'This room has reservation history and cannot be deleted. Deactivate it instead.', 'error')
    } finally {
      setDeleting(false)
      setDeleteDialog(false)
    }
  }

  const [mainImage, ...galleryImages] = images

  return (
    <section className="room-detail-page">
      <Link className="room-back" to={backTarget}>
        <ArrowLeft size={15} />{params.get('from') === 'hotelSetup' ? 'Back to Hotel Setup' : 'All Room Types'}
      </Link>
      <header className="room-page-header">
        <div>
          <span>{hotel?.name || 'Unknown Hotel'}</span>
          <h1>{room.name}</h1>
          <p>{room.roomTypeGroupKey} · {room.maxGuests} Guests · {room.bedConfiguration} · {room.inventoryCount ?? 0} Inventory Units</p>
          <div className="room-header-statuses">
            <span className={`room-badge room-badge--${room.status.toLowerCase()}`}>{room.status}</span>
            <span className={`room-badge ${visibility.bookable ? 'room-badge--active' : 'room-badge--hidden'}`}>{visibility.label}</span>
          </div>
        </div>
        <div className="room-header-actions">
          <Link to={`/management/rooms/${room.id}/edit${query}`}>
            <Pencil size={14} />Edit Room Type
          </Link>
          {isManager && (
            <>
              <button
                className={room.status === 'ACTIVE' ? 'room-action-danger' : ''}
                type="button"
                onClick={() => setStatusDialog(true)}
              >
                {room.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
              </button>
              <button
                className="room-action-danger"
                type="button"
                onClick={() => {
                  setDeleteDialog(true)
                  setDeleteConfirmationText('')
                }}
              >
                <Trash2 size={14} />Delete
              </button>
            </>
          )}
        </div>
      </header>

      {location.state?.created && (
        <section className="room-created-panel" role="status">
          <CheckCircle2 size={21} />
          <div>
            <strong>{remainingSetup.length ? `Room Type Created · ${remainingSetup.length} setup step${remainingSetup.length === 1 ? '' : 's'} remaining` : 'Room Type Setup Complete'}</strong>
            <p>{remainingSetup.length ? 'Complete the remaining rate and inventory readiness before customers can book it.' : 'Required Room Type setup is complete; Hotel publication still controls customer visibility.'}</p>
            <div>
              {remainingSetup.map(([label, , href]) => (
                <Link className="room-button" key={label} to={href}>{label}</Link>
              ))}
              <Link to={`/management/rooms/${room.id}`}>View Room Type</Link>
              <Link to={`/management/rooms?hotelId=${room.hotelId}`}>Back to Room Types</Link>
            </div>
          </div>
        </section>
      )}

      {location.state?.updated && (
        <p className="hotel-workspace-status" role="status">Room Type updated successfully.</p>
      )}

      <article className={`room-visibility-panel${visibility.bookable ? ' is-bookable' : ''}`}>
        <span>{visibility.bookable ? <CheckCircle2 size={22} /> : <EyeOff size={22} />}</span>
        <div>
          <small>Derived customer state</small>
          <h2>{visibility.bookable ? 'Visible and bookable' : 'Hidden from customers'}</h2>
          <p>{visibility.bookable ? 'Hotel publication, Room Type status, media, rate and inventory all pass.' : 'Resolve the missing requirements below to make this room type bookable.'}</p>
        </div>
        {nextAction && <Link className="room-button" to={nextAction.href}>{nextAction.label}</Link>}
      </article>

      <article className="room-detail-card room-readiness-card">
        <div className="room-readiness-heading">
          <div>
            <span>Publishing essentials</span>
            <h2>Room Type Readiness</h2>
          </div>
          <small>Amenities improve quality but do not block publication. The remaining checks control customer visibility.</small>
        </div>
        <div className="room-readiness-grid room-readiness-grid--six">
          <Readiness label="Hotel Published" ready={visibility.readiness.hotelPublic} />
          <Readiness label="Room Type Active" ready={room.status === 'ACTIVE'} />
          <Readiness label="Basic Info" ready={visibility.readiness.basic} />
          <Readiness label="Main Photo" ready={visibility.readiness.images} />
          <Readiness label="Usable Inventory" ready={visibility.readiness.inventory} />
          <Readiness label="Current Rate" ready={visibility.readiness.rate} />
        </div>
        {!visibility.bookable && (
          <ul className="room-hidden-reasons">
            {visibility.reasons.filter((item) => !item.ready).map((item) => (
              <li key={item.key}>{item.label} is required.</li>
            ))}
          </ul>
        )}
      </article>

      <div className="room-detail-grid">
        <article className="room-detail-card">
          <h2>Overview</h2>
          <p>{room.fullDescription}</p>
          <dl>
            <Fact label="Room Type Status">
              <span className={`room-badge room-badge--${room.status.toLowerCase()}`}>{room.status}</span>
            </Fact>
            <Fact label="Hotel">{hotel?.name || 'Unknown Hotel'}</Fact>
            <Fact label="Category">{room.roomTypeGroupKey}</Fact>
            <Fact label="Total Inventory Units">{room.inventoryCount ?? 0}</Fact>
            <Fact label="Starting Base Price">{room.basePrice ? `LKR ${Number(room.basePrice).toLocaleString()}` : 'Not specified'}</Fact>
            <Fact label="Maximum Guests">{room.maxGuests}</Fact>
            <Fact label="Adult / Child Limits">{room.adultCapacity} adults · {room.childCapacity} children</Fact>
            <Fact label="Bed Configuration">{room.bedConfiguration}</Fact>
            <Fact label="Room Size">{room.roomSize ? `${room.roomSize} m²` : 'Not specified'}</Fact>
            <Fact label="View">{room.viewType}</Fact>
            <Fact label="Smoking">{room.smokingPreference || 'Not specified'}</Fact>
            <Fact label="Extra Bed">{room.extraBedSupport ? 'Supported' : 'Not supported'}</Fact>
          </dl>
        </article>

        <article className="room-detail-card">
          <h2>Room Inventory &amp; Availability</h2>
          <p>This room operates on a quantity-based inventory pool.</p>
          <dl>
            <Fact label="Total Configured Units">{room.inventoryCount ?? 0}</Fact>
            <Fact label="Active Future Bookings">{upcomingCount}</Fact>
            <Fact label="Operational Status">{room.status}</Fact>
          </dl>
          <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
            To adjust total inventory units, edit this room type. Reductions below existing future reservations are blocked to prevent overbooking.
          </p>
          <div className="room-inventory-actions">
            <Link className="room-button room-inventory-actions__edit" to={`/management/rooms/${room.id}/edit?focus=inventory#capacity-inventory`}><Pencil size={16} />Edit Inventory Units</Link>
            <Link className="room-button room-inventory-actions__physical" to={`/management/rooms/${room.id}/inventory`}><BedDouble size={17} />Manage Physical Rooms</Link>
          </div>
        </article>
      </div>

      <article className={`room-detail-card room-pricing-summary${currentRate ? ' has-rate' : ' is-missing'}`}>
        <div>
          <span className="room-section-kicker">Commercial readiness</span>
          <h2>Pricing</h2>
          {currentRate ? (
            <>
              <p>Current Base Rate</p>
              <strong>{formatRateAmount(currentRate.amount)} <small>/ night · {getRateStatus(currentRate)}</small></strong>
              <small className="room-record-count">{rateRecords.length} retained rate record{rateRecords.length === 1 ? '' : 's'}</small>
            </>
          ) : (
            <>
              <strong>No Base Rate configured</strong>
              <p>Configure a current Room Type Base Rate before this room can become bookable.</p>
            </>
          )}
        </div>
        <Link className="room-button" to={`/management/rates?hotelId=${room.hotelId}&roomTypeId=${room.id}&section=roomTypeRates&from=roomDetails`}>
          {currentRate ? 'Manage Rates' : 'Configure Base Rate'}
        </Link>
      </article>

      <article className="room-detail-card room-amenities-detail">
        <div className="room-detail-section-heading">
          <div>
            <span className="room-section-kicker">Guest experience</span>
            <h2>Room Amenities</h2>
            <p>{linkedAmenities.length ? 'Amenities are shown in their customer display order.' : 'Amenities are optional, but help guests understand what is included.'}</p>
          </div>
          <Link to={`/management/rooms/${room.id}/edit#amenities`}>
            {linkedAmenities.length ? 'Manage Amenities' : 'Add Amenities'}
          </Link>
        </div>
        <div className="room-amenity-chips">
          {linkedAmenities.length ? (
            linkedAmenities.map((item) => (
              <span key={item.id} className={!item.active ? 'is-inactive' : ''}>
                <RoomAmenityIcon iconKey={item.iconKey} size={17} />{item.name}{!item.active ? ' · Inactive' : ''}
              </span>
            ))
          ) : (
            <div className="room-detail-empty">
              <p>No amenities selected.</p>
              <Link className="room-button" to={`/management/rooms/${room.id}/edit#amenities`}>Add Amenities</Link>
            </div>
          )}
        </div>
      </article>

      <article className="room-detail-card room-detail-media-card">
        <div className="room-detail-section-heading">
          <div>
            <span className="room-section-kicker">Customer-facing media</span>
            <h2>Room Type Images</h2>
            <p>The Main Photo leads customer cards; Gallery photos follow in their saved order.</p>
          </div>
          <Link to={`/management/rooms/${room.id}/edit#media`}>Manage Images</Link>
        </div>
        {mainImage ? (
          <div className="room-detail-media-layout">
            <figure className="room-detail-main-photo">
              <span>Main Photo</span>
              <img src={mainImage} alt={`${room.name} Main Photo`} />
            </figure>
            <section className="room-detail-gallery">
              <div>
                <strong>{galleryImages.length} Gallery Photo{galleryImages.length === 1 ? '' : 's'}</strong>
                <small>Ordered thumbnails</small>
              </div>
              {galleryImages.length ? (
                <div>
                  {galleryImages.map((image, index) => (
                    <figure key={`${image}-${index}`}>
                      <img src={image} alt={`${room.name} Gallery Photo ${index + 1}`} />
                      <figcaption>{index + 1}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p>No Gallery photos added.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="room-detail-empty">
            <TriangleAlert size={20} /><p>Main Photo not configured.</p>
            <Link className="room-button" to={`/management/rooms/${room.id}/edit#media`}>Add Images</Link>
          </div>
        )}
      </article>

      {statusDialog && (
        <ManagementDialog
          title={`${room.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'} ${room.name}?`}
          description={
            room.status === 'ACTIVE'
              ? `This Room Type will stop accepting new reservations. ${upcomingCount} upcoming confirmed reservation(s) remain active; rates, amenities and media are retained.`
              : 'It becomes active, but customer visibility remains derived from all readiness rules.'
          }
          onClose={() => setStatusDialog(false)}
          danger={room.status === 'ACTIVE'}
          actions={
            <>
              <button type="button" onClick={() => setStatusDialog(false)}>Cancel</button>
              <button type="button" className={room.status === 'ACTIVE' ? 'danger' : ''} onClick={changeStatus}>Confirm</button>
            </>
          }
        />
      )}

      {deleteDialog && (
        <ManagementDialog
          title={`Delete Room Type "${room.name}"?`}
          description={`Permanent deletion is only allowed if no reservation history exists. To confirm, type "${room.name}" below:`}
          onClose={() => setDeleteDialog(false)}
          danger
          actions={
            <>
              <button type="button" onClick={() => setDeleteDialog(false)} disabled={deleting}>Cancel</button>
              <button
                type="button"
                className="danger"
                disabled={deleting || deleteConfirmationText.trim().toLowerCase() !== room.name.trim().toLowerCase()}
                onClick={confirmDelete}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </>
          }
        >
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              placeholder={`Type "${room.name}"`}
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>
        </ManagementDialog>
      )}
    </section>
  )
}

function Fact({ label, children }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>
}

function Readiness({ label, ready }) {
  return (
    <div className={ready ? 'ready' : 'pending'}>
      <span>{ready ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}</span>
      <div><strong>{label}</strong><small>{ready ? 'Ready' : 'Action required'}</small></div>
    </div>
  )
}
