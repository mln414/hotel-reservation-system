import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Compass, MapPin, Star, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import useDestinations from '../../context/useDestinations.js'
import useHotels from '../../context/useHotels.js'
import usePropertyContent from '../../context/usePropertyContent.js'
import useHotelDiscovery from '../../hooks/useHotelDiscovery.js'
import { categoryLabel, contentTypeLabel, getExperienceHeroImage, getRelatedHotelsForExperience, normalizeId } from '../../utils/contentDomain.js'
import { getHotelMainImage } from '../../utils/hotelMedia.js'
import { formatOfferDiscount } from '../../utils/offerEligibility.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import './ExperienceDetails.css'

export default function ExperienceDetails() {
  const { slug } = useParams()
  const { experiences } = usePropertyContent()
  const { publicHotels } = useHotels()
  const { activeDestinations } = useDestinations()
  const { hotelCards } = useHotelDiscovery()
  const [lightbox, setLightbox] = useState('')
  const closeRef = useRef(null)
  const experience = experiences.find((item) => item.slug === slug && item.status === 'ACTIVE')

  useEffect(() => {
    if (!lightbox) return undefined
    const close = (event) => { if (event.key === 'Escape') setLightbox('') }
    document.addEventListener('keydown', close)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', close)
  }, [lightbox])

  if (!experience) return <section className="experience-details-state"><Compass size={28}/><h1>Experience Not Found</h1><p>The Experience or Story you are looking for is unavailable.</p><div><Link to="/experiences"><ArrowLeft size={16}/>View Experiences</Link><Link to="/hotels">Explore Hotels<ArrowRight size={16}/></Link></div></section>

  const destination = activeDestinations.find((item) => normalizeId(item.id) === normalizeId(experience.destinationId))
  const relatedHotelIds = new Set(getRelatedHotelsForExperience(experience, publicHotels).map((hotel) => String(hotel.id)))
  const relatedHotels = hotelCards.filter((item) => relatedHotelIds.has(String(item.hotel.id)))
  const gallery = [...new Set(experience.galleryImages || [])]
  const paragraphs = String(experience.fullDescription || experience.description || '').split(/\n\s*\n/).filter(Boolean)
  const details = [['Duration', experience.contentType === 'EXPERIENCE' && experience.duration, <Clock3 key="duration"/>], ['Best Time', experience.contentType === 'EXPERIENCE' && experience.bestTime, <Compass key="best-time"/>], ['Location', experience.locationText, <MapPin key="location"/>], ['Destination', destination?.name, <MapPin key="destination"/>]].filter(([, value]) => value)

  return <main className="experience-detail">
    <nav aria-label="Breadcrumb"><Link to="/">Home</Link><span>›</span><Link to="/experiences">Experiences</Link><span>›</span><span aria-current="page">{experience.title}</span></nav>
    <header className="experience-detail-hero"><img src={getExperienceHeroImage(experience)} alt={experience.title}/><span/><div><small>{contentTypeLabel(experience.contentType)} · {categoryLabel(experience.category)}</small><h1>{experience.title}</h1>{(destination || experience.locationText) && <p><MapPin size={17}/>{destination?.name || experience.locationText}</p>}</div></header>
    <section className="experience-detail-intro"><span>Discover the journey</span><p>{experience.shortDescription}</p></section>
    {gallery.length > 0 && <section className="experience-detail-gallery" aria-labelledby="experience-gallery-title"><h2 id="experience-gallery-title">Gallery</h2><div>{gallery.slice(0, 3).map((image, index) => <button type="button" key={image} onClick={() => setLightbox(image)}><img loading="lazy" src={image} alt={`${experience.title} Gallery Photo ${index + 1}`}/></button>)}</div></section>}
    <div className="experience-detail-body"><article>{paragraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 30)}-${index}`}>{paragraph}</p>)}</article>{details.length > 0 && <aside><h2>Experience Details</h2><dl>{details.map(([label, value, icon]) => <div key={label}><dt>{icon}{label}</dt><dd>{value}</dd></div>)}{experience.suitableFor?.length > 0 && <div><dt>Suitable For</dt><dd>{experience.suitableFor.join(', ')}</dd></div>}</dl></aside>}</div>
    {experience.highlights?.length > 0 && <section className="experience-highlights"><span>What to expect</span><h2>Experience Highlights</h2><div>{experience.highlights.map((item) => <article key={item}><CheckCircle2 size={19}/><strong>{item}</strong></article>)}</div></section>}
    {relatedHotels.length > 0 && <section className="experience-related-hotels"><span>Plan your stay</span><h2>Stay Near This Experience</h2><div>{relatedHotels.map(({ hotel, destination: hotelDestination, rating, reviewCount, fromRate, advertisedOffer }) => <article key={hotel.id}><img loading="lazy" src={getHotelMainImage(hotel)} alt={hotel.name}/><div><small><MapPin size={13}/>{hotelDestination?.name || 'Destination unavailable'}</small><h3>{hotel.name}</h3><p><Star size={14} fill="currentColor"/>{reviewCount ? `${rating.toFixed(1)} · ${reviewCount}` : 'New · No Reviews Yet'}</p>{advertisedOffer && <strong>Up to {formatOfferDiscount(advertisedOffer)} available · {advertisedOffer.title}</strong>}<p>{fromRate ? `From ${formatRateAmount(fromRate)} / night` : 'Check rates'}</p><Link to={`/hotels/${hotel.id}`}>View Hotel<ArrowRight size={15}/></Link></div></article>)}</div><Link className="find-stay" to="/hotels">Find Your Stay<ArrowRight size={16}/></Link></section>}
    {lightbox && <div className="experience-lightbox" role="dialog" aria-modal="true" aria-label="Experience image preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox('') }}><div><button ref={closeRef} type="button" aria-label="Close image preview" onClick={() => setLightbox('')}><X/></button><img src={lightbox} alt={`${experience.title} enlarged Gallery Photo`}/></div></div>}
  </main>
}
