import { BadgeCheck, BedDouble, CalendarDays, ImagePlus, ShieldCheck, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ReviewCard from '../../components/ReviewCard/ReviewCard.jsx'
import ReviewStars from '../../components/ReviewStars/ReviewStars.jsx'
import useHotels from '../../context/useHotels.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import useReservations from '../../context/useReservations.js'
import useReviews from '../../context/useReviews.js'
import useRooms from '../../context/useRooms.js'
import useCustomer from '../../context/useCustomer.js'
import reviewApi from '../../services/reviewApi.js'
import { getHotelMainImage } from '../../utils/hotelMedia.js'
import { formatReservationDate } from '../../utils/reservationFormatting.js'
import { getPrimaryRoomTypeId, REVIEW_CATEGORIES, REVIEW_ELIGIBILITY } from '../../utils/reviewDomain.js'
import './ReviewEditor.css'

const blank = { overallRating: 0, categoryRatings: {}, title: '', comment: '', photos: [] }

export default function ReviewEditor() {
  const { pathname } = useLocation()
  const { loading: reviewsLoading, reviewsError, refreshReviews } = useReviews()
  const { reservationsLoading, reservationsError } = useReservations()
  const { loading: customerLoading } = useCustomer()
  const { hotelsLoading } = useHotels()
  const { loading: roomsLoading } = useRooms()

  if (reviewsLoading || reservationsLoading || customerLoading || hotelsLoading || roomsLoading) {
    return <main className="review-editor-page"><p role="status">Loading your stay and review…</p></main>
  }
  if (reservationsError) {
    return <main className="review-editor-page"><p role="alert">{reservationsError}</p><Link to="/my-reservations">View My Reservations</Link></main>
  }
  if (reviewsError) {
    return <main className="review-editor-page"><p role="alert">{reviewsError}</p><button type="button" onClick={refreshReviews}>Try again</button></main>
  }
  return <ReviewEditorContent key={pathname} />
}

function ReviewEditorContent() {
  const { id, reservationId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { notify } = useManagementFeedback()
  const { hotels } = useHotels()
  const { rooms } = useRooms()
  const { reservations } = useReservations()
  const { customer } = useCustomer()
  const {
    reviewStays,
    getReviewById,
    canCustomerReviewReservation,
    canCustomerEditReview,
    createReview,
    updateReview,
    deleteCustomerReview,
  } = useReviews()

  const editing = pathname.endsWith('/edit')
  const viewing = Boolean(id) && !editing
  const review = id ? getReviewById(id) : null
  const reservation = reservations.find((item) => String(item.id) === String(review?.reservationId || reservationId))
  const stay = reviewStays.find((item) => String(item.reservationId) === String(reservation?.id))
  const hotel = hotels.find((item) => String(item.id) === String(reservation?.hotelId)) || (reservation && {
    id: reservation.hotelId,
    name: stay?.hotelName || 'Your booked hotel',
    destination: stay?.hotelDestination || '',
    mainImage: stay?.hotelImage,
  })
  const room = rooms.find((item) => String(item.id) === String(getPrimaryRoomTypeId(reservation))) || {
    name: stay?.roomName || review?.roomName || reservation?.items?.[0]?.roomName || 'Your booked room',
  }
  const eligibility = reservationId ? canCustomerReviewReservation(customer?.id, reservationId) : null
  const allowedEdit = editing && canCustomerEditReview(customer?.id, review)

  const [form, setForm] = useState(() =>
    review
      ? {
          overallRating: review.overallRating,
          categoryRatings: { ...review.categoryRatings },
          title: review.title,
          comment: review.comment,
          photos: [...(review.photos || [])],
        }
      : blank
  )
  const [errors, setErrors] = useState({})
  const [policy, setPolicy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submitPending = useRef(false)

  const reason = useMemo(
    () =>
      ({
        [REVIEW_ELIGIBILITY.NOT_AUTHENTICATED]: 'Please sign in before reviewing a stay.',
        [REVIEW_ELIGIBILITY.NOT_OWNER]: 'This reservation does not belong to your account.',
        [REVIEW_ELIGIBILITY.NOT_COMPLETED]: 'Only completed LankaStay reservations can be reviewed.',
        [REVIEW_ELIGIBILITY.NOT_FOUND]: 'The requested reservation could not be found.',
        [REVIEW_ELIGIBILITY.ALREADY_REVIEWED]: 'You already reviewed this stay.',
      }[eligibility?.reason]),
    [eligibility]
  )

  if (viewing && (!review || String(review.customerId) !== String(customer?.id) || review.status !== 'ACTIVE')) {
    return (
      <main className="review-editor-page">
        <section className="review-unavailable">
          <ShieldCheck size={32} />
          <h1>Review unavailable</h1>
          <p>This Review is not available to the current account.</p>
          <div>
            <Link to="/profile#my-reviews">My Reviews</Link>
            <Link to="/reviews">Guest Reviews</Link>
          </div>
        </section>
      </main>
    )
  }

  if (viewing && review && reservation) {
    return (
      <main className="review-editor-page">
        <ReviewHeader title="Your Review" copy="A verified account of your completed LankaStay reservation." />
        <Context hotel={hotel} room={room} reservation={reservation} />
        <ReviewCard full review={review} reservation={reservation} room={room} hotel={hotel} />
        {canCustomerEditReview(customer?.id, review) && (
          <div className="review-view-actions">
            <Link to={`/reviews/${review.id}/edit`}>Edit Review</Link>
            <button type="button" onClick={() => setDeleteOpen(true)}>
              Delete Review
            </button>
          </div>
        )}
        {deleteOpen && (
          <ManagementDialog
            danger
            title="Permanently delete your Review?"
            description="Are you sure you want to permanently delete this review? It will disappear publicly and no longer contribute to this Hotel's rating."
            onClose={() => setDeleteOpen(false)}
            actions={
              <>
                <button onClick={() => setDeleteOpen(false)}>Cancel</button>
                <button
                  className="danger"
                  onClick={async () => {
                    const res = await deleteCustomerReview(review.id, customer?.id)
                    if (res.error) {
                      notify(res.error, 'error')
                    } else {
                      notify('Review deleted successfully.')
                      navigate('/profile#my-reviews')
                    }
                  }}
                >
                  Delete Review
                </button>
              </>
            }
          />
        )}
      </main>
    )
  }

  if ((reservationId && !eligibility?.eligible) || (editing && !allowedEdit) || !reservation) {
    return (
      <main className="review-editor-page">
        <section className="review-unavailable">
          <ShieldCheck size={32} />
          <h1>
            {eligibility?.reason === REVIEW_ELIGIBILITY.ALREADY_REVIEWED
              ? 'You already reviewed this stay.'
              : 'Review unavailable'}
          </h1>
          <p>{reason || (!reservation ? 'The requested reservation could not be found.' : 'This review cannot be edited from the current account.')}</p>
          <div>
            {eligibility?.review && (
              <>
                <Link to={`/reviews/${eligibility.review.id}`}>View My Review</Link>
                {canCustomerEditReview(customer?.id, eligibility.review) && <Link to={`/reviews/${eligibility.review.id}/edit`}>Edit Review</Link>}
              </>
            )}
            <Link to="/my-reservations">View My Reservations</Link>
            <Link to={hotel ? `/hotels/${hotel.id}` : '/reviews'}>Back</Link>
          </div>
        </section>
      </main>
    )
  }

  const change = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const upload = async (event) => {
    const files = [...(event.target.files || [])].filter((file) => file.type.startsWith('image/')).slice(0, 5 - form.photos.length)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      try {
        const uploaded = await reviewApi.uploadPhoto(file)
        if (uploaded?.url) {
          setForm((current) => ({
            ...current,
            photos: [...current.photos, uploaded.url].slice(0, 5),
          }))
        }
      } catch {
        notify('Photo upload failed. Please try a valid image under 5MB.', 'error')
      }
    }
    setUploading(false)
    event.target.value = ''
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitPending.current || uploading) return
    const next = {}
    if (form.overallRating < 1) next.overallRating = 'Choose an Overall Rating.'
    if (!form.title.trim()) next.title = 'Review Title is required.'
    else if (form.title.trim().length < 4) next.title = 'Use at least 4 characters.'
    if (form.comment.trim().length < 20)
      next.comment = 'Tell future travellers about your stay using at least 20 characters.'
    setErrors(next)
    if (Object.keys(next).length) return

    submitPending.current = true
    setSubmitting(true)

    const data = { ...form, title: form.title.trim(), comment: form.comment.trim() }
    const result = editing
      ? await updateReview(review.id, customer?.id, data)
      : await createReview({ ...data, customerId: customer?.id, reservationId: reservation.id, hotelId: hotel.id })

    if (result.error) {
      submitPending.current = false
      setSubmitting(false)
      notify(result.error || 'This completed stay cannot be reviewed again.', 'error')
      return
    }
    notify(editing ? 'Review updated successfully' : 'Review submitted successfully')
    navigate(`/reviews/${result.review?.id || review.id}`)
  }

  return (
    <main className="review-editor-page">
      <ReviewHeader
        title={editing ? 'Edit Your Review' : 'Write a Review'}
        copy="Share an honest account of your experience to help future travellers."
      />
      <Context hotel={hotel} room={room} reservation={reservation} />
      <form className="review-form-card" onSubmit={submit} noValidate>
        <section>
          <h2>How was your stay?</h2>
          <label>Overall Rating *</label>
          <ReviewStars
            value={form.overallRating}
            onChange={(value) => change('overallRating', value)}
            label="Overall Rating"
            size={29}
          />
          {errors.overallRating && <small className="review-form-error">{errors.overallRating}</small>}
        </section>
        <section>
          <h2>Category Ratings</h2>
          <p>Optional details help future guests. Your Overall Rating remains your independent choice.</p>
          <div className="review-category-ratings">
            {REVIEW_CATEGORIES.map(([key, label]) => (
              <div key={key}>
                <label>{label}</label>
                <ReviewStars
                  value={form.categoryRatings[key] || 0}
                  onChange={(value) => change('categoryRatings', { ...form.categoryRatings, [key]: value })}
                  label={label}
                  size={22}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="review-form-fields">
          <label>
            <span>Review Title *</span>
            <input
              value={form.title}
              maxLength={100}
              placeholder="Summarize your stay"
              onChange={(event) => change('title', event.target.value)}
            />
            <small>{form.title.length}/100</small>
            {errors.title && <b>{errors.title}</b>}
          </label>
          <label>
            <span>Your Review *</span>
            <textarea
              rows="7"
              maxLength={1500}
              value={form.comment}
              placeholder="Tell future travellers about your stay."
              onChange={(event) => change('comment', event.target.value)}
            />
            <small>{form.comment.length}/1500</small>
            {errors.comment && <b>{errors.comment}</b>}
          </label>
        </section>
        <section>
          <h2>Optional Photos</h2>
          <p>Add up to five photos for your stay review.</p>
          <label className="review-photo-upload">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={uploading} />
            <ImagePlus size={19} />
            {uploading ? 'Uploading...' : 'Select Photos'}
          </label>
          <div className="review-photo-previews">
            {form.photos.map((photo, index) => (
              <figure key={`${photo}-${index}`}>
                <img src={photo} alt={`Review preview ${index + 1}`} />
                <button
                  type="button"
                  aria-label={`Remove review photo ${index + 1}`}
                  onClick={() => change('photos', form.photos.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 size={16} />
                </button>
              </figure>
            ))}
          </div>
        </section>
        <aside className="review-policy-note">
          <ShieldCheck size={20} />
          <p>
            Reviews should reflect your genuine stay and must not contain spam, threats, private information or abusive
            content.
          </p>
          <button type="button" onClick={() => setPolicy(true)}>
            Review Policy
          </button>
        </aside>
        <footer>
          <Link to={editing ? `/reviews/${review.id}` : `/hotels/${hotel.id}`}>Cancel</Link>
          <button type="submit" disabled={submitting || uploading}>{submitting ? 'Saving…' : editing ? 'Save Review Changes' : 'Submit Review'}</button>
        </footer>
      </form>
      {policy && (
        <ManagementDialog
          title="LankaStay Review Policy"
          description="Reviews must come from genuine completed stays. Honest negative feedback is allowed. Spam, abuse, threats and private information may be moderated. Management responses never alter Guest reviews."
          onClose={() => setPolicy(false)}
          actions={<button onClick={() => setPolicy(false)}>Close</button>}
        />
      )}
    </main>
  )
}

function ReviewHeader({ title, copy }) {
  return (
    <header className="review-editor-header">
      <span>Verified Guest Feedback</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  )
}

function Context({ hotel, room, reservation }) {
  return (
    <section className="review-context-card">
      <img src={getHotelMainImage(hotel)} alt={`${hotel.name} in ${hotel.destination || hotel.city}`} />
      <div>
        <span>
          <BadgeCheck size={16} />
          Verified Stay
        </span>
        <h2>{hotel.name}</h2>
        <p>
          {hotel.destination || hotel.city}, {hotel.country}
        </p>
        <dl>
          <div>
            <CalendarDays size={17} />
            <dt>Stay</dt>
            <dd>
              {formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}
            </dd>
          </div>
          <div>
            <BedDouble size={17} />
            <dt>Room Type</dt>
            <dd>{room.name}</dd>
          </div>
        </dl>
        <small>Reservation {reservation.reservationCode || reservation.reference}</small>
      </div>
    </section>
  )
}
