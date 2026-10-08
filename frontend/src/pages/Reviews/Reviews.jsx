import { ArrowRight, BadgeCheck, BedDouble, Building2, PenLine, Search, Star, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import ReviewCard from '../../components/ReviewCard/ReviewCard.jsx'
import useHotels from '../../context/useHotels.js'
import useReservations from '../../context/useReservations.js'
import useReviews from '../../context/useReviews.js'
import useRooms from '../../context/useRooms.js'
import useCustomer from '../../context/useCustomer.js'
import { applyImageFallback, getHotelMainImage } from '../../utils/hotelMedia.js'
import { formatReservationDate } from '../../utils/reservationFormatting.js'
import { getPrimaryRoomTypeId, getRatingLabel, REVIEW_CATEGORIES } from '../../utils/reviewDomain.js'
import './Reviews.css'

const selectOptions = {
  rating: [{ value: 'ALL', label: 'All Ratings' }, ...[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} Stars` }))],
  response: [{ value: 'ALL', label: 'Any Response' }, { value: 'RESPONDED', label: 'With Management Response' }, { value: 'UNANSWERED', label: 'Without Response' }],
  period: [{ value: 'ALL', label: 'All Stay Dates' }, { value: '2026', label: 'Stayed in 2026' }, { value: '2025', label: 'Stayed in 2025' }],
  sort: [{ value: 'NEWEST', label: 'Newest' }, { value: 'HIGHEST', label: 'Highest Rating' }, { value: 'LOWEST', label: 'Lowest Rating' }],
}

export default function Reviews() {
  const { customer } = useCustomer()
  const { publicHotels: hotels } = useHotels()
  const { rooms } = useRooms()
  const { reservations } = useReservations()
  const { getHotelReviews, getHotelAverageRating, getHotelReviewCount, getHotelRatingDistribution, getHotelCategoryAverages, getReviewEligibleReservations } = useReviews()
  const [params, setParams] = useSearchParams()
  const [hotelSearch, setHotelSearch] = useState('')
  const [destination, setDestination] = useState('ALL')
  const [rating, setRating] = useState('ALL')
  const [response, setResponse] = useState('ALL')
  const [roomType, setRoomType] = useState('ALL')
  const [period, setPeriod] = useState('ALL')
  const [sort, setSort] = useState('NEWEST')
  const [reviewSearch, setReviewSearch] = useState('')
  const hotelId = params.get('hotelId') || ''
  const hotel = hotels.find((item) => String(item.id) === String(hotelId))
  const showEligible = params.get('write') === '1'
  const hotelReviews = hotel ? getHotelReviews(hotel.id) : []
  const roomIds = [...new Set(hotelReviews.map((review) => {
    const reservation = reservations.find((item) => String(item.id) === String(review.reservationId))
    return getPrimaryRoomTypeId(reservation)
  }).filter(Boolean))]
  const visible = hotelReviews.filter((review) => {
    const reservation = reservations.find((item) => String(item.id) === String(review.reservationId))
    return (rating === 'ALL' || Number(review.overallRating) === Number(rating))
      && (response === 'ALL' || (response === 'RESPONDED' ? review.managementResponse : !review.managementResponse))
      && (roomType === 'ALL' || String(getPrimaryRoomTypeId(reservation)) === String(roomType))
      && (period === 'ALL' || String(reservation?.checkOut || '').startsWith(period))
      && (!reviewSearch || `${review.title} ${review.comment}`.toLowerCase().includes(reviewSearch.toLowerCase()))
  }).sort((first, second) => sort === 'HIGHEST'
    ? second.overallRating - first.overallRating
    : sort === 'LOWEST'
      ? first.overallRating - second.overallRating
      : String(second.createdAt).localeCompare(String(first.createdAt)))
  const destinations = [...new Set(hotels.map((item) => item.destination))].sort()
  const matchingHotels = hotels.filter((item) => (destination === 'ALL' || item.destination === destination)
    && (!hotelSearch || `${item.name} ${item.destination}`.toLowerCase().includes(hotelSearch.toLowerCase())))
  const eligible = customer?.id ? getReviewEligibleReservations(customer.id) : []
  const dialogEligible = params.get('hotelOnly') === '1' ? eligible.filter((item) => String(item.hotelId) === String(hotelId)) : eligible
  const average = hotel ? getHotelAverageRating(hotel.id) : null
  const count = hotel ? getHotelReviewCount(hotel.id) : 0
  const distribution = hotel ? getHotelRatingDistribution(hotel.id) : []
  const categoryAverages = hotel ? getHotelCategoryAverages(hotel.id) : {}

  const updateParams = (updates) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next)
  }
  const clearFilters = () => { setRating('ALL'); setResponse('ALL'); setRoomType('ALL'); setPeriod('ALL'); setReviewSearch('') }

  return <main className="reviews-page">
    <header className="reviews-hero"><span>Verified Guest Feedback</span><h1>Guest Reviews</h1><p>Read verified experiences from LankaStay guests.</p><button type="button" onClick={() => updateParams({ write: '1' })}><PenLine size={17} />Write a Review</button></header>
    <section className="review-hotel-discovery">
      <header><div><span>Find a property</span><h2>Choose a LankaStay Hotel</h2></div>{hotel && <button type="button" onClick={() => updateParams({ hotelId: '', write: '' })}><X size={16} />Clear selection</button>}</header>
      <div className="review-hotel-tools"><label><span>Search Hotel</span><div><Search size={17} /><input value={hotelSearch} onChange={(event) => setHotelSearch(event.target.value)} placeholder="Hotel or destination" /></div></label><ManagementSelect label="Destination" value={destination} options={[{ value: 'ALL', label: 'All Destinations' }, ...destinations.map((value) => ({ value, label: value }))]} onChange={setDestination} /></div>
      <div className="review-hotel-picker">{matchingHotels.map((item) => { const itemRating = getHotelAverageRating(item.id); const itemCount = getHotelReviewCount(item.id); return <button type="button" className={String(item.id) === String(hotelId) ? 'selected' : ''} aria-pressed={String(item.id) === String(hotelId)} onClick={() => updateParams({ hotelId: String(item.id), write: '' })} key={item.id}><img src={getHotelMainImage(item)} onError={applyImageFallback} alt={`${item.name} Main Photo`} /><span><strong>{item.name}</strong><small>{item.destination}</small><b>{itemCount ? `${itemRating.toFixed(1)} · ${itemCount} ${itemCount === 1 ? 'Review' : 'Reviews'}` : 'No Reviews Yet'}</b></span></button> })}</div>
    </section>
    {hotel && <>
      <section className="review-public-summary"><div className="review-summary-score"><strong>{average?.toFixed(1) || 'New'}</strong>{average && <span>/ 5</span>}<b>{getRatingLabel(average, count)}</b><small>{count ? `Based on ${count} ${count === 1 ? 'review' : 'reviews'}` : 'No guest reviews yet'}</small></div>{count > 0 && <div className="review-distribution">{distribution.map((item) => <div key={item.rating}><span>{item.rating} Stars</span><i><b style={{ width: `${item.percentage}%` }} /></i><strong>{item.count}</strong></div>)}</div>}{Object.keys(categoryAverages).length > 0 && <div className="review-category-summary">{REVIEW_CATEGORIES.filter(([key]) => categoryAverages[key] != null).map(([key, label]) => <div key={key}><span>{label}</span><strong>{categoryAverages[key].toFixed(1)}</strong></div>)}</div>}</section>
      <section className="review-public-list"><header><div><span>{hotel.destination}</span><h2>Reviews for {hotel.name}</h2></div></header><div className="review-public-filters"><label><span>Search Reviews</span><div><Search size={16} /><input value={reviewSearch} onChange={(event) => setReviewSearch(event.target.value)} placeholder="Title or review text" /></div></label><ManagementSelect label="Rating" value={rating} options={selectOptions.rating} onChange={setRating} /><ManagementSelect label="Stay Period" value={period} options={selectOptions.period} onChange={setPeriod} /><ManagementSelect label="Room Type" value={roomType} options={[{ value: 'ALL', label: 'All Room Types' }, ...roomIds.map((roomId) => ({ value: String(roomId), label: rooms.find((item) => String(item.id) === String(roomId))?.name || 'Room unavailable' }))]} onChange={setRoomType} /><ManagementSelect label="Response" value={response} options={selectOptions.response} onChange={setResponse} /><ManagementSelect label="Sort" value={sort} options={selectOptions.sort} onChange={setSort} /></div>
        {visible.length ? <div className="review-public-grid">{visible.map((review) => { const reservation = reservations.find((item) => String(item.id) === String(review.reservationId)); const room = rooms.find((item) => String(item.id) === String(getPrimaryRoomTypeId(reservation))); return <ReviewCard review={review} reservation={reservation} room={room} hotel={hotel} full key={review.id} /> })}</div> : <div className="review-empty"><Star size={27} /><h3>{count ? 'No Reviews match these filters.' : 'No guest reviews yet.'}</h3><p>{count ? 'Clear filters to see other verified experiences.' : 'Be the first verified guest to review this property after completing your stay.'}</p>{count ? <button type="button" onClick={clearFilters}>Clear Filters</button> : eligible.some((item) => String(item.hotelId) === String(hotel.id)) && <Link to={`/reviews/write/${eligible.find((item) => String(item.hotelId) === String(hotel.id)).id}`}>Write the First Review</Link>}</div>}
      </section>
    </>}
    {showEligible && <EligibleStaysDialog eligible={dialogEligible} hotels={hotels} rooms={rooms} onClose={() => updateParams({ write: '', hotelOnly: '' })} />}
  </main>
}

function EligibleStaysDialog({ eligible, hotels, rooms, onClose }) {
  return <div className="eligible-stays-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="eligible-stays-dialog" role="dialog" aria-modal="true" aria-labelledby="eligible-stays-title"><button type="button" className="eligible-close" onClick={onClose} aria-label="Close eligible stays"><X /></button><span>Your Completed Reservations</span><h2 id="eligible-stays-title">Your Review-Eligible Stays</h2><p>Choose one completed reservation. Hotels cannot be selected arbitrarily.</p>{eligible.length ? <div>{eligible.map((reservation) => { const hotel = hotels.find((item) => String(item.id) === String(reservation.hotelId)); const room = rooms.find((item) => String(item.id) === String(getPrimaryRoomTypeId(reservation))); return <article key={reservation.id}><img src={getHotelMainImage(hotel)} onError={applyImageFallback} alt={`${hotel?.name || 'Hotel'} Main Photo`} /><div><span><BadgeCheck size={14} />Verified completed stay</span><h3>{hotel?.name}</h3><p>{hotel?.destination} · {formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}</p><small><BedDouble size={14} />{room?.name} · {reservation.reservationCode}</small></div><Link to={`/reviews/write/${reservation.id}`}>Review This Stay<ArrowRight size={16} /></Link></article> })}</div> : <div className="review-empty"><Building2 size={27} /><h3>No eligible stays to review.</h3><p>Only completed reservations owned by this account and not already reviewed appear here.</p><Link to="/my-reservations">View My Reservations</Link></div>}</section></div>
}
