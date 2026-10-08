// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import { ShieldAlert, ArrowLeft, BedDouble, Boxes, CalendarClock, CalendarRange, CheckCircle2, DoorOpen, Eye, EyeOff, Image as ImageIcon, MapPinned, PauseCircle, Pencil, RotateCcw, Save, TimerOff, TriangleAlert, Upload, Users, Video, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { HOTEL_PUBLICATION_STATUS, HOTEL_SETUP_SECTIONS } from '../../constants/hotelManagement.js'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import usePropertyContent from '../../context/usePropertyContent.js'
import useRooms from '../../context/useRooms.js'
import useRates from '../../context/useRates.js'
import useReservations from '../../context/useReservations.js'
import useReviews from '../../context/useReviews.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import { formatOfferDiscount, getOfferTargetSummary, offerAppliesToHotel } from '../../utils/offerEligibility.js'
import { getOfferStatus } from '../../utils/offerFormatting.js'
import { getHotelSetupReadiness } from '../../utils/hotelManagement.js'
import HotelContentManager from './HotelContentManager.jsx'
import HotelMediaManager from './HotelMediaManager.jsx'
import HotelFacilitiesManager from './HotelFacilitiesManager.jsx'
import HotelBasicInformation from './HotelBasicInformation.jsx'
import HotelPoliciesManager from './HotelPoliciesManager.jsx'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import MapLocationPicker from '../../components/MapLocationPicker/MapLocationPicker.jsx'
import './HotelSetup.css'
import './HotelSetupVideo.css'

const tabs = ['overview', 'about', 'accommodation', 'rates', 'dining', 'facilities', 'experiences', 'offers', 'gallery', 'policies']
const labels = { overview: 'Overview', about: 'About', accommodation: 'Accommodation', rates: 'Rates', dining: 'Dining', facilities: 'Facilities', experiences: 'Experiences', offers: 'Offers', gallery: 'Gallery', policies: 'Policies' }

