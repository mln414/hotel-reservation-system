import { ArrowLeft, ArrowRight, BedDouble, Building2, CalendarCheck, CalendarDays, CheckCircle2, Info, MapPin, Search, Star, Tag, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import offerFallbackImage from '../../assets/images/home/early-bird-offer.png'
import useHotels from '../../context/useHotels.js'
import usePropertyContent from '../../context/usePropertyContent.js'
import useRates from '../../context/useRates.js'
import useReservations from '../../context/useReservations.js'
import useRooms from '../../context/useRooms.js'
import useHotelDiscovery from '../../hooks/useHotelDiscovery.js'
import { buildOfferStayQuote, CUSTOMER_OFFER_STATE_LABELS, getPublicOfferEligibility, getCustomerOfferState, getOfferQuoteReason, isCustomerOfferVisible } from '../../utils/customerOffers.js'
import { formatOfferDiscount } from '../../utils/offerEligibility.js'
import { formatOfferDate, getOfferDisplayState } from '../../utils/offerFormatting.js'
import { applyImageFallback, getHotelMainImage } from '../../utils/hotelMedia.js'
import { calculateNights } from '../../utils/reservationDomain.js'
import { formatLkr } from '../../utils/reservationFormatting.js'
import { getRoomMainImage } from '../../utils/roomMedia.js'
import './OfferDetails.css'

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const safeCount = (value, fallback, minimum = 0) => Number.isFinite(Number(value)) && Number(value) >= minimum ? Number(value) : fallback
const replaceBrokenImage = (event) => { event.currentTarget.onerror = null; event.currentTarget.src = offerFallbackImage }
const roomCategory = (room) => String(room?.category || room?.roomTypeGroupLabel || room?.roomTypeGroupKey || 'Guest Room').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

function OfferState({ description, title }) {
  return <section className="offer-details-state"><Tag aria-hidden="true" size={27} /><h1>{title}</h1><p>{description}</p><div><Link to="/offers"><ArrowLeft aria-hidden="true" size={16} />View Customer Offers</Link><Link to="/hotels">Explore Hotels<ArrowRight aria-hidden="true" size={16} /></Link></div></section>
}

export default function OfferDetails() {
  const { publicHotels } = useHotels()
  const { offers } = usePropertyContent()
  const { rooms, physicalRooms } = useRooms()
  const { getCurrentRoomRate } = useRates()
  const { checkReservationAvailability } = useReservations()
  const { hotelCards } = useHotelDiscovery()
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const offer = offers.find((item) => item.slug === slug)
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '')
  const [adults, setAdults] = useState(safeCount(searchParams.get('adults'), 2, 1))
  const [children, setChildren] = useState(safeCount(searchParams.get('children'), 0))
  const [roomCount, setRoomCount] = useState(safeCount(searchParams.get('rooms'), 1, 1))
  const [message, setMessage] = useState('')
  const appliedCheckIn = searchParams.get('checkIn') || ''
  const appliedCheckOut = searchParams.get('checkOut') || ''
  const appliedAdults = safeCount(searchParams.get('adults'), 2, 1)
  const appliedChildren = safeCount(searchParams.get('children'), 0)
  const appliedRooms = safeCount(searchParams.get('rooms'), 1, 1)
  const hasDates = Boolean(appliedCheckIn && appliedCheckOut && appliedCheckOut > appliedCheckIn)
  const coverage = useMemo(() => offer ? getPublicOfferEligibility(offer, { publicHotels, rooms, physicalRooms, getCurrentRoomRate }) : { hotels: [], roomTypes: [] }, [offer, publicHotels, rooms, physicalRooms, getCurrentRoomRate])
  const quotes = useMemo(() => hasDates && offer ? coverage.roomTypes.map((room) => {
    const hotel = coverage.hotels.find((item) => String(item.id) === String(room.hotelId))
    return buildOfferStayQuote({ offer, room, hotel, checkIn: appliedCheckIn, checkOut: appliedCheckOut, rooms: appliedRooms, adults: appliedAdults, children: appliedChildren, getCurrentRoomRate, checkReservationAvailability })
  }) : [], [hasDates, offer, coverage, appliedCheckIn, appliedCheckOut, appliedRooms, appliedAdults, appliedChildren, getCurrentRoomRate, checkReservationAvailability])

  if (!offer) return <OfferState title="Offer Not Found" description="The Offer you are looking for could not be found." />
  if (getOfferDisplayState(offer) === 'EXPIRED') return <OfferState title="This Offer Has Ended" description="The stay-validity period for this Offer has ended. View current LankaStay Offers for other options." />
  if (!isCustomerOfferVisible(offer, publicHotels, rooms, { physicalRooms, getCurrentRoomRate })) return <OfferState title="Offer Not Available" description="This Offer is expired, inactive, invalid, or no longer connected to a published Hotel with an active eligible Room Type and usable Rate." />

  const customerState = getCustomerOfferState(offer)
  const eligibleHotels = hotelCards.filter((item) => coverage.hotels.some((hotel) => String(hotel.id) === String(item.hotel.id)))
  const minimumStay = Number(offer.minimumStay ?? offer.minimumNights ?? 1)
  const maximumStay = Number(offer.maximumStay || 0)
  const nights = calculateNights(appliedCheckIn, appliedCheckOut)
  const validQuotes = quotes.filter((quote) => quote.eligible)
  const submitSearch = (event) => {
    event.preventDefault()
    if (!checkIn || !checkOut || checkIn < localDate() || checkOut <= checkIn) { setMessage('Choose valid future check-in and check-out dates.'); return }
    if (adults < 1 || roomCount < 1) { setMessage('Choose at least one adult and one room.'); return }
    setMessage('')
    setSearchParams({ checkIn, checkOut, adults: String(adults), children: String(children), rooms: String(roomCount), offerId: String(offer.id) })
  }
  const bookingQuery = () => new URLSearchParams({ checkIn: appliedCheckIn, checkOut: appliedCheckOut, adults: String(appliedAdults), children: String(appliedChildren), rooms: String(appliedRooms), offerId: String(offer.id) }).toString()

  return <div className="offer-details-page">
    <nav className="offer-details-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><Link to="/offers">Offers</Link><span aria-hidden="true">›</span><span aria-current="page">{offer.title}</span></nav>
    <section className="offer-details-hero" aria-labelledby="offer-details-title"><img src={offer.image || offerFallbackImage} onError={replaceBrokenImage} alt={`${offer.title} at LankaStay Hotels & Resorts`} /><span className="offer-details-overlay" aria-hidden="true" /><div className="offer-details-hero-copy"><span className={`offer-details-status offer-details-status--${customerState.toLowerCase()}`}>{CUSTOMER_OFFER_STATE_LABELS[customerState]}</span><span className="offer-details-discount">{formatOfferDiscount(offer)}</span><h1 id="offer-details-title">{offer.title}</h1><p>{offer.shortDescription}</p><small>{customerState === 'COMING_SOON' ? `Available from ${formatOfferDate(offer.validFrom)}` : `Valid until ${formatOfferDate(offer.validTo)}`}</small></div></section>

    <section className="offer-search-card" aria-labelledby="offer-search-title"><div><span><Search size={17} />Check this Offer</span><h2 id="offer-search-title">Find an eligible stay</h2><p>Dates unlock verified availability, date-aware Rates and the final promotional total.</p></div><form onSubmit={submitSearch} noValidate><label>Check In<input type="date" min={localDate()} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut <= event.target.value) setCheckOut('') }} /></label><label>Check Out<input type="date" min={checkIn || localDate()} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label><label>Adults<select value={adults} onChange={(event) => setAdults(Number(event.target.value))}>{[1,2,3,4,5,6,7,8].map((value) => <option key={value}>{value}</option>)}</select></label><label>Children<select value={children} onChange={(event) => setChildren(Number(event.target.value))}>{[0,1,2,3,4,5,6].map((value) => <option key={value}>{value}</option>)}</select></label><label>Rooms<select value={roomCount} onChange={(event) => setRoomCount(Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label><button type="submit"><CalendarCheck size={17} />Check Availability</button>{message && <p role="alert">{message}</p>}</form></section>

    {hasDates && <div className={`offer-results-summary ${validQuotes.length ? 'is-success' : 'is-empty'}`} role="status"><CalendarCheck size={19} /><div><strong>{validQuotes.length ? `${validQuotes.length} eligible ${validQuotes.length === 1 ? 'Room Type' : 'Room Types'} found` : 'No eligible Offer stays found'}</strong><p>{validQuotes.length ? `${nights} ${nights === 1 ? 'night' : 'nights'} · ${appliedAdults + appliedChildren} guests · final savings shown below.` : 'Review the reason on each Room Type or try different dates, guests, or room quantity.'}</p></div></div>}

    <div className="offer-details-layout"><main>
      <section className="offer-details-card"><span className="offer-details-eyebrow">About This Offer</span><h2>A special LankaStay experience</h2><p>{offer.fullDescription || offer.description}</p><dl className="offer-facts"><div><Tag size={18}/><dt>Discount</dt><dd>{formatOfferDiscount(offer)}</dd></div><div><CalendarDays size={18}/><dt>Stay validity</dt><dd>{formatOfferDate(offer.validFrom)} – {formatOfferDate(offer.validTo)}</dd></div><div><BedDouble size={18}/><dt>Stay length</dt><dd>Min {minimumStay}{maximumStay ? ` · Max ${maximumStay}` : ''} nights</dd></div><div><Building2 size={18}/><dt>Participating</dt><dd>{coverage.hotels.length} {coverage.hotels.length === 1 ? 'Hotel' : 'Hotels'} · {coverage.roomTypes.length} Room Types</dd></div></dl></section>

      <section className="offer-details-card" id="eligible-hotels"><span className="offer-details-eyebrow">Participating Properties</span><h2>Eligible Hotels</h2><p>These published Hotels currently contain at least one active Room Type covered by this Offer.</p><div className="offer-hotels-grid">{eligibleHotels.map(({ hotel, destination, rating, reviewCount, fromRate }) => <article key={hotel.id}><img src={getHotelMainImage(hotel)} onError={applyImageFallback} alt={`${hotel.name} in ${destination?.name || 'Sri Lanka'}`} /><div><span><MapPin size={13}/>{destination?.name || 'Destination unavailable'}, {hotel.country}</span><h3>{hotel.name}</h3><p><Star size={14} fill="currentColor"/>{reviewCount ? `${rating.toFixed(1)} · ${reviewCount} reviews` : 'New · No reviews yet'}</p><p>{fromRate ? `Normal Rate from ${formatLkr(fromRate)} / night` : 'Rate currently unavailable'}</p><Link to={`/hotels/${hotel.id}?offerId=${offer.id}`}>View Hotel<ArrowRight size={15}/></Link></div></article>)}</div></section>

      <section className="offer-details-card" id="eligible-rooms"><span className="offer-details-eyebrow">Eligible Stays</span><h2>{hasDates ? 'Offer availability and final prices' : 'Room Types covered today'}</h2><p>{hasDates ? 'Only an eligible result receives this Offer. No other Offer is stacked.' : `Rates below are normal current Rates. ${formatOfferDiscount(offer)} is advertised separately until dates are selected.`}</p><div className="offer-rooms-grid">{coverage.roomTypes.map((room) => {
        const hotel = coverage.hotels.find((item) => String(item.id) === String(room.hotelId))
        const rate = getCurrentRoomRate(room.id)
        const quote = quotes.find((item) => String(item.room.id) === String(room.id))
        const reason = quote && !quote.eligible ? getOfferQuoteReason(quote, offer) : ''
        return <article className={quote?.eligible ? 'is-eligible' : ''} key={room.id}><img src={getRoomMainImage(room)} onError={applyImageFallback} alt={`${room.name} at ${hotel?.name}`} /><div><strong>{quote?.eligible ? `${formatOfferDiscount(offer)} applied` : formatOfferDiscount(offer)}</strong><h3>{room.name}</h3><p>{hotel?.name} · {roomCategory(room)}</p><p><Users size={13}/>{room.maxGuests ?? room.capacity} guests per room</p>{hasDates ? quote?.eligible ? <div className="offer-price-breakdown"><span>Original <del>{formatLkr(quote.originalTotal)}</del></span><span>You save <b>{formatLkr(quote.discount)}</b></span><strong>Final stay total {formatLkr(quote.finalTotal)}</strong><small>Average {formatLkr(quote.averageFinalNightlyRate)} / room / night</small></div> : <p className="offer-room-reason">{reason}</p> : <span>{rate ? `Normal Rate ${formatLkr(rate.amount)} / night` : 'Rate currently unavailable'}</span>}{quote?.eligible ? <Link to={`/booking/${room.id}?${bookingQuery()}`}>Book with this Offer<ArrowRight size={15}/></Link> : <Link to={`/rooms/${room.id}${hasDates ? `?${bookingQuery()}` : `?offerId=${offer.id}`}`}>{hasDates ? 'View Room Type' : 'Choose dates'}<ArrowRight size={15}/></Link>}</div></article>
      })}</div></section>
    </main><aside><section className="offer-details-card offer-terms"><h2>Terms &amp; Conditions</h2><ul>{(offer.terms?.length ? offer.terms : ['Subject to Offer validity, eligible Room Types and availability.']).map((term) => <li key={term}><CheckCircle2 size={15}/>{term}</li>)}</ul><div className="offer-details-note"><Info size={16}/><p>Discounted prices appear only after stay dates pass current Rate, capacity, inventory, targeting and Offer-rule checks. Confirmed Reservations retain their saved Rate and Offer snapshots.</p></div><a href="#eligible-rooms">{hasDates ? 'Review Eligible Stays' : 'Choose Dates Above'}</a></section></aside></div>
  </div>
}
