import { ArrowRight, Compass, RotateCcw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import DestinationCard from '../../components/DestinationCard/DestinationCard.jsx'
import useDestinations from '../../context/useDestinations.js'
import useHotels from '../../context/useHotels.js'
import { DESTINATION_THEMES, getDestinationMainImage } from '../../utils/destinationDomain.js'
import { filterDestinationCards, getOrderedDestinationCards } from '../../utils/destinationDiscovery.js'
import { ThemeIcon } from '../../utils/destinationIcons.jsx'
import './Destinations.css'

export default function Destinations() {
  const { activeDestinations } = useDestinations()
  const { publicHotels } = useHotels()
  const [theme, setTheme] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const themeRailRef = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchDraft.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchDraft])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    themeRailRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  }, [theme])

  const destinationCards = useMemo(() => getOrderedDestinationCards(activeDestinations, publicHotels), [activeDestinations, publicHotels])
  const visibleDestinations = useMemo(() => filterDestinationCards(destinationCards, { themeKey: theme, query: searchQuery }), [destinationCards, theme, searchQuery])
  const themeOptions = useMemo(() => DESTINATION_THEMES.filter((item) => activeDestinations.some((destination) => destination.themeKeys.includes(item.key))), [activeDestinations])
  const activeTheme = themeOptions.find((item) => item.key === theme)
  const heroImage = getDestinationMainImage(activeDestinations.find((destination) => destination.slug === 'galle') || activeDestinations[0])
  const hasFilters = Boolean(theme || searchDraft)
  const clearSearch = () => { setSearchDraft(''); setSearchQuery('') }
  const reset = () => { setTheme(''); clearSearch() }
  const resultLabel = `${visibleDestinations.length} ${visibleDestinations.length === 1 ? 'destination' : 'destinations'}${activeTheme ? ` in ${activeTheme.label}` : ''}`

  return <div className="destinations-page">
    <section className="destinations-hero" aria-labelledby="destinations-title">
      {heroImage && <img src={heroImage} alt="" aria-hidden="true" />}
      <div className="destinations-hero-overlay" />
      <div className="destinations-hero-content">
        <nav aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span aria-current="page">Destinations</span></nav>
        <span className="destinations-eyebrow">Destinations</span>
        <h1 id="destinations-title">Explore Sri Lanka</h1>
        <p>Discover beautiful destinations, unique experiences, and LankaStay hotels across the island.</p>
      </div>
    </section>

    <section className="destinations-content" aria-labelledby="destination-grid-title">
      <header className="destinations-intro"><div><span>Find your next stay</span><h2 id="destination-grid-title">From city lights to wild landscapes</h2></div><p>Explore Sri Lanka’s coast, culture, hills, and wildlife through destinations selected for memorable stays.</p></header>

      <div className="destination-discovery-controls">
        <label className="destination-customer-search"><span>Search destinations</span><div><Search aria-hidden="true" size={18} /><input type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search destinations, places or experiences" />{searchDraft && <button type="button" onClick={clearSearch} aria-label="Clear destination search"><X aria-hidden="true" size={17} /></button>}</div></label>
        <div className="destination-theme-filters" ref={themeRailRef} role="group" aria-label="Filter destinations by Travel Theme">
          <button type="button" aria-pressed={!theme} className={!theme ? 'is-active' : ''} onClick={() => setTheme('')}><Compass aria-hidden="true" size={17} />All Destinations</button>
          {themeOptions.map((item) => <button type="button" aria-pressed={theme === item.key} className={theme === item.key ? 'is-active' : ''} key={item.key} onClick={() => setTheme(item.key)}><ThemeIcon themeKey={item.key} size={17} />{item.label}</button>)}
        </div>
        <div className="destination-result-context" aria-live="polite"><p>{resultLabel}</p>{hasFilters && <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} />Reset</button>}</div>
      </div>

      {visibleDestinations.length > 0 ? <div className="destination-grid">{visibleDestinations.map((card) => <DestinationCard data={card} key={card.destination.id} />)}</div> : <div className="destination-customer-empty" role="status">
        <Search aria-hidden="true" size={27} />
        <h3>{searchQuery ? `No destinations found for “${searchQuery}”.` : 'No destinations match this theme yet.'}</h3>
        <p>{searchQuery && activeTheme ? `Try another search within ${activeTheme.label}, or reset all filters.` : searchQuery ? 'Try another place, highlight or travel theme.' : 'Explore every active LankaStay Destination instead.'}</p>
        {searchQuery ? <div><button type="button" onClick={clearSearch}>Clear Search</button>{activeTheme && <button type="button" onClick={reset}>View All Destinations</button>}</div> : <button type="button" onClick={() => setTheme('')}>View All Destinations</button>}
      </div>}
    </section>

    <section className="destinations-cta" aria-label="Explore all LankaStay hotels"><div><span>Not sure where to begin?</span><h2>Browse every LankaStay hotel</h2></div><Link to="/hotels">View All Hotels<ArrowRight aria-hidden="true" size={17} /></Link></section>
  </div>
}
