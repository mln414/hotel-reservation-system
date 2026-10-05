import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import RoomMediaEditor from '../../components/MediaManager/RoomMediaEditor.jsx'
import useHotels from '../../context/useHotels.js'
import useRooms from '../../context/useRooms.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import { BED_CONFIGURATIONS, ROOM_TYPE_GROUPS, SMOKING_PREFERENCES, VIEW_TYPES } from '../../utils/roomDomain.js'
import { RoomAmenityIcon } from '../../utils/roomAmenityIcons.jsx'
import './RoomManagement.css'

const emptyForm = {
  hotelId: '',
  name: '',
  roomTypeGroupKey: 'STANDARD',
  shortDescription: '',
  fullDescription: '',
  maxGuests: 2,
  adultCapacity: 2,
  childCapacity: 0,
  bedConfiguration: BED_CONFIGURATIONS[0],
  roomSize: '',
  inventoryCount: 5,
  basePrice: 25000,
  viewType: VIEW_TYPES[0],
  status: 'ACTIVE',
  mainImage: '',
  gallery: [],
  amenityIds: [],
  smokingPreference: SMOKING_PREFERENCES[0],
  extraBedSupport: false,
}

const asOptions = (items) => items.map((item) => Array.isArray(item) ? { value: item[0], label: item[1] } : { value: item, label: item })

