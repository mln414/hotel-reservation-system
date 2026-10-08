import { PenLine, Star } from 'lucide-react'
import { Link } from 'react-router'
import ReviewCard from '../ReviewCard/ReviewCard.jsx'
import useReservations from '../../context/useReservations.js'
import useReviews from '../../context/useReviews.js'
import useRooms from '../../context/useRooms.js'
import useCustomer from '../../context/useCustomer.js'
import { getPrimaryRoomTypeId, getRatingLabel } from '../../utils/reviewDomain.js'
import './HotelReviews.css'

export default function HotelReviews({ hotel }) {
  const { customer } = useCustomer()
  const { reservations } = useReservations()
  const { rooms } = useRooms()
  const { getHotelReviews, getHotelAverageRating, getHotelReviewCount, getHotelRatingDistribution, getReviewEligibleReservations } = useReviews()
  const reviews = getHotelReviews(hotel.id).sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)))
  const visible = reviews.slice(0, 4)
  const average = getHotelAverageRating(hotel.id)
  const count = getHotelReviewCount(hotel.id)
  const distribution = getHotelRatingDistribution(hotel.id)
  const eligible = customer?.id ? getReviewEligibleReservations(customer.id).filter((item) => String(item.hotelId) === String(hotel.id)) : []
  const writeHref = eligible.length === 1 ? `/reviews/write/${eligible[0].id}` : `/reviews?hotelId=${hotel.id}&write=1&hotelOnly=1`

  return <section className="hotel-reviews-section" id="reviews" aria-labelledby="hotel-reviews-title">
    <div className="hotel-reviews-heading-row"><div className="hotel-reviews-heading"><span aria-hidden="true">11</span><div><h2 id="hotel-reviews-title">Guest Reviews</h2><p>Verified experiences from guests who completed a stay at {hotel.name}.</p></div></div><Link className="hotel-write-review-button" to={writeHref}><PenLine size={17} />Write a Review</Link></div>
    <div className="hotel-review-summary"><div className="hotel-review-average"><strong>{average?.toFixed(1) || 'New'}</strong>{average && <span>/ 5</span>}<b>{getRatingLabel(average, count)}</b><small>{count ? `Based on ${count} ${count === 1 ? 'review' : 'reviews'}` : 'No Reviews Yet'}</small></div>{count > 0 && <div className="hotel-review-breakdown">{distribution.map((item) => <div className="hotel-review-breakdown-row" key={item.rating}><span>{item.rating} Stars</span><span className="hotel-review-progress" role="progressbar" aria-label={`${item.rating} star reviews`} aria-valuemin="0" aria-valuemax={count} aria-valuenow={item.count}><span style={{ width: `${item.percentage}%` }} /></span><strong>{item.count}</strong></div>)}</div>}</div>
    {visible.length ? <><div className="hotel-review-grid">{visible.map((review) => { const reservation = reservations.find((item) => String(item.id) === String(review.reservationId)); const room = rooms.find((item) => String(item.id) === String(getPrimaryRoomTypeId(reservation))); return <ReviewCard review={review} reservation={reservation} room={room} hotel={hotel} key={review.id} /> })}</div><Link className="hotel-reviews-toggle" to={`/reviews?hotelId=${hotel.id}`}>Show All Reviews</Link></> : <div className="hotel-reviews-empty"><Star size={27} /><h3>No Reviews Yet</h3><p>Verified guests can review this Hotel after completing their stay.</p>{eligible.length > 0 && <Link to={writeHref}>Write the First Review</Link>}</div>}
  </section>
}
