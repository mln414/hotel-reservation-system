import { ArrowLeft, ArrowRight, Building2, ExternalLink, Image as ImageIcon, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router'
import DestinationMap from '../../components/DestinationMap/DestinationMap.jsx'
import HotelCard from '../../components/HotelCard/HotelCard.jsx'
import useDestinations from '../../context/useDestinations.js'
import useHotelDiscovery from '../../hooks/useHotelDiscovery.js'
import { AttractionIcon, ThemeIcon } from '../../utils/destinationIcons.jsx'
import { ATTRACTION_TYPES, calculateDistanceKm, formatDistanceKm, getActiveAttractions, getDestinationThemes } from '../../utils/destinationDomain.js'
import './DestinationDetails.css'
import './DestinationAttractions.css'

export default function DestinationDetails() {
  const { slug } = useParams()
  const { getDestinationBySlug } = useDestinations()
  const { hotelCards } = useHotelDiscovery()
  const destination = getDestinationBySlug(slug)
  if (!destination || destination.status !== 'ACTIVE') return <main className="customer-destination-missing"><MapPin size={32} /><h1>Destination unavailable</h1><p>This Destination is not currently available for public discovery.</p><Link to="/destinations"><ArrowLeft size={17} />Explore Destinations</Link></main>
  const themes = getDestinationThemes(destination)
  const attractions = getActiveAttractions(destination)
  const hotels = hotelCards.filter((item) => String(item.destination?.id) === String(destination.id))
  const focalPosition = `${destination.imageFocalPoint?.x ?? 50}% ${destination.imageFocalPoint?.y ?? 50}%`
  return <main className="customer-destination-detail"><section className="customer-destination-hero">{destination.mainImage ? <img src={destination.mainImage} alt={`${destination.name}, Sri Lanka`} style={{ objectPosition: focalPosition }} /> : <div><ImageIcon size={35} /></div>}<div className="customer-destination-overlay" /><div className="customer-destination-hero-copy"><nav><Link to="/destinations">Destinations</Link><span>/</span><span>{destination.name}</span></nav><p>{destination.region}{destination.district ? ` · ${destination.district} District` : ''}</p><h1>{destination.name}</h1><div>{themes.map((theme) => <span key={theme.key}><ThemeIcon themeKey={theme.key} size={15} />{theme.label}</span>)}</div></div></section>
    <section className="customer-destination-content"><div className="customer-destination-intro"><article><span>Discover {destination.name}</span><h2>A closer look at the Destination</h2>{destination.fullDescription.split(/\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article><aside><strong>Highlights</strong>{destination.highlights.length ? <ul>{destination.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : <p>More local highlights are coming soon.</p>}</aside></div>
      <section className="customer-attractions"><header><div><span>Places to explore</span><h2>Nearby Attractions</h2></div><p>Curated by LankaStay and ordered for this Destination.</p></header>{attractions.length ? <div>{attractions.map((item) => <article key={item.id}>{item.image && <img src={item.image} alt={`${item.name} near ${destination.name}`} />}<span><AttractionIcon type={item.type} size={21} /></span><div><small>{ATTRACTION_TYPES.find((type) => type.key === item.type)?.label}</small><h3>{item.name}</h3><p>{item.shortDescription || 'A curated place near this Destination.'}</p><strong>{formatDistanceKm(calculateDistanceKm(destination, item))} from Destination centre</strong>{item.latitude != null && item.longitude != null && <a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer">View on Map <ExternalLink size={14} /></a>}</div></article>)}</div> : <p className="customer-destination-empty-state">Curated nearby attractions will be added soon.</p>}</section>
      <section className="customer-destination-map"><header><span>Find your way</span><h2>{destination.region}{destination.district ? ` · ${destination.district} District` : ''}</h2><p>The map shows the Destination centre and its active curated attractions.</p></header><DestinationMap destination={destination} /></section>
      <section className="customer-destination-hotels"><header><div><span>Stay in {destination.name}</span><h2>Hotels in this Destination</h2></div><strong><Building2 size={17} />{hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'}</strong></header>{hotels.length ? <div>{hotels.map((item) => <HotelCard key={item.hotel.id} data={item} />)}</div> : <div className="customer-destination-empty-state"><p>No public Hotels are currently available in this Destination.</p><Link to={`/hotels?destination=${destination.slug}`}>Browse All Hotels<ArrowRight size={16} /></Link></div>}</section>
    </section></main>
}
