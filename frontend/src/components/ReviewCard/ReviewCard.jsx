import { BadgeCheck, BedDouble, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import ReviewStars from '../ReviewStars/ReviewStars.jsx'
import { formatReservationDate } from '../../utils/reservationFormatting.js'
import { formatStayedMonth, getInitials } from '../../utils/reviewDomain.js'
import './ReviewCard.css'

export default function ReviewCard({ review, reservation, room, hotel, full = false }) {
  const [expanded, setExpanded] = useState(false)
  const [photo, setPhoto] = useState('')
  const guestName = reservation?.guest?.name || 'LankaStay Guest'
  const customerUpdatedAt = review.customerUpdatedAt || review.createdAt
  const edited = customerUpdatedAt && review.createdAt && customerUpdatedAt !== review.createdAt
  const comment = review.comment || ''
  const clipped = !full && !expanded && comment.length > 280
  return <article className="shared-review-card">
    <header><span className="shared-review-avatar" aria-hidden="true">{getInitials(guestName)}</span><div><h3>{guestName}</h3><ReviewStars value={review.overallRating} size={17} /></div><span className="shared-review-verified"><BadgeCheck size={15} />Verified Stay</span></header>
    <h4>{review.title}</h4><p>{clipped ? `${comment.slice(0, 280).trim()}…` : comment}</p>
    {comment.length > 280 && !full && <button className="shared-review-read-more" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show Less' : 'Read More'}</button>}
    {review.photos?.length > 0 && <div className="shared-review-photos">{review.photos.map((image, index) => <button type="button" onClick={() => setPhoto(image)} aria-label={`View review photo ${index + 1}`} key={`${image}-${index}`}><img src={image} alt="" /></button>)}</div>}
    <footer><span><CalendarDays size={15} />{formatStayedMonth(reservation)}</span>{room && <span><BedDouble size={15} />{room.name}</span>}{edited && <span>Edited · {formatReservationDate(customerUpdatedAt.slice(0, 10))}</span>}</footer>
    {review.managementResponse && <section className="shared-review-response" aria-label="Management response"><span>Response from {hotel?.name || 'LankaStay'}</span><strong>{review.managementResponse.respondedRole || 'Hotel Management'}</strong><p>{review.managementResponse.responseText}</p><small>Responded {formatReservationDate(review.managementResponse.respondedAt.slice(0, 10))}{review.managementResponse.updatedAt ? ' · Edited' : ''}</small></section>}
    {photo && <div className="review-photo-lightbox" role="dialog" aria-modal="true" aria-label="Review photo preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPhoto('') }}><button type="button" onClick={() => setPhoto('')}>Close</button><img src={photo} alt="Guest review" /></div>}
  </article>
}
