import { ArrowRight, Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router'
import useSavedHotels from '../../context/useSavedHotels.js'
import { formatOfferDiscount } from '../../utils/offerEligibility.js'
import { getFacilityIcon } from '../../utils/facilityIcons.js'
import { applyImageFallback, getHotelMainImage } from '../../utils/hotelMedia.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import './HotelCard.css'

export default function HotelCard({ data, viewMode = 'grid', detailsQuery = '' }) {
  const { isHotelSaved, toggleSavedHotel } = useSavedHotels()
  if (!data?.hotel) return null
  const { hotel, destination, facilities, rating, reviewCount, fromRate, finalNightRate, eligibleOffer, advertisedOffer, currentOffers, searchContext } = data
  const saved = isHotelSaved(hotel.id)
  const detailsUrl = `/hotels/${hotel.id}${detailsQuery ? `?${detailsQuery}` : ''}`
  return <article className={`hotel-card hotel-card--${viewMode}`}>
    <Link className="hotel-card-overlay-link" to={detailsUrl} aria-label={`View ${hotel.name}`} />
    <div className="hotel-card-media"><img className="hotel-card-image" src={getHotelMainImage(hotel)} onError={applyImageFallback} alt={`${hotel.name}${destination ? ` in ${destination.name}` : ''}`} />{hotel.featured && <span className="hotel-card-badge">Featured</span>}<button aria-label={saved ? `Remove ${hotel.name} from saved stays` : `Save ${hotel.name}`} aria-pressed={saved} className={`hotel-card-favourite${saved ? ' hotel-card-favourite--active' : ''}`} type="button" onClick={() => toggleSavedHotel(hotel.id)}><Heart aria-hidden="true" size={20} /></button></div>
    <div className="hotel-card-details"><div className="hotel-card-heading-row"><div><span className="hotel-card-category">{hotel.propertyType || 'Property'}</span><h3>{hotel.name}</h3></div><div className="hotel-card-rating" aria-label={reviewCount ? `${rating} out of 5 from ${reviewCount} reviews` : 'No Reviews Yet'}><Star aria-hidden="true" size={16} /><strong>{reviewCount ? rating.toFixed(1) : 'New'}</strong><span>{reviewCount ? `(${reviewCount})` : 'No Reviews Yet'}</span></div></div><p className="hotel-card-location"><MapPin aria-hidden="true" size={16} />{destination ? `${destination.name}, Sri Lanka` : 'Destination unavailable'}</p><p className="hotel-card-description">{hotel.shortDescription || 'Hotel details will be available soon.'}</p>
      <ul className="hotel-card-facilities" aria-label="Hotel facilities">{facilities.slice(0, 4).map((facility) => { const Icon = getFacilityIcon(facility.iconKey); return <li key={facility.id}><Icon aria-hidden="true" size={15} />{facility.name}</li> })}{facilities.length > 4 && <li className="hotel-card-more-facilities">+{facilities.length - 4} more</li>}</ul>
      {!searchContext.hasDates && advertisedOffer && <div className="hotel-card-offer"><strong>{currentOffers.length > 1 ? `Up to ${formatOfferDiscount(advertisedOffer)}` : `${formatOfferDiscount(advertisedOffer)} available`}</strong><span>{advertisedOffer.title}</span></div>}
      {searchContext.hasDates && eligibleOffer && <div className="hotel-card-offer"><strong>{formatOfferDiscount(eligibleOffer)}</strong><span>{eligibleOffer.title} · eligible for these dates</span></div>}
    </div>
    <div className="hotel-card-actions"><div className={`hotel-card-price${eligibleOffer ? ' hotel-card-price--offer' : ''}`}>{eligibleOffer && fromRate && <del>{formatRateAmount(fromRate)}</del>}<span>{searchContext.hasDates ? 'Best available from' : 'From'}</span><strong>{finalNightRate ? formatRateAmount(finalNightRate) : 'Check rates'}</strong><small>{finalNightRate ? 'per night' : 'No valid Room Type Rate'}</small></div><Link className="hotel-card-details-link" to={detailsUrl}>View Hotel<ArrowRight aria-hidden="true" size={17} /></Link></div>
  </article>
}