export default function HotelSetup() {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { getHotelById, destinations, hotelsLoading, hotelsError, updateSetupSection, setHotelPublicationStatus } = useHotels()
  const { rooms, physicalRooms, deactivateRoomType, reactivateRoomType } = useRooms()
  const { roomRates, hotelRates, getCurrentRoomRate } = useRates()
  const hotel = getHotelById(id)
  const [status, setStatus] = useState(location.state?.created ? 'Basic hotel information has been created for this development session. Complete the property setup before publishing.' : '')
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const activeTab = tabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'

  if (hotelsLoading) return <section className="hotel-workspace-missing" role="status"><h1>Loading hotel...</h1></section>
  if (hotelsError) return <section className="hotel-workspace-missing" role="alert"><h1>Unable to load hotel information. Please try again.</h1><p>{hotelsError}</p><Link to="/management/hotels">Back to Hotels</Link></section>
  if (!hotel) return <section className="hotel-workspace-missing"><h1>Hotel not found.</h1><Link to="/management/hotels">Back to Hotels</Link></section>

  const isManager = user?.role === 'MANAGER'
  const readiness = getHotelSetupReadiness(hotel, destinations, rooms, roomRates)
  const isPublished = hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE && readiness.canPublish
  const selectTab = (tab) => setSearchParams(tab === 'overview' ? {} : { tab })
  const publish = () => {
    if (!isManager || !readiness.canPublish) return
    setShowPublish(true)
  }
  const confirmPublish = async () => {
    try { await setHotelPublicationStatus(hotel.id, HOTEL_PUBLICATION_STATUS.ACTIVE); setShowPublish(false); setStatus(`${hotel.name} published successfully and is now available to customers.`) }
    catch (error) { setStatus(error.message || 'Unable to publish this Hotel.') }
  }
  const confirmDeactivate = async () => {
    try { await setHotelPublicationStatus(hotel.id, HOTEL_PUBLICATION_STATUS.INACTIVE); setShowDeactivate(false); setStatus('Hotel deactivated. Shared records and relationships were retained.') }
    catch (error) { setStatus(error.message || 'Unable to deactivate this Hotel.') }
  }

  return <section className="hotel-workspace">
    <Link className="hotel-workspace-back" to="/management/hotels"><ArrowLeft aria-hidden="true" size={16} />All Hotels</Link>
    <header className="hotel-workspace-header"><div className="hotel-workspace-identity"><img src={hotel.mainImage || hotel.image} alt="" /><div><span>Property workspace · #{hotel.id}</span><h1>{hotel.name}</h1><p>{hotel.destination || 'Destination not configured'} · {hotel.propertyType || hotel.category}</p><div className="hotel-workspace-badges"><strong>{readiness.setupStatus === 'SETUP_COMPLETE' ? 'Setup Complete' : `Setup In Progress · ${readiness.percentage}%`}</strong><strong className={isPublished ? 'live' : ''}>{isPublished ? 'Published / Live' : hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE ? 'Hidden' : readiness.canPublish ? 'Ready to Publish' : 'Draft'}</strong></div></div></div><div className="hotel-workspace-actions"><Link to={`/management/hotels/${hotel.id}/preview`}><Eye aria-hidden="true" size={16} />Preview Hotel</Link>{isManager ? (isPublished ? <button type="button" onClick={() => setShowDeactivate(true)}>Deactivate</button> : readiness.canPublish ? <button className="hotel-publish-button" type="button" onClick={publish}>Publish Hotel</button> : <button className="hotel-publish-button" type="button" onClick={() => selectTab(({ destination: 'overview', location: 'overview' }[readiness.incompleteRequired[0]?.key] || readiness.incompleteRequired[0]?.key || 'overview'))}>Continue Setup</button>) : <button className="hotel-publish-button" type="button" onClick={() => selectTab(({ destination: 'overview', location: 'overview' }[readiness.incompleteRequired[0]?.key] || readiness.incompleteRequired[0]?.key || 'overview'))}>Continue Setup</button>}</div></header>
    {!isManager && !isPublished && (
      <div className="hotel-staff-inactive-banner" role="alert">
        <ShieldAlert size={18} />
        <span>Property inactive — edits can be prepared, but only a Manager can reactivate this property.</span>
      </div>
    )}
    {status && <p className="hotel-workspace-status" role="status" aria-live="polite">{status}</p>}
    <nav className="hotel-workspace-tabs" aria-label="Hotel setup sections" role="tablist">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => selectTab(tab)}>{labels[tab]}</button>)}</nav>
    <div className="hotel-workspace-content" role="tabpanel">
      {activeTab === 'overview' && <Overview hotel={hotel} readiness={readiness} destinations={destinations} updateSetupSection={updateSetupSection} selectTab={selectTab} publish={publish} isPublished={isPublished} />}
      {activeTab === 'about' && <AboutEditor hotel={hotel} updateSetupSection={updateSetupSection} selectTab={selectTab} />}
      {activeTab === 'accommodation' && <Accommodation hotel={hotel} hotelRooms={readiness.hotelRooms} physicalRooms={physicalRooms} deactivateRoomType={deactivateRoomType} reactivateRoomType={reactivateRoomType} getCurrentRoomRate={getCurrentRoomRate} />}
      {activeTab === 'rates' && <HotelRatesTab hotel={hotel} hotelRooms={readiness.hotelRooms} hotelRates={hotelRates} getCurrentRoomRate={getCurrentRoomRate} onContinue={selectTab} />}
      {activeTab === 'dining' && <HotelContentManager hotel={hotel} kind="dining" onContinue={selectTab} />}
      {activeTab === 'facilities' && <HotelFacilitiesManager hotel={hotel} updateSetupSection={updateSetupSection} onContinue={selectTab} />}
      {activeTab === 'experiences' && <HotelContentManager hotel={hotel} kind="experiences" onContinue={selectTab} />}
      {activeTab === 'offers' && <HotelOffersTab hotel={hotel} onContinue={selectTab} />}
      {activeTab === 'gallery' && <HotelMediaManager hotel={hotel} updateSetupSection={updateSetupSection} onContinue={selectTab} />}
      {activeTab === 'policies' && <HotelPoliciesManager hotel={hotel} readiness={readiness} onPublish={publish} />}
    </div>{showPublish && <ManagementDialog title={`Publish ${hotel.name}?`} description="This property will become available on customer-facing Hotel discovery and details pages immediately." onClose={() => setShowPublish(false)} actions={<><button type="button" onClick={() => setShowPublish(false)}>Cancel</button><button className="primary" type="button" onClick={confirmPublish}>Publish Hotel</button></>} />}{showDeactivate && <ManagementDialog danger title={`Deactivate ${hotel.name}?`} description="This Hotel will be hidden from customer discovery and new bookings. Rooms, rates, reservations and content remain retained." onClose={() => setShowDeactivate(false)} actions={<><button type="button" onClick={() => setShowDeactivate(false)}>Keep Published</button><button className="primary" type="button" onClick={confirmDeactivate}>Deactivate Hotel</button></>} />}
  </section>
}

