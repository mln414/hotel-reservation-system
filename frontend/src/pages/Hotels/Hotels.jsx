import { useEffect, useMemo, useState } from 'react'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import HotelCard from '../../components/HotelCard/HotelCard.jsx'
import HotelFilters from '../../components/HotelFilters/HotelFilters.jsx'
import HotelResultsHeader from '../../components/HotelResultsHeader/HotelResultsHeader.jsx'
import SearchBar from '../../components/SearchBar/SearchBar.jsx'
import useHotelDiscovery from '../../hooks/useHotelDiscovery.js'
import useHotels from '../../context/useHotels.js'
import { filterCustomerHotels, getDiscoveryPriceBounds, getHotelSearchContext, sortCustomerHotels } from '../../utils/hotelDiscovery.js'
import hotelsHeroImage from '../../assets/images/home/hero/galle-ocean-resort.png'
import kandyHeroImage from '../../assets/images/home/hero/kandy-lake-resort.png'
import sigiriyaHeroImage from '../../assets/images/home/hero/sigiriya-rock-resort.png'
import './Hotels.css'

const heroImages = [hotelsHeroImage, kandyHeroImage, sigiriyaHeroImage]
const split = (value) => value ? value.split(',').filter(Boolean) : []
const formatDate = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : ''

export default function Hotels() {
  const [params, setParams] = useSearchParams()
  const searchContext = useMemo(() => getHotelSearchContext(params), [params])
  const { hotelCards, activeDestinations, activeCollections, facilities } = useHotelDiscovery(searchContext)
  const { hotelsLoading, hotelsError } = useHotels()
  const bounds = useMemo(() => getDiscoveryPriceBounds(hotelCards), [hotelCards])
  const destinationParam = params.get('destination') || ''
  const collectionParam = params.get('collection') || ''
  const destinationFromUrl = activeDestinations.find((item) => [String(item.id), item.slug, item.name.toLowerCase()].includes(destinationParam.toLowerCase()))
  const collectionFromUrl = activeCollections.find((item) => [String(item.id), item.slug].includes(collectionParam))
  const filters = {
    destinationIds: destinationFromUrl ? [String(destinationFromUrl.id)] : split(params.get('destinations')),
    collectionIds: collectionFromUrl ? [String(collectionFromUrl.id)] : split(params.get('collections')),
    propertyTypes: split(params.get('propertyTypes')),
    facilityIds: split(params.get('facilities')),
    rating: params.get('rating') || '',
    offersOnly: params.get('offers') === '1',
    minimumPrice: Number(params.get('minPrice') || bounds.minimum),
    maximumPrice: Number(params.get('maxPrice') || bounds.maximum),
    nameQuery: params.get('q') || '',
  }
  const [hotelQuery, setHotelQuery] = useState(filters.nameQuery)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [activeHero, setActiveHero] = useState(0)
  const sortBy = params.get('sort') || 'recommended'
  const viewMode = params.get('view') === 'list' ? 'list' : 'grid'

  const setQuery = (updates, replace = false) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value == null || value === false) next.delete(key)
      else next.set(key, Array.isArray(value) ? value.join(',') : String(value))
    })
    setParams(next, { replace })
  }
  const patchFilters = (updates) => {
    const next = { ...filters, ...updates }
    setQuery({
      destination: '', destinations: next.destinationIds,
      collection: '', collections: next.collectionIds,
      propertyTypes: next.propertyTypes, facilities: next.facilityIds,
      rating: next.rating, offers: next.offersOnly ? '1' : '',
      minPrice: next.minimumPrice === bounds.minimum ? '' : next.minimumPrice,
      maxPrice: next.maximumPrice === bounds.maximum ? '' : next.maximumPrice,
    })
  }
  const resetFilters = () => setQuery({ destination: '', destinations: '', collection: '', collections: '', propertyTypes: '', facilities: '', rating: '', offers: '', minPrice: '', maxPrice: '' })

  useEffect(() => { setHotelQuery(filters.nameQuery) }, [filters.nameQuery])
  useEffect(() => { const timer = window.setTimeout(() => { if (hotelQuery !== filters.nameQuery) { const next = new URLSearchParams(params); if (hotelQuery) next.set('q', hotelQuery); else next.delete('q'); setParams(next, { replace: true }) } }, 250); return () => window.clearTimeout(timer) }, [hotelQuery, filters.nameQuery, params, setParams])
  useEffect(() => { const timer = window.setInterval(() => setActiveHero((current) => (current + 1) % heroImages.length), 5500); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (!mobileFiltersOpen) return undefined; const previous = document.body.style.overflow; const escape = (event) => { if (event.key === 'Escape') setMobileFiltersOpen(false) }; document.body.style.overflow = 'hidden'; document.addEventListener('keydown', escape); return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', escape) } }, [mobileFiltersOpen])

  const filtered = sortCustomerHotels(filterCustomerHotels(hotelCards, filters), sortBy)
  const options = useMemo(() => ({
    destinations: activeDestinations.filter((destination) => hotelCards.some((item) => String(item.destination?.id) === String(destination.id))).map((destination) => ({ ...destination, count: hotelCards.filter((item) => String(item.destination?.id) === String(destination.id)).length })),
    collections: activeCollections.filter((collection) => hotelCards.some((item) => item.collections.some((entry) => String(entry.id) === String(collection.id)))).map((collection) => ({ ...collection, count: hotelCards.filter((item) => item.collections.some((entry) => String(entry.id) === String(collection.id))).length })),
    propertyTypes: [...new Set(hotelCards.map((item) => item.hotel.propertyType).filter(Boolean))].sort().map((value) => ({ value, count: hotelCards.filter((item) => item.hotel.propertyType === value).length })),
    facilities: facilities.filter((facility) => hotelCards.some((item) => item.facilities.some((entry) => String(entry.id) === String(facility.id)))).map((facility) => ({ ...facility, count: hotelCards.filter((item) => item.facilities.some((entry) => String(entry.id) === String(facility.id))).length })),
  }), [activeDestinations, activeCollections, facilities, hotelCards])
  const activeCount = filters.destinationIds.length + filters.collectionIds.length + filters.propertyTypes.length + filters.facilityIds.length + Number(Boolean(filters.rating)) + Number(filters.offersOnly) + Number(filters.minimumPrice !== bounds.minimum || filters.maximumPrice !== bounds.maximum)
  const priceValues = hotelCards.map((item) => item.finalNightRate ?? item.fromRate).filter(Boolean)
  const detailsQuery = new URLSearchParams(Object.fromEntries([['checkIn', searchContext.checkIn], ['checkOut', searchContext.checkOut], ['adults', searchContext.adults], ['children', searchContext.children], ['rooms', searchContext.requestedRooms]].filter(([, value]) => value !== '' && value != null))).toString()
  const chips = [
    ...filters.destinationIds.map((id) => ({ key: `destination-${id}`, label: activeDestinations.find((item) => String(item.id) === id)?.name, remove: () => patchFilters({ destinationIds: filters.destinationIds.filter((item) => item !== id) }) })),
    ...filters.collectionIds.map((id) => ({ key: `collection-${id}`, label: activeCollections.find((item) => String(item.id) === id)?.title, remove: () => patchFilters({ collectionIds: filters.collectionIds.filter((item) => item !== id) }) })),
    ...filters.propertyTypes.map((value) => ({ key: `property-${value}`, label: value, remove: () => patchFilters({ propertyTypes: filters.propertyTypes.filter((item) => item !== value) }) })),
    ...filters.facilityIds.map((id) => ({ key: `facility-${id}`, label: facilities.find((item) => String(item.id) === id)?.name, remove: () => patchFilters({ facilityIds: filters.facilityIds.filter((item) => item !== id) }) })),
    ...(filters.rating ? [{ key: 'rating', label: `${filters.rating}+ Rating`, remove: () => patchFilters({ rating: '' }) }] : []),
    ...(filters.offersOnly ? [{ key: 'offers', label: 'Offers Available', remove: () => patchFilters({ offersOnly: false }) }] : []),
    ...(filters.minimumPrice !== bounds.minimum || filters.maximumPrice !== bounds.maximum ? [{ key: 'price', label: `LKR ${filters.minimumPrice.toLocaleString('en-LK')}–${filters.maximumPrice.toLocaleString('en-LK')}`, remove: () => patchFilters({ minimumPrice: bounds.minimum, maximumPrice: bounds.maximum }) }] : []),
  ].filter((item) => item.label)
  const searchSummary = searchContext.hasDates ? `${formatDate(searchContext.checkIn)} – ${formatDate(searchContext.checkOut)} · ${searchContext.totalGuests} ${searchContext.totalGuests === 1 ? 'guest' : 'guests'}` : `${hotelCards.length} ${hotelCards.length === 1 ? 'hotel' : 'hotels'} across Sri Lanka`
  const handleSearch = (values) => {
    const destination = activeDestinations.find((item) => item.name.toLowerCase() === String(values.destination || '').toLowerCase())
    const hotel = hotelCards.find((item) => item.hotel.name.toLowerCase() === String(values.destination || '').toLowerCase())
    setHotelQuery(hotel ? hotel.hotel.name : '')
    setQuery({ destination: destination?.slug || '', destinations: '', q: hotel?.hotel.name || '', checkIn: values.checkIn, checkOut: values.checkOut, adults: values.adults, children: values.children, rooms: '1' }, false)
  }

  return <div className="hotels-page">
    <section className="hotels-top-section" aria-labelledby="hotels-page-title"><div className="hotels-top-container"><div className="hotels-hero-slides" aria-hidden="true">{heroImages.map((image, index) => <div className={`hotels-hero-slide${activeHero === index ? ' hotels-hero-slide--active' : ''}`} key={image} style={{ backgroundImage: `url(${image})` }} />)}</div><div className="hotels-hero-dots" aria-label="Hero image selection">{heroImages.map((image, index) => <button aria-label={`Show hero image ${index + 1}`} aria-pressed={activeHero === index} className={`hotels-hero-dot${activeHero === index ? ' hotels-hero-dot--active' : ''}`} key={image} type="button" onClick={() => setActiveHero(index)} />)}</div><nav className="hotels-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span aria-current="page">Hotels</span></nav><div className="hotels-hero-content"><header className="hotels-top-heading"><p className="hotels-eyebrow">Discover Sri Lanka</p><h1 id="hotels-page-title">Find Your Perfect Stay</h1><p className="hotels-top-description">Explore public, booking-ready LankaStay Hotels using live rates, availability, offers and verified guest feedback.</p></header></div><div className="hotels-search-wrapper"><SearchBar initialValues={{ destination: destinationFromUrl?.name || filters.nameQuery, ...searchContext }} onSearch={handleSearch} /></div></div></section>
    <section className="hotels-main-section" aria-label="Hotel filters and results"><div className="hotels-main-container"><button aria-controls="mobile-hotel-filters" aria-expanded={mobileFiltersOpen} className="mobile-filter-button" type="button" onClick={() => setMobileFiltersOpen(true)}><SlidersHorizontal size={19} />Filters{activeCount > 0 && <span>{activeCount}</span>}</button><button aria-label="Close filters" className={`mobile-filter-overlay${mobileFiltersOpen ? ' mobile-filter-overlay--open' : ''}`} type="button" onClick={() => setMobileFiltersOpen(false)} /><aside aria-label="Hotel filters" className={`mobile-filter-panel${mobileFiltersOpen ? ' mobile-filter-panel--open' : ''}`} id="mobile-hotel-filters"><div className="mobile-filter-panel-header"><span>Filter Hotels</span><button aria-label="Close filters" className="mobile-filter-close" type="button" onClick={() => setMobileFiltersOpen(false)}><X size={21} /></button></div><HotelFilters filters={filters} options={options} priceBounds={bounds} priceValues={priceValues} resultCount={filtered.length} activeCount={activeCount} onChange={patchFilters} onReset={resetFilters} onClose={() => setMobileFiltersOpen(false)} /></aside>
      <div className="hotels-results-area"><section className="hotels-search-context" aria-live="polite"><div><span>{destinationFromUrl ? `Stays in ${destinationFromUrl.name}` : collectionFromUrl ? collectionFromUrl.title : 'Your LankaStay search'}</span><h2>{filtered.length} {filtered.length === 1 ? 'stay' : 'stays'} found{destinationFromUrl ? ` in ${destinationFromUrl.name}` : ''}</h2><p>{searchSummary}</p></div><label><span>Search by Hotel name</span><input value={hotelQuery} onChange={(event) => setHotelQuery(event.target.value)} placeholder="e.g. LankaStay Ocean Bay" /></label></section>
        {chips.length > 0 && <div className="hotel-filter-chips" aria-label="Applied filters">{chips.map((chip) => <button type="button" onClick={chip.remove} key={chip.key}>{chip.label}<X size={14} /></button>)}<button className="reset" type="button" onClick={resetFilters}>Reset Filters</button></div>}
        <HotelResultsHeader totalHotels={filtered.length} sortBy={sortBy} viewMode={viewMode} onSortChange={(value) => setQuery({ sort: value === 'recommended' ? '' : value })} onViewChange={(value) => setQuery({ view: value === 'grid' ? '' : value })} />
        {hotelsLoading ? <div className="hotels-results-empty" role="status"><strong>Loading hotels...</strong></div>
          : hotelsError ? <div className="hotels-results-empty" role="alert"><strong>Unable to load hotel information. Please try again.</strong><p>{hotelsError}</p><button type="button" onClick={() => window.location.reload()}>Try Again</button></div>
            : filtered.length ? <div className={`hotel-results-grid hotel-results-grid--${viewMode}`}>{filtered.map((item) => <HotelCard data={item} key={item.hotel.id} viewMode={viewMode} detailsQuery={detailsQuery} />)}</div>
              : <div className="hotels-results-empty"><span><SearchX size={25} /></span><strong>{hotelCards.length ? 'No hotels match these filters.' : 'No hotels found.'}</strong><p>{hotelCards.length ? 'Try removing one or more filters or changing your stay dates.' : 'There are no published Hotels available right now.'}</p>{hotelCards.length > 0 && <button type="button" onClick={resetFilters}>Reset Filters</button>}</div>}
      </div>
    </div></section>
  </div>
}
