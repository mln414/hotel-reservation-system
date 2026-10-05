import { ArrowDown, ArrowLeft, ArrowUp, BedDouble, Boxes, Building2, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import useDestinations from '../../context/useDestinations.js'
import useRooms from '../../context/useRooms.js'
import useRates from '../../context/useRates.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import { getHotelMainImage, isPublicHotel } from '../../utils/hotelMedia.js'
import { applyImageFallback, getRoomMainImage } from '../../utils/roomMedia.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import { getRoomTypeCustomerVisibility } from '../../utils/roomDomain.js'
import { RoomAmenityIcon } from '../../utils/roomAmenityIcons.jsx'
import { ROOM_AMENITY_ICON_OPTIONS } from '../../utils/roomAmenityOptions.js'
import './RoomManagement.css'

const selectOptions = (items) => items.map((item) => Array.isArray(item) ? { value: item[0], label: item[1] } : { value: item, label: item })

export default function ManageRooms() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'
  const { hotels, getHotelById } = useHotels()
  const { destinations } = useDestinations()
  const {
    loading: roomsLoading,
    roomTypes,
    physicalRooms,
    amenities,
    deactivateRoomType,
    reactivateRoomType,
    deleteRoomType,
    addAmenity,
    updateAmenity,
    activateAmenity,
    deactivateAmenity,
    reorderAmenity,
  } = useRooms()
  const { getCurrentRoomRate } = useRates()
  const { notify } = useManagementFeedback()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [capacity, setCapacity] = useState('ALL')
  const [bed, setBed] = useState('ALL')
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [hotelSearch, setHotelSearch] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('ALL')
  const [hotelStatus, setHotelStatus] = useState('ALL')

  const tab = params.get('tab') === 'amenities' ? 'amenities' : 'types'
  const selectedHotel = params.get('hotelId') || ''
  const showAllHotels = params.get('scope') === 'all'
  const fromHotelSetup = params.get('from') === 'hotelSetup'
  const contextHotel = selectedHotel ? getHotelById(selectedHotel) : null

  const filteredHotels = useMemo(() => hotels.filter((hotel) => (
    (!hotelSearch || `${hotel.name} ${destinations.find((item) => String(item.id) === String(hotel.destinationId))?.name || ''}`.toLowerCase().includes(hotelSearch.toLowerCase())) &&
    (destinationFilter === 'ALL' || String(hotel.destinationId) === destinationFilter) &&
    (hotelStatus === 'ALL' || (hotelStatus === 'PUBLISHED') === isPublicHotel(hotel))
  )), [hotels, destinations, hotelSearch, destinationFilter, hotelStatus])

  const filtered = useMemo(() => roomTypes.filter((room) => {
    const hotelName = getHotelById(room.hotelId)?.name || 'Unknown Hotel'
    const needle = search.trim().toLowerCase()
    return (
      (showAllHotels || String(room.hotelId) === selectedHotel) &&
      (status === 'ALL' || room.status === status) &&
      (capacity === 'ALL' || Number(room.maxGuests) >= Number(capacity)) &&
      (bed === 'ALL' || room.bedConfiguration === bed) &&
      (!needle || `${room.name} ${hotelName} ${room.bedConfiguration}`.toLowerCase().includes(needle))
    )
  }), [roomTypes, selectedHotel, showAllHotels, status, capacity, bed, search, getHotelById])

  const totalUnits = useMemo(() => filtered.reduce((acc, r) => acc + (Number(r.inventoryCount) || 0), 0), [filtered])

  const updateParams = (updates) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setParams(next)
  }

  const changeTab = (next) => updateParams({ tab: next === 'amenities' ? 'amenities' : '' })

  const confirmStatus = async () => {
    if (!statusTarget) return
    try {
      if (statusTarget.status === 'ACTIVE') {
        await deactivateRoomType(statusTarget.id)
        notify(`${statusTarget.name} is now inactive and hidden from customers.`, 'success')
      } else {
        await reactivateRoomType(statusTarget.id)
        notify(`${statusTarget.name} is now active. Customer visibility depends on readiness.`, 'success')
      }
    } catch (err) {
      notify(err.message || 'Failed to update status.', 'error')
    } finally {
      setStatusTarget(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteConfirmationText.trim().toLowerCase() !== deleteTarget.name.trim().toLowerCase()) {
      notify('Room type name does not match confirmation.', 'error')
      return
    }

    setDeleting(true)
    try {
      await deleteRoomType(deleteTarget.id)
      notify(`${deleteTarget.name} was permanently deleted.`, 'success')
      setDeleteTarget(null)
      setDeleteConfirmationText('')
    } catch (err) {
      const backendMessage = err?.message || err?.error || ''
      notify(backendMessage || 'This room type has reservation history and cannot be deleted. Deactivate it instead.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="room-management-page">
      {fromHotelSetup && contextHotel && (
        <Link className="room-context-back" to={`/management/hotels/${contextHotel.id}/setup?tab=accommodation`}>
          <ArrowLeft size={15} />Back to {contextHotel.name} Accommodation
        </Link>
      )}
      <header className="room-management-header">
        <div>
          <span>{contextHotel ? `${contextHotel.name} · Accommodation operations` : 'Accommodation operations'}</span>
          <h1>Rooms &amp; Amenities</h1>
          <p>Manage customer-facing Room Types, inventory units and reusable amenities.</p>
        </div>
        {tab === 'types' && isManager && hotels.length > 0 && (selectedHotel || showAllHotels) && (
          <Link
            className="room-primary-action"
            to={`/management/rooms/new${selectedHotel ? `?hotelId=${selectedHotel}${fromHotelSetup ? '&from=hotelSetup' : ''}` : ''}`}
          >
            <Plus size={15} />Add Room Type
          </Link>
        )}
      </header>

      <nav className="room-tabs" aria-label="Room management sections">
        <button type="button" className={tab === 'types' ? 'active' : ''} onClick={() => changeTab('types')}>Room Types</button>
        <button type="button" className={tab === 'amenities' ? 'active' : ''} onClick={() => changeTab('amenities')}>Room Amenities</button>
      </nav>

      {tab === 'amenities' ? (
        <AmenitiesPanel amenities={amenities} roomTypes={roomTypes} actions={{ addAmenity, updateAmenity, activateAmenity, deactivateAmenity, reorderAmenity }} notify={notify} />
      ) : !hotels.length ? (
        <div className="room-empty room-empty--card">
          <p>No hotels are available for room setup.</p>
          {isManager && <Link to="/management/hotels/new">Create Hotel</Link>}
        </div>
      ) : !selectedHotel && !showAllHotels ? (
        <HotelContextPicker
          hotels={filteredHotels}
          allHotelCount={hotels.length}
          destinations={destinations}
          roomTypes={roomTypes}
          filters={{ hotelSearch, setHotelSearch, destinationFilter, setDestinationFilter, hotelStatus, setHotelStatus }}
          setParams={setParams}
        />
      ) : (
        <>
          <div className="room-metrics">
            <Metric icon={BedDouble} label="Room Types" value={filtered.length} />
            <Metric icon={Boxes} label="Active Room Types" value={filtered.filter((room) => room.status === 'ACTIVE').length} />
            <Metric icon={Boxes} label="Total Inventory Units" value={totalUnits} />
            <Metric icon={Boxes} label="Inactive Room Types" value={filtered.filter((room) => room.status === 'INACTIVE').length} />
          </div>

          <div className="room-filters">
            <label className="room-search">
              <span>Search</span>
              <div>
                <Search size={15} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Room type, hotel or bed" />
              </div>
            </label>
            <ManagementSelect
              searchable
              label="Hotel"
              value={showAllHotels ? 'ALL' : selectedHotel}
              onChange={(value) => (value === 'ALL' ? setParams({ scope: 'all' }) : setParams({ hotelId: value }))}
              options={[{ value: 'ALL', label: 'All Hotels overview' }, ...hotels.map((hotel) => ({ value: String(hotel.id), label: hotel.name }))]}
            />
            <ManagementSelect label="Status" value={status} onChange={setStatus} options={selectOptions([['ALL', 'All statuses'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']])} />
            <ManagementSelect label="Minimum Capacity" value={capacity} onChange={setCapacity} options={selectOptions([['ALL', 'Any capacity'], ['2', '2+ Guests'], ['4', '4+ Guests']])} />
            <ManagementSelect label="Bed Type" value={bed} onChange={setBed} options={selectOptions([['ALL', 'All beds'], ...[...new Set(roomTypes.map((room) => room.bedConfiguration).filter(Boolean))]])} />
          </div>

          <div className="room-table-card">
            {roomsLoading ? (
              <div className="room-empty">
                <p>Loading room types…</p>
              </div>
            ) : (
            <>
            <div className="room-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room Type</th>
                    <th>Hotel</th>
                    <th>Capacity</th>
                    <th>Bed Type</th>
                    <th>Current Rate</th>
                    <th>Inventory Units</th>
                    <th>Customer State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((room) => {
                    const hotel = getHotelById(room.hotelId)
                    const destination = destinations.find((item) => String(item.id) === String(hotel?.destinationId))
                    const rate = getCurrentRoomRate(room.id)
                    const visibility = getRoomTypeCustomerVisibility({ room, hotel, physicalRooms, currentRate: rate })
                    const customerState = getCustomerStateCopy(room, visibility)
                    const suffix = fromHotelSetup ? `?from=hotelSetup&hotelId=${room.hotelId}` : ''

                    return (
                      <tr key={room.id}>
                        <td data-label="Room Type">
                          <div className="room-type-cell">
                            <img src={getRoomMainImage(room)} onError={applyImageFallback} alt="" />
                            <span>
                              <strong>{room.name}</strong>
                              <small className={`room-type-status room-type-status--${room.status.toLowerCase()}`}>{room.status}</small>
                            </span>
                          </div>
                        </td>
                        <td data-label="Hotel">
                          <div className="room-table-hotel">
                            <strong>{hotel?.name || 'Unknown Hotel'}</strong>
                            <small>{destination?.name || 'Destination not configured'}</small>
                          </div>
                        </td>
                        <td data-label="Capacity"><strong className="room-table-value">{room.maxGuests} Guests</strong></td>
                        <td data-label="Bed Type"><span className="room-table-value">{room.bedConfiguration}</span></td>
                        <td data-label="Current Rate">
                          <strong className={`room-current-rate${rate ? '' : ' is-missing'}`}>
                            {rate ? formatRateAmount(rate.amount) : 'Rate required'}
                          </strong>
                        </td>
                        <td data-label="Inventory Units">
                          <strong className="room-table-value">{room.inventoryCount ?? 0} Units</strong>
                        </td>
                        <td data-label="Customer State">
                          <div className="room-customer-state">
                            <span className={`room-badge ${customerState.className}`}>{customerState.label}</span>
                            {customerState.reason && <small title={customerState.reason}>{customerState.reason}</small>}
                          </div>
                        </td>
                        <td data-label="Actions">
                          <div className="room-row-actions">
                            <Link className="room-action-view" to={`/management/rooms/${room.id}${suffix}`}>View</Link>
                            <Link to={`/management/rooms/${room.id}/edit${suffix}`}>Edit</Link>
                            {isManager && (
                              <>
                                <button
                                  className={room.status === 'ACTIVE' ? 'room-action-danger' : 'room-action-reactivate'}
                                  type="button"
                                  onClick={() => setStatusTarget(room)}
                                >
                                  {room.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                                </button>
                                <button
                                  className="room-action-danger"
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(room)
                                    setDeleteConfirmationText('')
                                  }}
                                  title="Delete room type"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length && (
              <div className="room-empty">
                <p>{showAllHotels ? 'No Room Types match these filters.' : 'No Room Types have been added for this Hotel.'}</p>
                {isManager && (
                  <Link to={`/management/rooms/new${selectedHotel ? `?hotelId=${selectedHotel}${fromHotelSetup ? '&from=hotelSetup' : ''}` : ''}`}>
                    Add Room Type
                  </Link>
                )}
              </div>
            )}
            </>
            )}
          </div>
        </>
      )}

      {statusTarget && (
        <ManagementDialog
          title={`${statusTarget.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'} ${statusTarget.name}?`}
          description={
            statusTarget.status === 'ACTIVE'
              ? `This Room Type will stop accepting new reservations. Confirmed reservations will remain active.`
              : 'The Room Type will become active. Customer visibility still depends on readiness.'
          }
          onClose={() => setStatusTarget(null)}
          danger={statusTarget.status === 'ACTIVE'}
          actions={
            <>
              <button type="button" onClick={() => setStatusTarget(null)}>Cancel</button>
              <button type="button" className={statusTarget.status === 'ACTIVE' ? 'danger' : ''} onClick={confirmStatus}>
                Confirm {statusTarget.status === 'ACTIVE' ? 'deactivation' : 'reactivation'}
              </button>
            </>
          }
        />
      )}

      {deleteTarget && (
        <ManagementDialog
          title={`Delete Room Type "${deleteTarget.name}"?`}
          description={`Permanent deletion is only allowed if no reservation history exists. To confirm permanent deletion, type "${deleteTarget.name}" below:`}
          onClose={() => setDeleteTarget(null)}
          danger
          actions={
            <>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button
                type="button"
                className="danger"
                disabled={deleting || deleteConfirmationText.trim().toLowerCase() !== deleteTarget.name.trim().toLowerCase()}
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
              placeholder={`Type "${deleteTarget.name}"`}
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

function Metric({ icon: Icon, label, value }) {
  return (
    <article>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function getCustomerStateCopy(room, visibility) {
  if (room.status === 'INACTIVE') return { label: 'INACTIVE', reason: 'New customer bookings disabled', className: 'room-badge--inactive' }
  if (visibility.bookable) return { label: 'BOOKABLE', reason: 'All customer readiness checks pass', className: 'room-badge--active' }
  const failed = visibility.reasons.find((item) => !item.ready)
  const reason = failed?.key === 'hotel'
    ? 'Hotel unpublished'
    : failed?.key === 'rate'
    ? 'Current rate missing'
    : failed?.key === 'inventory'
    ? 'Usable inventory missing'
    : failed?.key === 'image'
    ? 'Main Photo missing'
    : failed?.key === 'basic'
    ? 'Required details missing'
    : failed?.label || 'Readiness action required'
  return { label: 'CUSTOMER HIDDEN', reason, className: 'room-badge--hidden' }
}

function HotelContextPicker({ hotels, allHotelCount, destinations, roomTypes, filters, setParams }) {
  return (
    <section className="room-hotel-picker">
      <div>
        <span>Choose a property</span>
        <h2>Select a Hotel to Manage Rooms</h2>
        <p>Room Types and inventory always remain scoped to the selected Hotel.</p>
      </div>
      <div className="room-hotel-picker-filters">
        <label className="room-search">
          <span>Search Hotels</span>
          <div>
            <Search size={15} />
            <input value={filters.hotelSearch} onChange={(event) => filters.setHotelSearch(event.target.value)} placeholder="Hotel or destination" />
          </div>
        </label>
        <ManagementSelect
          label="Destination"
          searchable
          value={filters.destinationFilter}
          onChange={filters.setDestinationFilter}
          options={[{ value: 'ALL', label: 'All destinations' }, ...destinations.map((item) => ({ value: String(item.id), label: item.name }))]}
        />
        <ManagementSelect
          label="Hotel Status"
          value={filters.hotelStatus}
          onChange={filters.setHotelStatus}
          options={selectOptions([['ALL', 'All statuses'], ['PUBLISHED', 'Published'], ['SETUP', 'Setup / Inactive']])}
        />
      </div>
      <div className="room-hotel-picker-grid">
        {hotels.map((hotel) => (
          <HotelPickerCard
            key={hotel.id}
            hotel={hotel}
            destination={destinations.find((item) => String(item.id) === String(hotel.destinationId))}
            roomTypeCount={roomTypes.filter((room) => String(room.hotelId) === String(hotel.id)).length}
            onSelect={() => setParams({ hotelId: String(hotel.id) })}
          />
        ))}
      </div>
      {!hotels.length && <div className="room-empty"><p>No Hotels match the selected filters.</p></div>}
      <button className="room-all-hotels" type="button" onClick={() => setParams({ scope: 'all' })}>
        View All Hotels Overview ({allHotelCount})
      </button>
    </section>
  )
}

function HotelPickerCard({ hotel, destination, roomTypeCount, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = getHotelMainImage(hotel)
  const published = isPublicHotel(hotel)
  return (
    <button className="room-hotel-card" type="button" onClick={onSelect} aria-label={`Manage rooms for ${hotel.name}`}>
      <span className="room-hotel-card-media">
        {image && !imageFailed ? (
          <img src={image} alt={`${hotel.name} Hotel`} onError={() => setImageFailed(true)} />
        ) : (
          <span className="room-hotel-card-placeholder">
            <Building2 aria-hidden="true" size={26} />
            <small>Main Photo not configured</small>
          </span>
        )}
        <span className={`room-hotel-status${published ? ' room-hotel-status--active' : ''}`}>
          {published ? 'Published' : 'Setup / Inactive'}
        </span>
      </span>
      <span className="room-hotel-card-body">
        <strong>{hotel.name}</strong>
        <span className="room-hotel-destination">
          <MapPin aria-hidden="true" size={13} />
          {destination ? `${destination.name}, Sri Lanka` : 'Destination not configured'}
        </span>
        <small>{roomTypeCount} Room Type{roomTypeCount === 1 ? '' : 's'}</small>
        <span className="room-hotel-manage">Manage Rooms</span>
      </span>
    </button>
  )
}

function AmenitiesPanel({ amenities, roomTypes, actions, notify }) {
  const blank = { name: '', category: '', iconKey: 'sparkles', active: true }
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const ordered = [...amenities].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))

  const submit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const duplicate = amenities.some((item) => String(item.id) !== String(editing || '') && item.name.trim().toLowerCase() === name.toLowerCase())
    if (!name) return setError('Amenity name is required.')
    if (duplicate) return setError('An amenity with this name already exists.')
    if (!form.iconKey) return setError('Choose an icon.')
    if (editing) {
      actions.updateAmenity(editing, { ...form, name })
      notify(`${name} was updated.`, 'success')
    } else {
      actions.addAmenity({ ...form, name })
      notify(`${name} was added.`, 'success')
    }
    setForm(blank)
    setEditing(null)
    setError('')
  }

  const toggle = () => {
    if (target.active) {
      actions.deactivateAmenity(target.id)
      notify(`${target.name} is inactive. Existing Room Type links were preserved.`, 'success')
    } else {
      actions.activateAmenity(target.id)
      notify(`${target.name} is active again.`, 'success')
    }
    setTarget(null)
  }

  return (
    <div className="amenity-layout">
      <form className="amenity-form" onSubmit={submit}>
        <span className="room-eyebrow">Reusable catalogue</span>
        <h2>{editing ? 'Edit Amenity' : 'Add Amenity'}</h2>
        <label>
          <span>Amenity Name *</span>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          <span>Category</span>
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Comfort, Bathroom…" />
        </label>
        <ManagementSelect label="Customer-facing Icon" required value={form.iconKey} onChange={(value) => setForm({ ...form, iconKey: value })} options={selectOptions(ROOM_AMENITY_ICON_OPTIONS)} />
        {error && <p className="room-error" role="alert">{error}</p>}
        <div>
          <button type="submit">{editing ? 'Save Changes' : 'Add Amenity'}</button>
          {editing && (
            <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(blank); setError('') }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <section className="amenity-list">
        <div>
          <span className="room-eyebrow">Display order</span>
          <h2>Room Amenities</h2>
          <p>Inactive amenities remain attached wherever they were already selected.</p>
        </div>
        {ordered.length ? (
          ordered.map((item, index) => {
            const linkedCount = roomTypes.filter((room) => (room.amenityIds || []).includes(item.id)).length
            return (
              <article key={item.id} className={!item.active ? 'is-inactive' : ''}>
                <RoomAmenityIcon iconKey={item.iconKey} size={20} aria-hidden="true" />
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.category || 'Uncategorised'} · {item.active ? 'Active' : 'Inactive'} · {linkedCount} linked Room Type{linkedCount === 1 ? '' : 's'}</small>
                </div>
                <div className="amenity-order">
                  <button type="button" disabled={index === 0} aria-label={`Move ${item.name} up`} onClick={() => actions.reorderAmenity(item.id, -1)}><ArrowUp size={14} /></button>
                  <button type="button" disabled={index === ordered.length - 1} aria-label={`Move ${item.name} down`} onClick={() => actions.reorderAmenity(item.id, 1)}><ArrowDown size={14} /></button>
                </div>
                <div>
                  <button type="button" onClick={() => { setEditing(item.id); setForm({ name: item.name, category: item.category || '', iconKey: item.iconKey || 'sparkles', active: item.active }); setError('') }}>Edit</button>
                  <button type="button" className={item.active ? 'room-action-danger' : ''} onClick={() => setTarget(item)}>{item.active ? 'Deactivate' : 'Reactivate'}</button>
                </div>
              </article>
            )
          })
        ) : (
          <div className="room-empty"><p>No Room Amenities have been configured.</p></div>
        )}
      </section>
      {target && (
        <ManagementDialog
          title={`${target.active ? 'Deactivate' : 'Reactivate'} ${target.name}?`}
          description={target.active ? 'It will not be available for new selections. Existing Room Type links stay intact and display as inactive.' : 'It will be available for selection on Room Types again.'}
          onClose={() => setTarget(null)}
          danger={target.active}
          actions={
            <>
              <button type="button" onClick={() => setTarget(null)}>Cancel</button>
              <button type="button" className={target.active ? 'danger' : ''} onClick={toggle}>Confirm</button>
            </>
          }
        />
      )}
    </div>
  )
}
