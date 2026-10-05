import { Building2, CircleCheck, FilterX, Image as ImageIcon, MapPinned, Plus, Power, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import DestinationStatusModal from '../../components/DestinationStatusModal/DestinationStatusModal.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import useDestinations from '../../context/useDestinations.js'
import useHotels from '../../context/useHotels.js'
import { DESTINATION_STATUS, DESTINATION_THEMES, getDestinationThemes, getHotelsForDestination } from '../../utils/destinationDomain.js'
import { ThemeIcon } from '../../utils/destinationIcons.jsx'
import './ManageDestinations.css'

function relativeDate(value, submitted = false) {
  if (!value) return 'Initial data'
  const minutes = (Date.now() - new Date(value).getTime()) / 60000
  const verb = submitted ? 'Submitted' : 'Updated'
  if (minutes < 1) return `${verb} just now`
  if (minutes < 60) return `${verb} ${Math.max(1, Math.floor(minutes))} min ago`
  if (minutes < 1440) return `${verb} ${Math.max(1, Math.floor(minutes / 60))} hr ago`
  if (minutes < 2880) return `${verb} yesterday`
  return `${verb} ${new Date(value).toLocaleDateString('en-GB')}`
}

function DestinationImage({ destination }) {
  const [failed, setFailed] = useState(false)
  const position = `${destination.imageFocalPoint?.x ?? 50}% ${destination.imageFocalPoint?.y ?? 50}%`
  return failed || !destination.mainImage ? <span className="destination-image-fallback"><ImageIcon size={20} /></span> : <img src={destination.mainImage} alt="" style={{ objectPosition: position }} onError={() => setFailed(true)} />
}

function ThemeProjection({ themes }) {
  const remaining = themes.slice(2)
  return <div className="destination-theme-pills">{themes.slice(0, 2).map((theme) => <span key={theme.key}><ThemeIcon themeKey={theme.key} size={13} />{theme.label}</span>)}{remaining.length > 0 && <details className="destination-theme-more"><summary>+{remaining.length} more</summary><div>{remaining.map((theme) => <span key={theme.key}><ThemeIcon themeKey={theme.key} size={13} />{theme.label}</span>)}</div></details>}</div>
}

function DestinationActions({ destination, onDeactivate, onReactivate }) {
  return <div className="destination-row-actions"><Link to={`/management/destinations/${destination.id}`}>View</Link>{destination.status === DESTINATION_STATUS.DRAFT && <Link to={`/management/destinations/${destination.id}/edit`}>Continue Setup</Link>}{destination.status === DESTINATION_STATUS.READY_FOR_REVIEW && <Link to={`/management/destinations/${destination.id}`}>Review</Link>}{[DESTINATION_STATUS.ACTIVE, DESTINATION_STATUS.INACTIVE].includes(destination.status) && <Link to={`/management/destinations/${destination.id}/edit`}>Edit</Link>}{destination.status === DESTINATION_STATUS.ACTIVE && <button type="button" onClick={onDeactivate}>Deactivate</button>}{destination.status === DESTINATION_STATUS.INACTIVE && <button type="button" onClick={onReactivate}>Reactivate</button>}</div>
}

export default function ManageDestinations() {
  const { destinations, reactivateDestination, deactivateDestination } = useDestinations()
  const { hotels } = useHotels()
  const [filters, setFilters] = useState({ search: '', status: '', theme: '', hasHotels: '', sort: 'updated' })
  const [target, setTarget] = useState(null)
  const counts = useMemo(() => new Map(destinations.map((item) => [String(item.id), getHotelsForDestination(hotels, item.id).length])), [destinations, hotels])
  const filtered = useMemo(() => destinations.filter((item) => {
    const query = filters.search.trim().toLowerCase(); const themes = getDestinationThemes(item); const count = counts.get(String(item.id)) || 0
    return (!query || [item.name, item.region, item.district, ...themes.map((theme) => theme.label)].some((value) => value?.toLowerCase().includes(query))) && (!filters.status || item.status === filters.status) && (!filters.theme || item.themeKeys.includes(filters.theme)) && (!filters.hasHotels || (filters.hasHotels === 'yes' ? count > 0 : count === 0))
  }).sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name) : filters.sort === 'hotels' ? (counts.get(String(b.id)) || 0) - (counts.get(String(a.id)) || 0) : new Date(b.lastUpdatedAt || b.updatedAt || 0) - new Date(a.lastUpdatedAt || a.updatedAt || 0)), [destinations, filters, counts])
  const clear = () => setFilters({ search: '', status: '', theme: '', hasHotels: '', sort: 'updated' })
  const hasFilters = Object.entries(filters).some(([key, value]) => value && !(key === 'sort' && value === 'updated'))
  const options = { status: [{ value: '', label: 'All statuses' }, { value: 'ACTIVE', label: 'Active' }, { value: 'READY_FOR_REVIEW', label: 'Ready for Review' }, { value: 'DRAFT', label: 'Draft' }, { value: 'INACTIVE', label: 'Inactive' }], theme: [{ value: '', label: 'All Travel Themes' }, ...DESTINATION_THEMES.map((theme) => ({ value: theme.key, label: theme.label }))], hotels: [{ value: '', label: 'Any hotel count' }, { value: 'yes', label: 'Has Hotels' }, { value: 'no', label: 'No Hotels' }], sort: [{ value: 'updated', label: 'Recently Updated' }, { value: 'name', label: 'Name A–Z' }, { value: 'hotels', label: 'Hotels Count' }] }
  const summary = [['Total Destinations', destinations.length, MapPinned], ['Active Destinations', destinations.filter((item) => item.status === DESTINATION_STATUS.ACTIVE).length, CircleCheck], ['Ready for Review', destinations.filter((item) => item.status === DESTINATION_STATUS.READY_FOR_REVIEW).length, Power], ['Hotels Across Destinations', hotels.filter((hotel) => counts.has(String(hotel.destinationId))).length, Building2]]
  const renderActions = (destination) => <DestinationActions destination={destination} onDeactivate={() => setTarget(destination)} onReactivate={() => reactivateDestination(destination.id)} />

  return <section className="manage-destinations-page"><header><div><span>Destination management</span><h1>Destinations</h1><p>Manage LankaStay destinations, local attractions and the locations available for hotel properties.</p></div><Link to="/management/destinations/new"><Plus size={19} />Add Destination</Link></header><div className="destination-summary-grid">{summary.map(([label, value, Icon]) => <article key={label}><span><Icon size={22} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
    <div className="destination-list-filters"><label className="destination-search"><span>Search</span><div><Search size={17} /><input value={filters.search} placeholder="Name, region or Travel Theme" onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div></label><ManagementSelect label="Status" value={filters.status} options={options.status} onChange={(value) => setFilters({ ...filters, status: value })} /><ManagementSelect label="Travel Theme" value={filters.theme} options={options.theme} onChange={(value) => setFilters({ ...filters, theme: value })} /><ManagementSelect label="Hotel Use" value={filters.hasHotels} options={options.hotels} onChange={(value) => setFilters({ ...filters, hasHotels: value })} /><ManagementSelect label="Sort" value={filters.sort} options={options.sort} onChange={(value) => setFilters({ ...filters, sort: value })} /><button type="button" disabled={!hasFilters} onClick={clear}><FilterX size={16} />Clear Filters</button></div>
    <article className="destination-table-card"><div className="destination-table-scroll"><table><thead><tr><th>Destination</th><th>Travel Themes</th><th>Hotels</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map((destination) => { const themes = getDestinationThemes(destination); const count = counts.get(String(destination.id)) || 0; const submitted = destination.status === DESTINATION_STATUS.READY_FOR_REVIEW && destination.submittedAt; return <tr key={destination.id}><td><div className="destination-table-name"><DestinationImage destination={destination} /><div><strong>{destination.name}</strong><small>{destination.region}{destination.district ? ` · ${destination.district} District` : ''}</small></div></div></td><td><ThemeProjection themes={themes} /></td><td><strong>{count}</strong> {count === 1 ? 'Hotel' : 'Hotels'}</td><td><span className={`destination-status-badge destination-status-badge--${destination.status.toLowerCase()}`}>{destination.status.replaceAll('_', ' ')}</span></td><td><span className="destination-updated"><strong>{relativeDate(submitted || destination.lastUpdatedAt || destination.updatedAt, Boolean(submitted))}</strong><small>{destination.lastUpdatedSection || 'Destination record'}</small></span></td><td>{renderActions(destination)}</td></tr> })}</tbody></table></div>
      <div className="destination-mobile-list">{filtered.map((destination) => { const themes = getDestinationThemes(destination); const count = counts.get(String(destination.id)) || 0; return <article key={destination.id}><DestinationImage destination={destination} /><div className="mobile-destination-copy"><div><h2>{destination.name}</h2><span className={`destination-status-badge destination-status-badge--${destination.status.toLowerCase()}`}>{destination.status.replaceAll('_', ' ')}</span></div><p>{destination.region}{destination.district ? ` · ${destination.district} District` : ''}</p><ThemeProjection themes={themes} /><small><Building2 size={14} />{count} {count === 1 ? 'Hotel' : 'Hotels'} · {relativeDate(destination.lastUpdatedAt || destination.updatedAt)}</small><nav>{renderActions(destination)}</nav></div></article> })}</div>{!filtered.length && <div className="destination-list-empty"><MapPinned size={25} /><p>No destinations match these filters.</p>{hasFilters && <button type="button" onClick={clear}>Clear Filters</button>}</div>}
    </article><DestinationStatusModal destination={target} hotelCount={target ? counts.get(String(target.id)) : 0} onCancel={() => setTarget(null)} onConfirm={() => { deactivateDestination(target.id); setTarget(null) }} /></section>
}