function Overview({ hotel, readiness, destinations, updateSetupSection, selectTab, publish, isPublished }) {
  const { physicalRooms } = useRooms(); const { roomRates } = useRates(); const { reservations } = useReservations(); const { reviews } = useReviews(); const { diningItems, experiences, offers } = usePropertyContent()
  const roomTypeIds = new Set(readiness.hotelRooms.map((room) => String(room.id)))
  const hotelDining = diningItems.filter((item) => String(item.hotelId) === String(hotel.id))
  const hotelExperiences = experiences.filter((item) => item.contentType === 'EXPERIENCE' && (String(item.hotelId) === String(hotel.id) || (item.relatedHotelIds || []).some((value) => String(value) === String(hotel.id))))
  const hotelOffers = offers.filter((offer) => offerAppliesToHotel(offer, hotel.id, readiness.hotelRooms))
  const activeRates = roomRates.filter((rate) => roomTypeIds.has(String(rate.roomTypeId)) && rate.status === 'ACTIVE')
  const next = readiness.incompleteRequired[0]
  const nextCopy = { basic: 'Complete the Hotel name, property type and customer summary.', destination: 'Choose an active destination.', contact: 'Add a valid Hotel email or phone number.', about: 'Add the full customer-facing Hotel description.', accommodation: 'No active room type is configured. Add at least one active Room Type before publication.', rate: 'Configure a valid active Room Type rate.', location: 'Add the active destination, City / Area and property address.', facilities: 'Select at least one active shared Facility.', gallery: 'Choose a main cover image.', policies: 'Add at least one active policy.' }
  const metrics = [['Room Types', readiness.hotelRooms.length], ['Physical Rooms', physicalRooms.filter((room) => String(room.hotelId) === String(hotel.id)).length], ['Active Rates', activeRates.length], ['Dining Venues', hotelDining.length], ['Facilities', (hotel.facilityIds || []).length], ['Experiences', hotelExperiences.length], ['Active Offers', hotelOffers.filter((item) => item.active).length], ['Gallery Images', (hotel.gallery || []).length + (hotel.mainImage || hotel.image ? 1 : 0)]]
  const modules = [['About', 'about', hotel.detailDescription ? 'Configured' : 'Required'], ['Accommodation', 'accommodation', `${readiness.hotelRooms.length} room types`], ['Rates', 'rates', `${activeRates.length} active`], ['Dining', 'dining', `${hotelDining.length} venues`], ['Facilities', 'facilities', `${(hotel.facilityIds || []).length} selected`], ['Experiences', 'experiences', `${hotelExperiences.length} records`], ['Offers', 'offers', `${hotelOffers.length} applicable`], ['Gallery', 'gallery', `${(hotel.gallery || []).length} gallery images`], ['Policies', 'policies', `${(hotel.policyRecords || []).filter((item) => item.status === 'ACTIVE').length} active`]]
  const summaries = { basic: hotel.shortDescription ? 'Identity and customer summary configured' : 'Hotel identity incomplete', destination: hotel.destination || 'No active destination selected', contact: hotel.email || hotel.phone || 'Email or phone required', about: hotel.detailDescription ? 'Customer description configured' : 'Full description required', location: hotel.address ? `${hotel.city || 'City missing'} · ${hotel.address}` : 'City and address required', facilities: `${(hotel.facilityIds || []).length} selected`, accommodation: `${readiness.activeRooms.length} active room types`, rate: `${activeRates.length} active rate records`, gallery: `${(hotel.gallery || []).length} images · ${hotel.mainImage || hotel.image ? 'Cover selected' : 'Cover missing'}`, policies: `${(hotel.policyRecords || []).filter((item) => item.status === 'ACTIVE').length} active policies` }
  const optional = [['Dining', 'dining', hotelDining.filter((item) => item.active).length, 'active venues'], ['Experiences', 'experiences', hotelExperiences.filter((item) => item.active).length, 'active experiences'], ['Offers', 'offers', hotelOffers.filter((item) => item.active && getOfferStatus(item) !== 'Expired').length, 'current offers'], ['Video', 'about', hotel.video ? 1 : 0, hotel.video ? 'configured' : 'not configured']]
  return <div className="hotel-overview-refined">
    <article className={`next-required-card${next ? '' : ' complete'}`}><div><span>{next ? 'Next required action' : 'Ready to publish'}</span><strong>{next ? `${next.label} required` : isPublished ? 'This Hotel is live' : 'All required setup is complete'}</strong><p>{next ? nextCopy[next.key] || `Complete ${next.label} to continue.` : isPublished ? 'Customer visibility is active.' : 'Publish when you are ready for customers to discover this property.'}</p></div>{next ? <button type="button" onClick={() => selectTab(({ destination: 'overview', location: 'overview' }[next.key] || next.key))}>Fix {next.label}</button> : !isPublished && <button type="button" onClick={publish}>Publish Hotel</button>}</article>
    <SetupProgress readiness={readiness} summaries={summaries} selectTab={selectTab} />
    <section><div className="overview-section-heading"><div><span>Optional content</span><h2>Enhance This Property</h2></div></div><div className="overview-enhance-grid">{optional.map(([label, tab, count, suffix]) => <button type="button" key={label} onClick={() => selectTab(tab)}><strong>{label}</strong><span>{count ? `${count} ${suffix}` : 'Not configured'}</span><small>Optional · Manage</small></button>)}</div></section>
    <section><div className="overview-section-heading"><div><span>Property snapshot</span><h2>Useful metrics</h2></div></div><div className="hotel-overview-metrics">{metrics.map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}</div></section>
    <section><div className="overview-section-heading"><div><span>Workspace</span><h2>Module quick access</h2></div></div><div className="overview-module-grid">{modules.map(([label, tab, summary]) => <button type="button" key={tab} onClick={() => selectTab(tab)}><strong>{label}</strong><span>{summary}</span><small>{['dining', 'experiences', 'offers'].includes(tab) ? 'Optional · Manage' : 'Open section'}</small></button>)}</div></section>
    <section className="operational-links"><div><span>Operations</span><h2>Hotel activity</h2><p>Reservations and Reviews remain in their global modules, filtered to this Hotel.</p></div><div><Link to={`/management/reservations?hotelId=${hotel.id}`}>Reservations ({reservations.filter((item) => String(item.hotelId) === String(hotel.id)).length})</Link><Link to={`/management/reviews?hotelId=${hotel.id}`}>Reviews ({reviews.filter((item) => String(item.hotelId) === String(hotel.id)).length})</Link></div></section>
    <HotelBasicInformation hotel={hotel} />
    <LocationEditor hotel={hotel} destinations={destinations} updateSetupSection={updateSetupSection} />
    <div className="workspace-sticky-actions"><Link to={`/management/hotels/${hotel.id}/preview`}><Eye size={16} />Preview</Link>{readiness.canPublish && !isPublished ? <button type="button" onClick={publish}>Publish Hotel</button> : <button type="button" disabled>{isPublished ? 'Published / Live' : 'Complete Setup to Publish'}</button>}</div>
  </div>
}

