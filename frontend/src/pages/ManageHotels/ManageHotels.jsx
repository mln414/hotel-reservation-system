// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import { ArrowDown, ArrowUp, Building2, Check, CircleCheck, Clock3, Eye, ImagePlus, Pencil, Plus, Power, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import useRates from '../../context/useRates.js'
import useRooms from '../../context/useRooms.js'
import useStayCollections from '../../context/useStayCollections.js'
import { HOTEL_PUBLICATION_STATUS, HOTEL_SETUP_STATUS } from '../../constants/hotelManagement.js'
import { COLLECTION_ICON_OPTIONS, getCollectionIcon } from '../../utils/collectionIcons.jsx'
import { getHotelSetupReadiness } from '../../utils/hotelManagement.js'
import { applyImageFallback, getHotelMainImage } from '../../utils/hotelMedia.js'
import { getCollectionHotelCount } from '../../utils/stayCollectionDomain.js'
import './ManageHotels.css'

const emptyFilters = { search: '', destination: '', setup: '', publication: '', propertyType: '', collection: '' }
const emptyCollection = { title: '', slug: '', shortDescription: '', iconKey: 'GEM', coverImage: '', status: 'ACTIVE', showOnHome: true }
const option = (value, label = value) => ({ value, label })
const relativeUpdated = (value) => {
  if (!value) return 'Seed record'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} min ago`
  if (minutes < 1440) return `Updated ${Math.round(minutes / 60)} hr ago`
  return `Updated ${new Date(value).toLocaleDateString('en-GB')}`
}

export default function ManageHotels() {
  const { user } = useAuth()
  const { hotels, destinations, hotelsLoading, hotelsError, hotelActionError, setHotelPublicationStatus, deleteHotel } = useHotels()
  const { rooms } = useRooms()
  const { roomRates } = useRates()
  const { collections } = useStayCollections()
  const [params, setParams] = useSearchParams()
  const section = params.get('section') === 'collections' ? 'collections' : 'properties'
  const [filters, setFilters] = useState({ ...emptyFilters, setup: params.get('setup') || '' })
  const [statusHotel, setStatusHotel] = useState(null)
  const [publishHotel, setPublishHotel] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmName, setConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  const isManager = user?.role === 'MANAGER'
  const propertyTypes = [...new Set(hotels.map((hotel) => hotel.propertyType).filter(Boolean))].sort()
  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    if (!isManager && user?.assignedHotelId && String(hotel.id) !== String(user.assignedHotelId)) {
      return false
    }
    const search = filters.search.trim().toLowerCase()
    return (!search || `${hotel.name} ${hotel.destination} ${hotel.id}`.toLowerCase().includes(search))
      && (!filters.destination || String(hotel.destinationId) === filters.destination)
      && (!filters.setup || hotel.setupStatus === filters.setup)
      && (!filters.publication || hotel.publicationStatus === filters.publication)
      && (!filters.propertyType || hotel.propertyType === filters.propertyType)
      && (!filters.collection || (hotel.collectionIds || []).some((id) => String(id) === filters.collection))
  }), [hotels, filters, user, isManager])

  const counts = {
    total: hotels.length,
    published: hotels.filter((hotel) => hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE && hotel.setupStatus === HOTEL_SETUP_STATUS.COMPLETE).length,
    pending: hotels.filter((hotel) => hotel.setupStatus === HOTEL_SETUP_STATUS.PENDING).length,
    inactive: hotels.filter((hotel) => hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.INACTIVE).length,
  }
  const selectOptions = {
    destination: [option('', 'All destinations'), ...destinations.map((item) => option(String(item.id), item.name))],
    setup: [option('', 'All setup statuses'), option(HOTEL_SETUP_STATUS.PENDING, 'Setup in progress'), option(HOTEL_SETUP_STATUS.COMPLETE, 'Setup complete')],
    publication: [option('', 'All visibility'), option(HOTEL_PUBLICATION_STATUS.ACTIVE, 'Published'), option(HOTEL_PUBLICATION_STATUS.INACTIVE, 'Hidden / inactive')],
    propertyType: [option('', 'All property types'), ...propertyTypes.map((item) => option(item))],
    collection: [option('', 'All collections'), ...collections.map((item) => option(String(item.id), item.title))],
  }
  const activeFilters = Object.entries(filters).filter(([, value]) => value)
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const openSection = (next) => { const query = new URLSearchParams(params); if (next === 'collections') query.set('section', 'collections'); else query.delete('section'); setParams(query) }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || confirmName !== deleteTarget.name || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteHotel(deleteTarget.id, confirmName)
      setMessage(`Hotel '${deleteTarget.name}' was permanently deleted.`)
      setDeleteTarget(null)
      setConfirmName('')
    } catch (err) {
      setMessage(err.message || 'Failed to delete hotel.')
    } finally {
      setIsDeleting(false)
    }
  }

  const changePublication = async (hotel, publicationStatus, successMessage) => {
    try {
      await setHotelPublicationStatus(hotel.id, publicationStatus)
      setMessage(successMessage)
      setPublishHotel(null)
      setStatusHotel(null)
    } catch (error) {
      setMessage(error.message || 'Unable to change Hotel publication status.')
    }
  }

  return (
    <section className="manage-hotels-page">
      <header className="manage-hotels-header">
        <div>
          <span>Property Management</span>
          <h1>Hotels</h1>
          <p>Create, configure, publish and manage LankaStay properties.</p>
        </div>
        {section === 'properties' && isManager && <Link className="manage-primary-action" to="/management/hotels/new"><Plus size={18} />Add Hotel</Link>}
      </header>
      <nav className="hotel-domain-tabs" aria-label="Hotel management sections">
        <button type="button" className={section === 'properties' ? 'active' : ''} onClick={() => openSection('properties')}>Properties</button>
        <button type="button" className={section === 'collections' ? 'active' : ''} onClick={() => openSection('collections')}>Stay Collections</button>
      </nav>

      {section === 'collections' ? <CollectionsManagement hotels={hotels} /> : <>
        {hotelsLoading && <p className="hotel-workspace-status" role="status">Loading hotels...</p>}
        {hotelsError && <p className="property-error" role="alert">Unable to load hotel information. Please try again. {hotelsError}</p>}
        {hotelActionError && <p className="property-error" role="alert">{hotelActionError}</p>}
        {message && <p className="hotel-workspace-status" role="status" aria-live="polite">{message}</p>}
        <div className="manage-hotel-metrics">
          {[['Total Hotels', counts.total, Building2], ['Published Hotels', counts.published, CircleCheck], ['Setup In Progress', counts.pending, Clock3], ['Inactive / Hidden', counts.inactive, Power]].map(([label, value, Icon]) => (
            <article key={label}>
              <span><Icon size={20} /></span>
              <div><small>{label}</small><strong>{value}</strong></div>
            </article>
          ))}
        </div>

        <div className="manage-hotel-filters" aria-label="Hotel list filters">
          <label className="manage-search-field">
            <span>Search</span>
            <div><Search size={17} /><input value={filters.search} placeholder="Hotel, destination or ID" onChange={(event) => update('search', event.target.value)} /></div>
          </label>
          <ManagementSelect label="Destination" value={filters.destination} options={selectOptions.destination} onChange={(value) => update('destination', value)} />
          <ManagementSelect label="Setup Status" value={filters.setup} options={selectOptions.setup} onChange={(value) => update('setup', value)} />
          <ManagementSelect label="Publication" value={filters.publication} options={selectOptions.publication} onChange={(value) => update('publication', value)} />
          <ManagementSelect label="Property Type" value={filters.propertyType} options={selectOptions.propertyType} onChange={(value) => update('propertyType', value)} />
          <ManagementSelect label="Stay Collection" value={filters.collection} options={selectOptions.collection} onChange={(value) => update('collection', value)} />
        </div>

        {activeFilters.length > 0 && (
          <div className="hotel-filter-chips" aria-label="Applied filters">
            {activeFilters.map(([key, value]) => (
              <button type="button" key={key} onClick={() => update(key, '')}>
                {key === 'search' ? `Search: ${value}` : `${({ destination: 'Destination', setup: 'Setup', publication: 'Publication', propertyType: 'Property Type', collection: 'Collection' })[key]}: ${selectOptions[key]?.find((item) => item.value === value)?.label || value}`}
                <X size={13} />
              </button>
            ))}
            <button className="clear" type="button" onClick={() => setFilters(emptyFilters)}>Clear All</button>
          </div>
        )}

        <article className="manage-hotel-table-card">
          <div className="manage-hotel-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th>Destination</th>
                  <th>Property Type</th>
                  <th>Setup</th>
                  <th>Publication</th>
                  <th>Rooms</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const readiness = getHotelSetupReadiness(hotel, destinations, rooms, roomRates)
                  const roomCount = rooms.filter((room) => String(room.hotelId) === String(hotel.id)).length
                  const isLive = hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE && readiness.canPublish
                  const visibilityLabel = isLive ? 'Published / Live' : hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE ? 'Hidden' : readiness.canPublish ? 'Ready to Publish' : 'Draft'
                  const firstKey = readiness.incompleteRequired[0]?.key
                  const firstTab = ({ basic: 'overview', destination: 'overview', contact: 'overview', location: 'overview', rate: 'rates', accommodation: 'accommodation', facilities: 'facilities', gallery: 'gallery', policies: 'policies', about: 'about' })[firstKey] || 'overview'
                  const setupHref = `/management/hotels/${hotel.id}/setup${firstTab === 'overview' ? '' : `?tab=${firstTab}`}`

                  return (
                    <tr key={hotel.id}>
                      <td data-label="Hotel">
                        <div className="manage-hotel-name">
                          <img src={getHotelMainImage(hotel)} onError={applyImageFallback} alt={`${hotel.name} main`} />
                          <div><strong>{hotel.name}</strong><small>#{hotel.id}</small></div>
                        </div>
                      </td>
                      <td data-label="Destination">{hotel.destination}</td>
                      <td data-label="Property Type">{hotel.propertyType}</td>
                      <td data-label="Setup">
                        <span className={`hotel-state-badge hotel-state-badge--${readiness.canPublish ? 'complete' : 'pending'}`}>
                          {readiness.canPublish ? 'Setup Complete' : `Setup In Progress · ${readiness.percentage}%`}
                        </span>
                      </td>
                      <td data-label="Publication">
                        <span className={`hotel-state-badge hotel-state-badge--${isLive ? 'active' : 'inactive'}`}>
                          {visibilityLabel}
                        </span>
                      </td>
                      <td data-label="Rooms">{roomCount} {roomCount === 1 ? 'Room Type' : 'Room Types'}</td>
                      <td data-label="Last Updated">
                        <span className="hotel-updated">{relativeUpdated(hotel.updatedAt)}<small>{hotel.lastUpdatedSection || 'Initial data'}</small></span>
                      </td>
                      <td data-label="Actions">
                        <div className="manage-hotel-actions">
                          {!readiness.canPublish ? (
                            <>
                              <Link className="primary-action" to={setupHref}>Continue Setup</Link>
                              <Link aria-label={`Preview ${hotel.name}`} title={`Preview ${hotel.name}`} to={`/management/hotels/${hotel.id}/preview`}><Eye size={16} /></Link>
                              {user?.role === 'MANAGER' && hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE && (
                                <button className="tertiary-action" type="button" onClick={() => setStatusHotel(hotel)}>Deactivate</button>
                              )}
                              {user?.role === 'MANAGER' && (
                                <button className="danger-action" type="button" aria-label={`Delete ${hotel.name}`} title={`Delete ${hotel.name}`} onClick={() => { setDeleteTarget(hotel); setConfirmName('') }}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          ) : !isLive ? (
                            <>
                              {user?.role === 'MANAGER' ? (
                                <button className="primary-action" type="button" onClick={() => setPublishHotel(hotel)}>Publish Hotel</button>
                              ) : (
                                <Link className="primary-action" to={`/management/hotels/${hotel.id}/setup`}>Manage Hotel</Link>
                              )}
                              <Link to={`/management/hotels/${hotel.id}/setup`}>Manage Hotel</Link>
                              <Link aria-label={`Preview ${hotel.name}`} title={`Preview ${hotel.name}`} to={`/management/hotels/${hotel.id}/preview`}><Eye size={16} /></Link>
                              {user?.role === 'MANAGER' && (
                                <button className="danger-action" type="button" aria-label={`Delete ${hotel.name}`} title={`Delete ${hotel.name}`} onClick={() => { setDeleteTarget(hotel); setConfirmName('') }}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <Link className="primary-action" to={`/management/hotels/${hotel.id}/setup`}>Manage Hotel</Link>
                              <Link aria-label={`Preview ${hotel.name}`} title={`Preview ${hotel.name}`} to={`/management/hotels/${hotel.id}/preview`}><Eye size={16} /></Link>
                              {user?.role === 'MANAGER' && (
                                <button className="tertiary-action" type="button" onClick={() => setStatusHotel(hotel)}>Deactivate</button>
                              )}
                              {user?.role === 'MANAGER' && (
                                <button className="danger-action" type="button" aria-label={`Delete ${hotel.name}`} title={`Delete ${hotel.name}`} onClick={() => { setDeleteTarget(hotel); setConfirmName('') }}>
                                  <Trash2 size={16} />
                                </button>
                              )}
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
          {!filteredHotels.length && <p className="manage-hotel-empty">No Hotels match the selected filters. Clear filters to view all properties.</p>}
        </article>
      </>}

      {publishHotel && (
        <ManagementDialog
          title={`Publish ${publishHotel.name}?`}
          description="This Hotel will become available on customer-facing Hotel discovery and details pages immediately."
          onClose={() => setPublishHotel(null)}
          actions={<>
            <button type="button" onClick={() => setPublishHotel(null)}>Cancel</button>
            <button className="primary" type="button" onClick={() => changePublication(publishHotel, HOTEL_PUBLICATION_STATUS.ACTIVE, `${publishHotel.name} published successfully.`)}>Publish Hotel</button>
          </>}
        />
      )}

      {statusHotel && (
        <ManagementDialog
          danger
          title={`Deactivate ${statusHotel.name}?`}
          description="This Hotel will be hidden from customer discovery and new bookings. Existing records and relationships will be retained."
          onClose={() => setStatusHotel(null)}
          actions={<>
            <button type="button" onClick={() => setStatusHotel(null)}>Keep Published</button>
            <button className="danger" type="button" onClick={() => changePublication(statusHotel, HOTEL_PUBLICATION_STATUS.INACTIVE, `${statusHotel.name} deactivated. The management record and relationships were retained.`)}>Deactivate Hotel</button>
          </>}
        />
      )}

      {deleteTarget && (
        <ManagementDialog
          danger
          title={`Delete ${deleteTarget.name}?`}
          description={`This action will permanently remove ${deleteTarget.name} and all associated rooms, rates, reservations, reviews, gallery, facilities, policies and offer links from the database. This action CANNOT be undone.`}
          onClose={() => { if (!isDeleting) setDeleteTarget(null) }}
          actions={<>
            <button type="button" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              className="danger"
              type="button"
              disabled={confirmName !== deleteTarget.name || isDeleting}
              onClick={handleDeleteConfirm}
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </>}
        >
          <div className="hotel-delete-confirm-field">
            <label htmlFor="confirm-hotel-name">
              Type <strong>{deleteTarget.name}</strong> to confirm deletion:
            </label>
            <input
              id="confirm-hotel-name"
              type="text"
              value={confirmName}
              placeholder={deleteTarget.name}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={isDeleting}
              autoFocus
            />
          </div>
        </ManagementDialog>
      )}
    </section>
  )
}

function CollectionsManagement({ hotels }) {
  const { collections, isDuplicateName, addCollection, updateCollection, deactivateCollection, reactivateCollection, reorderCollections } = useStayCollections()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCollection)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deactivating, setDeactivating] = useState(null)
  const ordered = [...collections].sort((a, b) => a.displayOrder - b.displayOrder)

  const beginEdit = (item) => {
    setEditing(item.id)
    setForm({ title: item.title, slug: item.slug, shortDescription: item.shortDescription, iconKey: item.iconKey, coverImage: item.coverImage, status: item.status, showOnHome: item.showOnHome })
    setError('')
    document.querySelector('#collection-editor')?.scrollIntoView({ behavior: 'smooth' })
  }
  const reset = () => { setEditing(null); setForm(emptyCollection); setError('') }
  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return setError('Collection Name is required.')
    if (!form.shortDescription.trim()) return setError('Short Description is required.')
    if (!form.coverImage) return setError('Cover Image is required.')
    if (isDuplicateName(form.title, editing)) return setError('An active Collection with this name already exists.')
    const existing = collections.find((item) => String(item.id) === String(editing))
    if (existing?.status === 'ACTIVE' && form.status === 'INACTIVE') { setDeactivating(existing); return setError('Confirm deactivation in the dialog, then save other edits separately.') }
    if (editing) updateCollection(editing, form); else addCollection(form)
    setMessage(`Collection ${editing ? 'updated' : 'created'}.`)
    reset()
  }
  const changeImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return setError('Use a JPG, PNG or WebP Cover Image no larger than 5 MB.')
    setForm((current) => ({ ...current, coverImage: URL.createObjectURL(file) }))
    setError('')
  }

  return (
    <div className="collections-management">
      <div className="collections-management-heading">
        <div><span>Home discovery</span><h2>Stay Collections</h2><p>Manage the image-led categories guests use in Browse by Collection.</p></div>
        <button type="button" onClick={() => { reset(); document.querySelector('#collection-editor')?.scrollIntoView({ behavior: 'smooth' }) }}><Plus size={16} />Create Collection</button>
      </div>
      {message && <p className="hotel-workspace-status" role="status">{message}</p>}
      <div className="management-collection-grid">
        {ordered.map((item, index) => {
          const Icon = getCollectionIcon(item.iconKey)
          const hotelCount = getCollectionHotelCount(hotels, item.id)
          return (
            <article key={item.id}>
              <div className="management-collection-media">
                <img src={item.coverImage} alt={`${item.title} cover`} onError={applyImageFallback} />
                <span><Icon size={20} /></span>
                <small className={item.status === 'ACTIVE' ? 'active' : ''}>{item.status}</small>
              </div>
              <div className="management-collection-body">
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>
                <strong>{hotelCount} {hotelCount === 1 ? 'Hotel' : 'Hotels'} · {item.showOnHome ? 'Shown on Home' : 'Hidden from Home'}</strong>
                <div>
                  <button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => reorderCollections(item.id, -1)}><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Move ${item.title} down`} disabled={index === ordered.length - 1} onClick={() => reorderCollections(item.id, 1)}><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => beginEdit(item)}><Pencil size={14} />Edit</button>
                  <button type="button" onClick={() => item.status === 'ACTIVE' ? setDeactivating(item) : reactivateCollection(item.id)}>{item.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <form id="collection-editor" className="collection-editor" onSubmit={submit}>
        <div><span>Collection record</span><h2>{editing ? 'Edit Stay Collection' : 'Create Stay Collection'}</h2></div>
        <div className="collection-form-grid">
          <label><span>Collection Name *</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} placeholder="Generated from name" onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
          <label className="wide"><span>Short Description *</span><textarea rows="3" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label>
          <fieldset className="wide collection-icon-picker">
            <legend>Icon *</legend>
            {COLLECTION_ICON_OPTIONS.map((item) => {
              const Icon = item.icon
              return (
                <button type="button" key={item.value} aria-pressed={form.iconKey === item.value} className={form.iconKey === item.value ? 'selected' : ''} onClick={() => setForm({ ...form, iconKey: item.value })}>
                  <Icon size={21} /><span>{item.label}</span>{form.iconKey === item.value && <Check size={14} />}
                </button>
              )
            })}
          </fieldset>
          <label className="wide collection-cover-field">
            <span>Cover Image *</span>
            <div>
              {form.coverImage ? <img src={form.coverImage} alt="Collection Cover preview" /> : <span><ImagePlus size={28} />No Cover selected</span>}
              <label><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={changeImage} /><ImagePlus size={16} />{form.coverImage ? 'Change Cover Image' : 'Choose Cover Image'}</label>
            </div>
          </label>
          <ManagementSelect label="Status" value={form.status} options={[option('ACTIVE', 'Active'), option('INACTIVE', 'Inactive')]} onChange={(value) => setForm({ ...form, status: value })} />
          <label className="collection-home-toggle"><input type="checkbox" checked={form.showOnHome} onChange={(event) => setForm({ ...form, showOnHome: event.target.checked })} /><span>Show on Home Browse by Collection</span></label>
        </div>
        {error && <p className="collection-form-error" role="alert">{error}</p>}
        <div className="collection-form-actions">
          {editing && <button type="button" onClick={reset}>Cancel</button>}
          <button className="primary" type="submit">{editing ? 'Save Collection' : 'Create Collection'}</button>
        </div>
      </form>
      {deactivating && (
        <ManagementDialog
          danger
          title={`Deactivate ${deactivating.title}?`}
          description="The Collection will be hidden from Home. Hotel relationships are retained until manually changed."
          onClose={() => setDeactivating(null)}
          actions={<>
            <button type="button" onClick={() => setDeactivating(null)}>Cancel</button>
            <button className="primary" type="button" onClick={() => { deactivateCollection(deactivating.id); setDeactivating(null); setMessage('Collection deactivated. Hotel relationships were retained.') }}>Deactivate Collection</button>
          </>}
        />
      )}
    </div>
  )
}