export default function RoomTypeForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { hotels } = useHotels()
  const { roomTypes, amenities, getRoomById, addRoomType, updateRoomType, roomTypeDrafts, saveRoomTypeDraft, clearRoomTypeDraft } = useRooms()
  const { notify } = useManagementFeedback()
  const existing = id ? getRoomById(id) : null
  const draftKey = id ? `edit-${id}` : `new-${params.get('hotelId') || 'unscoped'}`

  const seed = existing
    ? {
        ...emptyForm,
        ...existing,
        inventoryCount: existing.inventoryCount ?? 5,
        basePrice: existing.basePrice ?? 25000,
        mainImage: existing.mainImage || existing.image,
        gallery: existing.gallery || [],
      }
    : {
        ...emptyForm,
        ...(roomTypeDrafts[draftKey] || location.state?.roomDraft || {}),
        hotelId: location.state?.createdHotelId || roomTypeDrafts[draftKey]?.hotelId || location.state?.roomDraft?.hotelId || params.get('hotelId') || '',
      }

  const [form, setForm] = useState(seed)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const inventorySectionRef = useRef(null)
  const inventoryInputRef = useRef(null)
  const sortedAmenities = useMemo(() => [...amenities].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)), [amenities])

  useEffect(() => {
    saveRoomTypeDraft(draftKey, form)
  }, [draftKey, form, saveRoomTypeDraft])

  useEffect(() => {
    if (params.get('focus') !== 'inventory') return
    const timer = window.setTimeout(() => {
      inventorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      inventoryInputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [params])

  if (id && !existing) {
    return (
      <section className="room-form-page">
        <h1>Room Type Not Found</h1>
        <p>The requested Room Type does not exist.</p>
        <Link to="/management/rooms">Back to Rooms</Link>
      </section>
    )
  }

  const change = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '', capacity: '', inventoryCount: '' }))
  }

  const validate = () => {
    const next = {}
    const max = Number(form.maxGuests)
    const adults = Number(form.adultCapacity)
    const children = Number(form.childCapacity)
    const inv = Number(form.inventoryCount)

    if (!form.hotelId) next.hotelId = 'Hotel is required.'
    if (!form.name.trim()) next.name = 'Room Type Name is required.'
    if (!form.shortDescription.trim()) next.shortDescription = 'Short Description is required.'
    if (!form.fullDescription.trim()) next.fullDescription = 'Full Description is required.'
    if (!Number.isInteger(max) || max < 1) next.maxGuests = 'Maximum Guests must be a whole number of at least 1.'
    if (!Number.isInteger(adults) || adults < 1 || adults > max) next.capacity = 'Adult capacity must be from 1 to Maximum Guests.'
    if (!Number.isInteger(children) || children < 0 || children > max) next.capacity = 'Child capacity must be from 0 to Maximum Guests.'
    if (!Number.isInteger(inv) || inv < 1) next.inventoryCount = 'Inventory count must be a whole number of at least 1.'
    if (form.basePrice !== '' && Number(form.basePrice) < 0) next.basePrice = 'Base price cannot be negative.'
    if (form.roomSize !== '' && (!Number.isFinite(Number(form.roomSize)) || Number(form.roomSize) <= 0)) next.roomSize = 'Room Size must be greater than 0 when provided.'
    if (!form.mainImage) next.mainImage = 'A Main / Cover Photo is required.'

    if (roomTypes.some((room) => String(room.id) !== String(id || '') && String(room.hotelId) === String(form.hotelId) && room.name.trim().toLowerCase() === form.name.trim().toLowerCase())) {
      next.name = 'This Hotel already has a Room Type with this name.'
    }

    setErrors(next)
    return !Object.keys(next).length
  }

  const context = params.get('from') === 'hotelSetup' ? `?from=hotelSetup&hotelId=${form.hotelId || params.get('hotelId')}` : ''

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      notify('Please resolve the highlighted Room Type fields.', 'error')
      return
    }

    const payload = {
      ...form,
      hotelId: Number(form.hotelId),
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      maxGuests: Number(form.maxGuests),
      adultCapacity: Number(form.adultCapacity),
      childCapacity: Number(form.childCapacity),
      inventoryCount: Number(form.inventoryCount || 1),
      basePrice: Number(form.basePrice || 0),
      roomSize: form.roomSize === '' ? null : Number(form.roomSize),
    }

    setSaving(true)
    try {
      if (existing) {
        await updateRoomType(existing.id, payload)
        clearRoomTypeDraft(draftKey)
        notify(`${payload.name} was updated.`, 'success')
        navigate(`/management/rooms/${existing.id}${context}`, { state: { updated: true } })
      } else {
        const created = await addRoomType(payload)
        clearRoomTypeDraft(draftKey)
        notify(`${created.name} was created.`, 'success')
        navigate(`/management/rooms/${created.id}${context}`, { state: { created: true } })
      }
    } catch (err) {
      notify(err.message || 'Failed to save room type.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const back = params.get('from') === 'hotelSetup'
    ? `/management/hotels/${form.hotelId || params.get('hotelId')}/setup?tab=accommodation`
    : existing
    ? `/management/rooms/${existing.id}`
    : `/management/rooms${form.hotelId ? `?hotelId=${form.hotelId}` : ''}`

  const createHotelState = { returnTo: `/management/rooms/new${params.toString() ? `?${params.toString()}` : ''}`, roomDraft: form }

  return (
    <section className="room-form-page">
      <Link className="room-back" to={back}>
        <ArrowLeft size={15} />{params.get('from') === 'hotelSetup' ? 'Back to Hotel Setup' : 'Back'}
      </Link>
      <header className="room-page-header">
        <div>
          <span>Accommodation Type</span>
          <h1>{existing ? 'Edit Room Type' : 'Add Room Type'}</h1>
          <p>Define the room type, capacity, inventory count, and pricing rules.</p>
        </div>
      </header>

      <form className="room-form" onSubmit={submit} noValidate>
        <section id="capacity-inventory" ref={inventorySectionRef} className={`room-form-section ${params.get('focus') === 'inventory' ? 'room-form-section--focused' : ''}`}>
          <h2>Room Information</h2>
          <div className="room-form-grid">
            {existing ? (
              <Field label="Hotel">
                <input value={hotels.find((hotel) => String(hotel.id) === String(form.hotelId))?.name || 'Unknown Hotel'} disabled />
              </Field>
            ) : (
              <div>
                <ManagementSelect
                  searchable
                  label="Hotel"
                  required
                  value={String(form.hotelId)}
                  options={[{ value: '', label: 'Select Hotel' }, ...hotels.map((hotel) => ({ value: String(hotel.id), label: hotel.name }))]}
                  onChange={(value) => change('hotelId', value)}
                  error={errors.hotelId}
                />
                <Link className="room-create-hotel-link" to="/management/hotels/new" state={createHotelState} onClick={() => saveRoomTypeDraft(draftKey, form)}>
                  Hotel not listed? Save this draft and create a Hotel
                </Link>
              </div>
            )}

            <Field label="Room Type Name *" error={errors.name}>
              <input value={form.name} onChange={(event) => change('name', event.target.value)} />
            </Field>

            <ManagementSelect label="Room Category" value={form.roomTypeGroupKey} options={asOptions(ROOM_TYPE_GROUPS)} onChange={(value) => change('roomTypeGroupKey', value)} />

            <Field wide label="Short Description *" error={errors.shortDescription}>
              <textarea rows="2" value={form.shortDescription} onChange={(event) => change('shortDescription', event.target.value)} />
            </Field>

            <Field wide label="Full Description *" error={errors.fullDescription}>
              <textarea rows="5" value={form.fullDescription} onChange={(event) => change('fullDescription', event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="room-form-section">
          <h2>Capacity &amp; Inventory</h2>
          <p className="room-page-help">Configure guest limits and total inventory units. Inventory reductions are protected against existing future reservations.</p>
          <div className="room-form-grid">
            <Field label="Maximum Guests *" error={errors.maxGuests || errors.capacity}>
              <input type="number" min="1" step="1" value={form.maxGuests} onChange={(event) => change('maxGuests', event.target.value)} />
            </Field>

            <Field label="Adult Capacity *" error={errors.capacity}>
              <input type="number" min="1" step="1" value={form.adultCapacity} onChange={(event) => change('adultCapacity', event.target.value)} />
            </Field>

            <Field label="Child Capacity *" error={errors.capacity}>
              <input type="number" min="0" step="1" value={form.childCapacity} onChange={(event) => change('childCapacity', event.target.value)} />
            </Field>

            <Field label="Total Inventory Units *" error={errors.inventoryCount}>
              <input ref={inventoryInputRef} type="number" min="1" step="1" value={form.inventoryCount} onChange={(event) => change('inventoryCount', event.target.value)} />
            </Field>

            <Field label="Base Price (LKR)" error={errors.basePrice}>
              <input type="number" min="0" step="500" value={form.basePrice} onChange={(event) => change('basePrice', event.target.value)} />
            </Field>

            <ManagementSelect label="Bed Configuration" value={form.bedConfiguration} options={asOptions(BED_CONFIGURATIONS)} onChange={(value) => change('bedConfiguration', value)} />

            <Field label="Room Size (m²) — optional" error={errors.roomSize}>
              <input type="number" min="1" value={form.roomSize ?? ''} onChange={(event) => change('roomSize', event.target.value)} />
            </Field>

            <ManagementSelect label="View Type" value={form.viewType} options={asOptions(VIEW_TYPES)} onChange={(value) => change('viewType', value)} />

            <ManagementSelect label="Smoking Preference" value={form.smokingPreference} options={asOptions(SMOKING_PREFERENCES)} onChange={(value) => change('smokingPreference', value)} />

            <label className="room-toggle">
              <input type="checkbox" checked={Boolean(form.extraBedSupport)} onChange={(event) => change('extraBedSupport', event.target.checked)} />
              <span><strong>Extra bed supported</strong><small>Staff may offer an extra bed subject to hotel policy.</small></span>
            </label>
          </div>
        </section>

        <section className="room-form-section" id="amenities">
          <h2>Room Amenities</h2>
          <p className="room-page-help">Choose amenities with their customer-facing icons. Linked inactive amenities stay visible for historical integrity.</p>
          <div className="room-amenity-selector">
            {sortedAmenities.map((amenity) => {
              const selected = form.amenityIds.includes(amenity.id)
              return (
                <label className={`room-amenity-option${selected ? ' is-selected' : ''}${!amenity.active ? ' is-inactive' : ''}`} key={amenity.id}>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!amenity.active && !selected}
                    onChange={(event) => change('amenityIds', event.target.checked ? [...form.amenityIds, amenity.id] : form.amenityIds.filter((value) => value !== amenity.id))}
                  />
                  <RoomAmenityIcon iconKey={amenity.iconKey} size={19} aria-hidden="true" />
                  <span><strong>{amenity.name}</strong><small>{amenity.category || 'Uncategorised'}{!amenity.active ? ' · Inactive' : ''}</small></span>
                </label>
              )
            })}
          </div>
        </section>

        <section className="room-form-section" id="media">
          <h2>Room Type Media</h2>
          <p className="room-page-help">The Main Photo leads customer cards and details; the ordered Gallery follows it.</p>
          <RoomMediaEditor room={form} error={errors.mainImage} onChange={(updates) => setForm((current) => ({ ...current, ...updates }))} />
        </section>

        <div className="room-form-actions">
          <Link to={back}>Cancel</Link>
          <button className="room-button" type="submit" disabled={saving}>
            <Save size={15} />{saving ? 'Saving...' : existing ? 'Save Changes' : 'Create Room Type'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, error, wide, children }) {
  return (
    <label className={`room-field${wide ? ' room-field--wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small className="room-error" role="alert">{error}</small>}
    </label>
  )
}