function SetupProgress({ readiness, summaries, selectTab }) {
  const tabForSection = { basic: 'overview', destination: 'overview', contact: 'overview', about: 'about', location: 'overview', facilities: 'facilities', accommodation: 'accommodation', rate: 'rates', gallery: 'gallery', policies: 'policies' }
  const iconsForSection = {
    basic: BedDouble,
    destination: MapPinned,
    contact: Users,
    about: Pencil,
    location: MapPinned,
    facilities: Boxes,
    accommodation: DoorOpen,
    rate: CalendarClock,
    gallery: ImageIcon,
    policies: CheckCircle2,
  }

  return <article className="hotel-workspace-card setup-progress-card">
    <div className="hotel-progress-heading">
      <div>
        <span>Required property setup progress</span>
        <strong className={readiness.canPublish ? 'is-complete' : 'is-pending'}>
          {readiness.percentage}% Completed
        </strong>
      </div>
      <progress max="100" value={readiness.percentage}>{readiness.percentage}%</progress>
    </div>

    <ul className="setup-progress-grid" aria-label="Setup requirements checklist">
      {HOTEL_SETUP_SECTIONS.filter((section) => section.required).map((section) => {
        const isDone = readiness.sections[section.key]
        return (
          <li key={section.key} className={`setup-card-item ${isDone ? 'is-complete' : 'is-incomplete'}`}>
            <div className="setup-card-icon" aria-hidden="true">
              {isDone ? <CheckCircle2 size={18} className="icon-success" /> : <TriangleAlert size={18} className="icon-warning" />}
            </div>
            <div className="setup-card-details">
              <strong>{section.label}</strong>
              <small>{isDone ? `Complete · ${summaries[section.key]}` : `Incomplete · ${summaries[section.key]}`}</small>
            </div>
            <button
              type="button"
              className={`setup-card-action ${isDone ? 'secondary' : 'primary'}`}
              onClick={() => selectTab(tabForSection[section.key])}
            >
              {isDone ? 'Edit' : 'Fix'} →
            </button>
          </li>
        )
      })}
    </ul>

    {!readiness.canPublish && (
      <section className="publish-blockers-panel" aria-label="Missing requirements to publish">
        <header className="blockers-header">
          <div className="blockers-title-group">
            <TriangleAlert size={20} className="blockers-alert-icon" />
            <div>
              <h3>Setup Requirements Remaining</h3>
              <p>Publishing will remain disabled until all {readiness.incompleteRequired.length} required {readiness.incompleteRequired.length === 1 ? 'section is' : 'sections are'} completed.</p>
            </div>
          </div>
          <span className="blockers-count-badge">{readiness.incompleteRequired.length} Missing</span>
        </header>

        <div className="blockers-grid">
          {readiness.incompleteRequired.map((section) => {
            const IconComponent = iconsForSection[section.key] || Boxes
            return (
              <article key={section.key} className="blocker-chip-card">
                <div className="blocker-chip-left">
                  <div className="blocker-icon-wrap">
                    <IconComponent size={16} />
                  </div>
                  <div>
                    <strong>{section.label}</strong>
                    <small>{summaries[section.key] || 'Action required'}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="blocker-fix-btn"
                  onClick={() => selectTab(tabForSection[section.key])}
                >
                  Fix {section.label} →
                </button>
              </article>
            )
          })}
        </div>
      </section>
    )}
  </article>
}

