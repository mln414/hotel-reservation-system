import { ArrowLeft, BedDouble, Eye, MapPin, Pencil, ShieldAlert, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import HotelDining from '../../components/HotelDining/HotelDining.jsx'
import HotelExperiences from '../../components/HotelExperiences/HotelExperiences.jsx'
import HotelFacilities from '../../components/HotelFacilities/HotelFacilities.jsx'
import HotelLocation from '../../components/HotelLocation/HotelLocation.jsx'
import HotelOffers from '../../components/HotelOffers/HotelOffers.jsx'
import HotelPolicies from '../../components/HotelPolicies/HotelPolicies.jsx'
import HotelReviews from '../../components/HotelReviews/HotelReviews.jsx'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import useHotels from '../../context/useHotels.js'
import usePropertyContent from '../../context/usePropertyContent.js'
import useRooms from '../../context/useRooms.js'
import useRates from '../../context/useRates.js'
import useReviews from '../../context/useReviews.js'
import { HOTEL_PUBLICATION_STATUS } from '../../constants/hotelManagement.js'
import { getHotelSetupReadiness } from '../../utils/hotelManagement.js'
import { getHotelPolicies } from '../../utils/hotelPolicies.js'
import { offerAppliesToHotel } from '../../utils/offerEligibility.js'
import { getOfferStatus } from '../../utils/offerFormatting.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import { applyImageFallback } from '../../utils/hotelMedia.js'
import './HotelManagementPreview.css'

export default function HotelManagementPreview() {
  const { id } = useParams(); const [showPublish, setShowPublish] = useState(false); const [message, setMessage] = useState('')
  const { getHotelById, destinations, hotelsLoading, hotelsError, setHotelPublicationStatus } = useHotels(); const { rooms, getRoomsByHotelId } = useRooms(); const { roomRates, getHotelStartingRate, getCurrentRoomRate } = useRates()
  const { diningItems, experiences, offers, facilities } = usePropertyContent(); const { getHotelReviews, getHotelAverageRating, getHotelReviewCount } = useReviews()
  const hotel = getHotelById(id)
  if (hotelsLoading) return <section className="hotel-management-preview" role="status"><h1>Loading hotel...</h1></section>
  if (hotelsError) return <section className="hotel-management-preview" role="alert"><h1>Unable to load hotel information. Please try again.</h1><p>{hotelsError}</p><Link to="/management/hotels">Back to Hotels</Link></section>
  if (!hotel) return <section className="hotel-management-preview"><h1>Hotel not found.</h1><Link to="/management/hotels">Back to Hotels</Link></section>
  const readiness = getHotelSetupReadiness(hotel, destinations, rooms, roomRates); const isLive = readiness.canPublish && hotel.publicationStatus === HOTEL_PUBLICATION_STATUS.ACTIVE
  const roomTypes = getRoomsByHotelId(hotel.id).filter((room) => room.status === 'ACTIVE'); const dining = diningItems.filter((item) => item.active && String(item.hotelId) === String(hotel.id)); const hotelExperiences = experiences.filter((item) => item.active && (String(item.hotelId) === String(hotel.id) || (item.relatedHotelIds || []).some((value) => String(value) === String(hotel.id))))
  const currentOffers = offers.filter((item) => item.active && offerAppliesToHotel(item, hotel.id, roomTypes) && getOfferStatus(item) !== 'Expired'); const activeFacilities = (hotel.facilityIds || []).map((facilityId) => facilities.find((item) => String(item.id) === String(facilityId))).filter((item) => item?.active)
  const activePolicies = getHotelPolicies(hotel); const hotelReviews = getHotelReviews(hotel.id); const reviewCount = getHotelReviewCount(hotel.id); const averageRating = getHotelAverageRating(hotel.id); const startingRate = getHotelStartingRate(hotel.id); const gallery = [hotel.mainImage || hotel.image, ...(hotel.gallery || [])].filter(Boolean)
  const confirmPublish = async () => { try { await setHotelPublicationStatus(hotel.id, HOTEL_PUBLICATION_STATUS.ACTIVE); setShowPublish(false); setMessage(`${hotel.name} published successfully.`) } catch (error) { setMessage(error.message || 'Unable to publish this Hotel.') } }
  return <section className="hotel-management-preview">
    <div className="hotel-preview-toolbar"><div><Link to={`/management/hotels/${hotel.id}/setup`}><ArrowLeft size={16} />Back to Manage Hotel</Link><Link to={`/management/hotels/${hotel.id}/setup`}><Pencil size={15} />Edit Hotel</Link></div><div><span><ShieldAlert size={15} />Preview Mode · {isLive ? 'Published / Live' : readiness.canPublish ? 'Ready to Publish' : `${readiness.percentage}% Setup`}</span>{readiness.canPublish && !isLive && <button type="button" onClick={() => setShowPublish(true)}>Publish Hotel</button>}</div></div>
    {message && <p className="hotel-workspace-status" role="status" aria-live="polite">{message}</p>}
    <article className="hotel-preview-hero">{gallery[0] ? <img src={gallery[0]} onError={applyImageFallback} alt={`${hotel.name} cover`} /> : <div className="hotel-preview-image-placeholder"><Eye size={30} /><span>Cover image not configured</span></div>}<div className="hotel-preview-overlay" /><div className="hotel-preview-content"><span>{hotel.propertyType || hotel.category}</span><h1>{hotel.name}</h1><p><MapPin size={16} />{hotel.destination || 'Destination not configured'}, Sri Lanka</p><strong>{hotel.shortDescription || 'Short description not configured'}</strong><div className="hotel-preview-hero-facts">{startingRate && <span>From <b>{formatRateAmount(startingRate.amount)}</b> / night</span>}{reviewCount > 0 && <span><Star size={15} fill="currentColor" /><b>{averageRating.toFixed(1)}</b> · {reviewCount} review{reviewCount === 1 ? '' : 's'}</span>}</div></div></article>
    <PreviewSection title="About this property" editHref={`/management/hotels/${hotel.id}/setup?tab=about`} editLabel="Edit About"><div className="preview-about"><p>{hotel.detailDescription || 'About content has not been configured for this property.'}</p><dl><div><dt>Property Type</dt><dd>{hotel.propertyType || hotel.category}</dd></div><div><dt>Check-in</dt><dd>{hotel.checkInTime || 'Not configured'}</dd></div><div><dt>Check-out</dt><dd>{hotel.checkOutTime || 'Not configured'}</dd></div><div><dt>Languages</dt><dd>{hotel.languages?.join(', ') || 'Not configured'}</dd></div></dl></div></PreviewSection>
    <PreviewSection title="Accommodation" editHref={`/management/hotels/${hotel.id}/setup?tab=accommodation`} editLabel="Manage Rooms">{roomTypes.length ? <div className="preview-room-grid">{roomTypes.map((room) => { const rate = getCurrentRoomRate(room.id); return <article key={room.id}><img src={room.mainImage || room.image} onError={applyImageFallback} alt={`${room.name} at ${hotel.name}`} /><div><span><BedDouble size={14} />{room.bedConfiguration}</span><h3>{room.name}</h3><p>{room.shortDescription || 'Description not configured'}</p><strong>{rate ? `${formatRateAmount(rate.amount)} / night` : 'Rate not configured'}</strong></div></article>})}</div> : <PreviewEmpty title="No active accommodation configured" text="Add an active Room Type before this Hotel can be published." />}</PreviewSection>
    <PreviewSection title="Dining" editHref={`/management/hotels/${hotel.id}/setup?tab=dining`} editLabel="Manage Dining">{dining.length ? <HotelDining hotel={hotel} diningItems={dining} /> : <PreviewEmpty title="Dining has not been configured for this property." text="Optional restaurants, bars and dining experiences will appear here." />}</PreviewSection>
    <PreviewSection title="Facilities" editHref={`/management/hotels/${hotel.id}/setup?tab=facilities`} editLabel="Manage Facilities">{activeFacilities.length ? <HotelFacilities facilities={activeFacilities} /> : <PreviewEmpty title="No facilities configured" text="Select active shared Facilities for this Hotel." />}</PreviewSection>
    <PreviewSection title="Experiences" editHref={`/management/hotels/${hotel.id}/setup?tab=experiences`} editLabel="Manage Experiences">{hotelExperiences.length ? <HotelExperiences hotel={hotel} experiences={hotelExperiences} /> : <PreviewEmpty title="No experiences configured" text="Optional Hotel experiences will appear here." />}</PreviewSection>
    <PreviewSection title="Offers" editHref={`/management/hotels/${hotel.id}/setup?tab=offers`} editLabel="Manage Offers">{currentOffers.length ? <HotelOffers hotel={hotel} offers={currentOffers} /> : <PreviewEmpty title="No current offers" text="Expired and inactive records remain available in Management." />}</PreviewSection>
    <PreviewSection title="Gallery" editHref={`/management/hotels/${hotel.id}/setup?tab=gallery`} editLabel="Manage Gallery">{gallery.length ? <div className="preview-gallery">{gallery.slice(0, 7).map((image, index) => <img key={`${image}-${index}`} src={image} onError={applyImageFallback} alt={`${hotel.name} gallery ${index + 1}`} />)}</div> : <PreviewEmpty title="No gallery images configured" text="Choose a Cover and add Gallery images." />}</PreviewSection>
    <PreviewSection title="Property Location" editHref={`/management/hotels/${hotel.id}/setup`} editLabel="Edit Location">{readiness.hasValidCoordinates ? <HotelLocation hotel={hotel} /> : <PreviewEmpty title="Map location not configured" text={[hotel.address, hotel.city].filter(Boolean).join(' · ') || 'Address not configured'} />}</PreviewSection>
    <PreviewSection title="Guest Reviews" editHref={`/management/reviews?hotelId=${hotel.id}`} editLabel="View Reviews">{hotelReviews.length ? <HotelReviews hotel={hotel} /> : <PreviewEmpty title="No reviews yet" text="Real guest reviews will appear here after eligible stays." />}</PreviewSection>
    <PreviewSection title="Hotel Policies" editHref={`/management/hotels/${hotel.id}/setup?tab=policies`} editLabel="Manage Policies">{activePolicies.length ? <HotelPolicies hotel={hotel} /> : <PreviewEmpty title="No active policies configured" text="Add an active policy before publication." />}</PreviewSection>
    {showPublish && <ManagementDialog title={`Publish ${hotel.name}?`} description="This property will become available on customer-facing Hotel discovery and details pages immediately for this application session." onClose={() => setShowPublish(false)} actions={<><button type="button" onClick={() => setShowPublish(false)}>Cancel</button><button className="primary" type="button" onClick={confirmPublish}>Publish Hotel</button></>} />}
  </section>
}

function PreviewSection({ title, editHref, editLabel, children }) { return <section className="preview-customer-section"><header><h2>{title}</h2><Link to={editHref}><Pencil size={14} />{editLabel}</Link></header><div>{children}</div></section> }
function PreviewEmpty({ title, text }) { return <div className="preview-empty"><Eye size={22} /><strong>{title}</strong><p>{text}</p></div> }
