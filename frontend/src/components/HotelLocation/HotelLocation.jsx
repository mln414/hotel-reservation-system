import { Map as MapIcon, MapPin, Navigation } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import useDestinations from '../../context/useDestinations.js'
import { AttractionIcon } from '../../utils/destinationIcons.jsx'
import { formatDistanceKm, getAttractionsForHotel, hasCoordinates } from '../../utils/destinationDomain.js'
import './HotelLocation.css'
import './HotelLocationVisualRefinement.css'

const HotelMap = lazy(() => import('./HotelMap.jsx'))
export default function HotelLocation({ hotel }) {
  const { getDestinationById } = useDestinations(); const destination = getDestinationById(hotel.destinationId)
  if (!hasCoordinates(hotel)) return null
  const attractions = destination ? getAttractionsForHotel(destination, hotel, 4) : []
  const destinationName = destination?.name || hotel.destination || 'Destination unavailable'
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`
  return <section className="hotel-location-section" id="location" aria-labelledby="hotel-location-title"><div className="hotel-location-heading"><span aria-hidden="true">10</span><div><h2 id="hotel-location-title">Location</h2><p>Find {hotel.name} and explore curated places nearby.</p></div></div><div className="hotel-location-layout"><div className="hotel-location-panel"><div className="hotel-location-property"><span className="hotel-location-property-icon" aria-hidden="true"><MapPin size={22} /></span><div><h3>{hotel.name}</h3><p>{hotel.address || `${destinationName}, ${destination?.region || 'Sri Lanka'}, ${hotel.country}`}</p></div></div><dl className="hotel-location-details"><div><MapIcon aria-hidden="true" size={17} /><dt>Destination</dt><dd>{destinationName}{destination?.region ? `, ${destination.region}` : ''}</dd></div></dl>{attractions.length > 0 && <div className="hotel-nearby-attractions"><h4>Nearby Places</h4><ul>{attractions.map((item) => <li key={item.id}><AttractionIcon type={item.type} aria-hidden="true" size={18} /><span><strong>{item.name}</strong><small>{formatDistanceKm(item.distanceKm)}</small></span></li>)}</ul></div>}<div className="hotel-location-actions"><a className="hotel-location-directions" href={directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation aria-hidden="true" size={16} />Get Directions</a>{destination?.slug && <Link className="hotel-location-more" to={`/destinations/${destination.slug}`}>{attractions.length ? 'View More Nearby Places' : 'Explore Destination'}</Link>}</div><details className="hotel-location-technical"><summary>Location details</summary><p>Exact map position: {Number(hotel.latitude).toFixed(5)}, {Number(hotel.longitude).toFixed(5)}</p></details></div><div className="hotel-location-map-wrap" role="region" aria-label={`Interactive map showing the exact location of ${hotel.name}`}><Suspense fallback={<div className="hotel-location-map-fallback"><MapPin aria-hidden="true" size={26} /><p>Loading interactive map…</p></div>}><HotelMap hotel={hotel} attractions={attractions} destination={destination} /></Suspense></div></div></section>
}