function AboutEditor({ hotel, updateSetupSection, selectTab }) {
  const [form, setForm] = useState({ detailDescription: hotel.detailDescription || '', yearOpened: hotel.yearOpened || '', propertySize: hotel.propertySize || '', languages: Array.isArray(hotel.languages) ? hotel.languages.join(', ') : '', checkInTime: hotel.checkInTime || '', checkOutTime: hotel.checkOutTime || '' })
  const [video, setVideo] = useState(hotel.video || '')
  const [videoName, setVideoName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const persist = () => { if (!form.detailDescription.trim()) { setError('Full Description is required.'); return false } updateSetupSection(hotel.id, 'about', true, { ...form, video, languages: form.languages.split(',').map((item) => item.trim()).filter(Boolean) }); setError(''); setMessage('About Hotel updated.'); return true }
  const selectVideo = (event) => { const file = event.target.files?.[0]; if (!file) return; if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type)) return setError('Use an MP4, WebM or OGG Hotel Video.'); setVideo(URL.createObjectURL(file)); setVideoName(file.name); setError('') }
  return <EditorCard eyebrow="Required customer content" title={`About · ${hotel.name}`}>{message && <p className="hotel-workspace-status" role="status" aria-live="polite">{message}</p>}{error && <p className="property-error" role="alert">{error}</p>}<form className="workspace-editor workspace-editor--two" onSubmit={(event) => { event.preventDefault(); persist() }}><label className="workspace-wide"><span>Full Description *</span><textarea rows="6" required value={form.detailDescription} onChange={(event) => { setForm({ ...form, detailDescription: event.target.value }); setError('') }} /><small>Describe the real property experience shown on Hotel Details.</small></label>{['yearOpened', 'propertySize', 'languages'].map((key) => <label key={key}><span>{({ yearOpened: 'Year Opened', propertySize: 'Property Size', languages: 'Languages' })[key]}</span><input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /><small>{key === 'languages' ? 'Comma separated, for example: English, Sinhala' : key === 'propertySize' ? 'For example: 85 rooms or 4 acres' : 'Optional property fact'}</small></label>)}<div className="workspace-wide about-time-group"><strong>Guest arrival information</strong><div>{['checkInTime', 'checkOutTime'].map((key) => <label key={key}><span>{key === 'checkInTime' ? 'Check-in Time' : 'Check-out Time'}</span><input type="time" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}</div></div><section className="workspace-wide hotel-video-card"><div className="hotel-video-heading"><span><Video size={17} />Hotel Video <small>Optional</small></span><small>MP4, WebM or OGG recommended</small></div>{video ? <div className="hotel-video-preview"><video src={video} controls preload="metadata" /><div><strong title={videoName}>{videoName || 'Current hotel video'}</strong><label><input type="file" accept="video/mp4,video/webm,video/ogg" onChange={selectVideo} /><Upload size={14} />Replace Video</label><button type="button" onClick={() => { setVideo(''); setVideoName('') }}><X size={14} />Remove Video</button></div></div> : <label className="workspace-image-upload hotel-video-upload"><input type="file" accept="video/mp4,video/webm,video/ogg" onChange={selectVideo} /><Upload aria-hidden="true" size={18} />Select Hotel Video</label>}<small>Optional local preview for this application session. Video does not block publication.</small></section><div className="workspace-wide workspace-save-row about-final-actions"><button className="workspace-save secondary" type="submit"><Save size={15} />Save About</button><button className="workspace-save" type="button" onClick={() => { if (persist()) selectTab('accommodation') }}><Save size={15} />Save About &amp; Continue to Accommodation</button></div></form></EditorCard>
}

function Accommodation({ hotel, hotelRooms, physicalRooms, deactivateRoomType, reactivateRoomType, getCurrentRoomRate }) {
  const physicalCount = physicalRooms.filter((item) => String(item.hotelId) === String(hotel.id)).length
  const activeCount = hotelRooms.filter((room) => room.status === 'ACTIVE').length
  const rateReadyCount = hotelRooms.filter((room) => room.status === 'ACTIVE' && getCurrentRoomRate(room.id)).length
  const activeWithoutInventory = hotelRooms.filter((room) => room.status === 'ACTIVE' && !physicalRooms.some((item) => String(item.roomTypeId) === String(room.id)))
  const context = `from=hotelSetup&hotelId=${hotel.id}`
  return <EditorCard eyebrow="Shared Rooms module" title="Accommodation">
    <div className="content-summary"><article><small>Room Types</small><strong>{hotelRooms.length}</strong></article><article><small>Active Room Types</small><strong>{activeCount}</strong></article><article><small>Physical Rooms</small><strong>{physicalCount}</strong></article><article><small>Rate-ready Types</small><strong>{rateReadyCount}</strong></article></div><div className="workspace-section-actions workspace-accommodation-actions"><p><strong>{hotel.name} Accommodation</strong><br />Room types and physical inventory remain in the shared Rooms module.</p><div><Link to={`/management/rooms?hotelId=${hotel.id}&from=hotelSetup`}>Manage Rooms</Link><Link to={`/management/rooms/new?hotelId=${hotel.id}&from=hotelSetup`}>+ Add Room Type</Link></div></div>
    {activeWithoutInventory.length > 0 && <section className="workspace-inventory-warning" role="status"><TriangleAlert aria-hidden="true" size={20} /><div><strong>Physical inventory required</strong><p>{activeWithoutInventory.length} active room {activeWithoutInventory.length === 1 ? 'type currently has' : 'types currently have'} no physical rooms configured: {activeWithoutInventory.map((room) => room.name).join(', ')}.</p></div><Link to={`/management/rooms?hotelId=${hotel.id}`}>Manage Inventory</Link></section>}
    {hotelRooms.length ? <div className="workspace-room-list">{hotelRooms.map((room) => {
      const inventoryCount = physicalRooms.filter((item) => String(item.roomTypeId) === String(room.id)).length
      const currentRate = getCurrentRoomRate(room.id)
      return <article key={room.id}><img src={room.mainImage || room.image} alt={`${room.name} room type`} /><div className="workspace-room-content"><div className="workspace-room-main"><div className="workspace-room-top-meta"><span className="workspace-room-view">{room.viewType || 'View not configured'}</span><span className={`workspace-room-status workspace-room-status--${room.status.toLowerCase()}`}>{room.status}</span></div><h3>{room.name}</h3><p>{room.shortDescription || 'Description not configured.'}</p><div className="workspace-room-facts"><span><Users aria-hidden="true" size={15} />{room.maxGuests} Guests</span><span><BedDouble aria-hidden="true" size={15} />{room.bedConfiguration}</span><span className={inventoryCount === 0 ? 'is-empty' : ''}><DoorOpen aria-hidden="true" size={15} />{inventoryCount} Physical Rooms</span></div><div className="workspace-room-rate"><small>Current Rate</small><strong>{currentRate ? <>{formatRateAmount(currentRate.amount)} <span>/ night</span></> : 'Valid rate required'}</strong></div></div><div className="workspace-room-actions"><div><Link to={`/management/rooms/${room.id}?${context}`}><Eye aria-hidden="true" size={14} />View</Link><Link to={`/management/rooms/${room.id}/edit?${context}`}><Pencil aria-hidden="true" size={14} />Edit</Link><Link className="workspace-room-inventory" to={`/management/rooms/${room.id}/inventory?${context}`}><Boxes aria-hidden="true" size={14} />Inventory</Link></div><button className="workspace-room-status-action" type="button" onClick={() => room.status === 'ACTIVE' ? deactivateRoomType(room.id) : reactivateRoomType(room.id)}>{room.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button></div></div></article>
    })}</div> : <div className="workspace-empty"><p>Accommodation setup is required before publishing. Add at least one active Room Type.</p><Link to={`/management/rooms/new?hotelId=${hotel.id}&from=hotelSetup`}>Add Room Type</Link></div>}
  </EditorCard>
}

function HotelOffersTab({ hotel, onContinue }) {
  const { offers, activateOffer, deactivateOffer } = usePropertyContent()
  const { rooms } = useRooms()
  const { hotels } = useHotels()
  const applicableOffers = offers.filter((offer) => offerAppliesToHotel(offer, hotel.id, rooms))
  const statuses = applicableOffers.map(getOfferStatus)
  const summary = [
    ['Active', statuses.filter((item) => item === 'Active').length, CheckCircle2],
    ['Scheduled', statuses.filter((item) => item === 'Scheduled').length, CalendarClock],
    ['Expired', statuses.filter((item) => item === 'Expired').length, TimerOff],
    ['Inactive', applicableOffers.filter((item) => !item.active).length, PauseCircle],
  ]
  return <article className="hotel-workspace-card hotel-offers-workspace">
    <header className="workspace-module-header"><div><span>Optional · Shared promotions</span><h2>Offers · {hotel.name}</h2><p>Review every shared promotion that targets this Hotel or one of its Room Types.</p></div><div><Link to={`/management/offers?hotelId=${hotel.id}`}>Manage All Offers</Link><Link className="primary" to={`/management/offers/new?hotelId=${hotel.id}`}>Create Offer for This Hotel</Link></div></header>
    <div className="content-summary offer-status-summary" aria-label="Offer status summary">{summary.map(([label, count, Icon]) => <article className={`is-${label.toLowerCase()}`} key={label}><Icon aria-hidden="true" size={18} /><div><small>{label}</small><strong>{count}</strong></div></article>)}</div>
    <p className="workspace-module-note">Expired offers remain available in Management but are automatically excluded from current customer promotions.</p>
    {applicableOffers.length ? <div className="workspace-offer-cards">{applicableOffers.map((offer) => { const status = getOfferStatus(offer); return <article key={offer.id} className={!offer.active ? 'is-inactive' : ''}><div className="workspace-offer-media">{offer.image ? <img src={offer.image} alt={`${offer.title} promotion`} /> : <span><ImageIcon size={24} /></span>}<strong>{formatOfferDiscount(offer)}</strong></div><div className="workspace-offer-body"><div className="workspace-offer-title"><h3>{offer.title}</h3><span className={`offer-status-badge is-${status.toLowerCase()}`}>{status}</span></div><p>{offer.shortDescription || offer.description || 'No short description configured.'}</p><dl><div><dt><CalendarRange size={14} />Validity</dt><dd>{offer.validFrom || offer.stayStartDate || 'Open'} – {offer.validTo || offer.stayEndDate || 'Open'}</dd></div><div><dt><BedDouble size={14} />Minimum stay</dt><dd>{offer.minimumNights || offer.minimumStay || 1} night(s)</dd></div></dl><small className="workspace-offer-scope">{getOfferTargetSummary(offer, hotels, rooms)}</small><div className="workspace-offer-actions"><Link to={`/management/offers/${offer.id}?hotelId=${hotel.id}`}><Eye size={14} />View</Link><Link to={`/management/offers/${offer.id}/edit?hotelId=${hotel.id}`}><Pencil size={14} />Edit</Link><button type="button" className={offer.active ? 'danger' : ''} onClick={() => offer.active ? deactivateOffer(offer.id) : activateOffer(offer.id)}>{offer.active ? <><EyeOff size={14} />Deactivate</> : <><RotateCcw size={14} />Activate</>}</button></div></div></article> })}</div> : <div className="workspace-empty"><p>No offers currently target this Hotel.</p><Link to={`/management/offers/new?hotelId=${hotel.id}`}>Create Offer for This Hotel</Link></div>}
    <div className="content-section-actions"><span>Offers are optional and do not block publication.</span><button type="button" onClick={() => onContinue('gallery')}>Continue to Gallery</button></div>
  </article>
}

function HotelRatesTab({ hotel, hotelRooms, hotelRates, getCurrentRoomRate, onContinue }) {
  const propertyRates = hotelRates.filter((rate) => String(rate.hotelId) === String(hotel.id))
  const readyCount = hotelRooms.filter((room) => room.status === 'ACTIVE' && getCurrentRoomRate(room.id)).length
  return <EditorCard eyebrow="Shared Rates module" title={`Rates · ${hotel.name}`}><div className="content-summary"><article><small>Room Types</small><strong>{hotelRooms.length}</strong></article><article><small>Active Types</small><strong>{hotelRooms.filter((room) => room.status === 'ACTIVE').length}</strong></article><article><small>Valid Rates</small><strong>{readyCount}</strong></article><article><small>Missing Rates</small><strong>{hotelRooms.filter((room) => room.status === 'ACTIVE' && !getCurrentRoomRate(room.id)).length}</strong></article></div><div className="workspace-section-actions"><p><strong>{propertyRates.length} Hotel-level rate records</strong><br />At least one current active Room Type Rate is required for publication. Promotions remain in Offers.</p><div><Link to={`/management/rates?hotelId=${hotel.id}&section=hotelRates&from=hotelSetup`}>Manage Hotel Rates</Link><Link to={`/management/rates?hotelId=${hotel.id}&section=roomTypeRates&from=hotelSetup`}>Manage Room Type Rates</Link></div></div>{hotelRooms.length ? <div className="workspace-offer-list">{hotelRooms.map((room) => { const rate = getCurrentRoomRate(room.id); return <article key={room.id}><div><strong>{room.name}</strong><small>{room.status} · {rate ? `${formatRateAmount(rate.amount)} · Rate Ready` : 'Valid active rate required'}</small></div><div><Link to={`/management/rates?hotelId=${hotel.id}&roomTypeId=${room.id}&section=roomTypeRates&from=hotelSetup`}>{rate ? 'Manage Rate' : 'Configure Rate'}</Link></div></article> })}</div> : <div className="workspace-empty"><p>Add an active Room Type before configuring rates.</p><Link to={`/management/rooms/new?hotelId=${hotel.id}&from=hotelSetup`}>Add Room Type</Link></div>}<div className="content-section-actions"><span>{readyCount ? 'Rate readiness is complete.' : 'A valid active Room Type rate is still required.'}</span><button type="button" onClick={() => onContinue('facilities')}>Continue to Facilities</button></div></EditorCard>
}

function LocationEditor({ hotel, destinations, updateSetupSection }) {
  const [form, setForm] = useState({ destinationId: hotel.destinationId || '', address: hotel.address || '', city: hotel.city || '', latitude: hotel.latitude ?? '', longitude: hotel.longitude ?? '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const coordinateStarted = form.latitude !== '' || form.longitude !== ''
  const hasCoordinates = form.latitude !== '' && form.longitude !== '' && Number(form.latitude) >= -90 && Number(form.latitude) <= 90 && Number(form.longitude) >= -180 && Number(form.longitude) <= 180
  const save = (event) => {
    event.preventDefault()
    const destination = destinations.find((item) => String(item.id) === String(form.destinationId))
    if (!destination?.active || !form.city.trim() || !form.address.trim()) { setError('Active Destination, City / Area and Address are required.'); return }
    if (coordinateStarted && !hasCoordinates) { setError('Enter both coordinates using latitude -90 to 90 and longitude -180 to 180.'); return }
    updateSetupSection(hotel.id, 'location', true, { ...form, destinationId: Number(form.destinationId), destination: destination.name, latitude: hasCoordinates ? Number(form.latitude) : '', longitude: hasCoordinates ? Number(form.longitude) : '' })
    setError(''); setMessage('Property location updated.')
  }
  return <EditorCard eyebrow="Required property information" title="Property Location">{message && <p className="hotel-workspace-status" role="status" aria-live="polite">{message}</p>}<form className="workspace-editor workspace-editor--two" onSubmit={save}><ManagementSelect searchable label="Active Destination" required value={String(form.destinationId)} options={[{ value: '', label: 'Select Destination' }, ...destinations.filter((item) => item.active).map((item) => ({ value: String(item.id), label: item.name }))]} onChange={(value) => setForm({ ...form, destinationId: value })} /><label><span>City / Area *</span><input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Unawatuna" /></label><label className="workspace-wide"><span>Address *</span><input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><label><span>Latitude</span><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => { setForm({ ...form, latitude: event.target.value }); setError('') }} placeholder="Optional · -90 to 90" /></label><label><span>Longitude</span><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => { setForm({ ...form, longitude: event.target.value }); setError('') }} placeholder="Optional · -180 to 180" /></label><div className="workspace-wide"><MapLocationPicker latitude={form.latitude} longitude={form.longitude} heading="Map Preview" label={`${hotel.name} exact location`} error={error} onChange={({ latitude, longitude }) => { setForm({ ...form, latitude: latitude ?? '', longitude: longitude ?? '' }); setError('') }} /></div>{!hasCoordinates && !error && <p className="workspace-map-note workspace-wide">Map location not configured. Coordinates are optional, but improve guest directions.</p>}<div className="workspace-save-row workspace-wide"><button className="workspace-save" type="submit">Save Property Location</button></div></form></EditorCard>
}

function EditorCard({ eyebrow, title, children }) { return <article className="hotel-workspace-card"><div className="hotel-card-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div></div>{children}</article> }
