import { Gift, Star } from 'lucide-react'
import { useState } from 'react'
import { getFacilityIcon } from '../../utils/facilityIcons.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import './HotelFilters.css'

const formatPrice = formatRateAmount
const optionId = (group, value) => `${group}-${String(value).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`

function CheckOption({ checked, count, group, icon: Icon, label, value, onToggle }) {
  const id = optionId(group, value)
  return <label className="hotel-filter-option" htmlFor={id}><input id={id} className="hotel-filter-checkbox" type="checkbox" checked={checked} onChange={() => onToggle(value)} />{Icon && <Icon aria-hidden="true" size={16} />}<span className="hotel-filter-label">{label}</span>{Number.isFinite(count) && <small>{count}</small>}</label>
}

export default function HotelFilters({ filters, options, priceBounds, priceValues = [], resultCount, activeCount, onChange, onReset, onClose }) {
  const [showAllFacilities, setShowAllFacilities] = useState(false)
  const toggle = (key, value) => onChange({ [key]: filters[key].some((item) => String(item) === String(value)) ? filters[key].filter((item) => String(item) !== String(value)) : [...filters[key], value] })
  const minimum = priceBounds.minimum
  const maximum = priceBounds.maximum
  const range = Math.max(1, maximum - minimum)
  const histogram = Array.from({ length: 12 }, (_, index) => {
    const start = minimum + range / 12 * index; const end = minimum + range / 12 * (index + 1)
    return priceValues.filter((value) => value >= start && (index === 11 ? value <= end : value < end)).length
  })
  const maxBin = Math.max(1, ...histogram)
  const visibleFacilities = showAllFacilities ? options.facilities : options.facilities.slice(0, 6)
  return <div className="hotel-filters">
    <div className="hotel-filters-header"><div><span>Refine your stay</span><h2 className="hotel-filters-title">Filters</h2></div><button className="hotel-filters-clear" type="button" disabled={!activeCount} onClick={onReset}>Reset Filters</button></div>
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Destination</legend><div className="hotel-filter-options"><CheckOption group="destination" label="All Destinations" value="ALL" checked={!filters.destinationIds.length} onToggle={() => onChange({ destinationIds: [] })} />{options.destinations.map((item) => <CheckOption key={item.id} group="destination" label={item.name} value={String(item.id)} count={item.count} checked={filters.destinationIds.includes(String(item.id))} onToggle={(value) => toggle('destinationIds', value)} />)}</div></fieldset>
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Stay Collection</legend><div className="hotel-filter-options">{options.collections.map((item) => <CheckOption key={item.id} group="collection" label={item.title} value={String(item.id)} count={item.count} checked={filters.collectionIds.includes(String(item.id))} onToggle={(value) => toggle('collectionIds', value)} />)}</div></fieldset>
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Property Type</legend><div className="hotel-filter-options">{options.propertyTypes.map((item) => <CheckOption key={item.value} group="property" label={item.value} value={item.value} count={item.count} checked={filters.propertyTypes.includes(item.value)} onToggle={(value) => toggle('propertyTypes', value)} />)}</div></fieldset>
    {maximum > minimum && <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Price per Night</legend><p className="hotel-selected-price"><strong>{formatPrice(filters.minimumPrice)}</strong><span>–</span><strong>{formatPrice(filters.maximumPrice)}</strong></p><div className="hotel-price-histogram" aria-hidden="true">{histogram.map((count, index) => <span key={index} className="hotel-price-bar" style={{ height: `${20 + count / maxBin * 80}%` }} />)}</div><div className="hotel-dual-range"><div className="hotel-price-track" aria-hidden="true"><span className="hotel-price-track-selected" style={{ left: `${(filters.minimumPrice - minimum) / range * 100}%`, width: `${(filters.maximumPrice - filters.minimumPrice) / range * 100}%` }} /></div><input className="hotel-price-slider hotel-price-slider--minimum" aria-label="Minimum price per night" type="range" min={minimum} max={maximum} step="1000" value={filters.minimumPrice} onChange={(event) => onChange({ minimumPrice: Math.min(Number(event.target.value), filters.maximumPrice) })} /><input className="hotel-price-slider hotel-price-slider--maximum" aria-label="Maximum price per night" type="range" min={minimum} max={maximum} step="1000" value={filters.maximumPrice} onChange={(event) => onChange({ maximumPrice: Math.max(Number(event.target.value), filters.minimumPrice) })} /></div><div className="hotel-price-limits"><span>{formatPrice(minimum)}</span><span>{formatPrice(maximum)}</span></div></fieldset>}
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Guest Rating</legend><div className="hotel-filter-options hotel-rating-options">{[{ value: '', label: 'Any Rating' }, { value: '4.5', label: '4.5 & above' }, { value: '4', label: '4.0 & above' }, { value: '3.5', label: '3.5 & above' }].map((item) => { const id = optionId('rating', item.value || 'any'); return <label className="hotel-filter-option" htmlFor={id} key={item.value}><input id={id} className="hotel-filter-radio" type="radio" name="hotel-guest-rating" checked={filters.rating === item.value} onChange={() => onChange({ rating: item.value })} />{item.value && <Star aria-hidden="true" size={15} />}<span>{item.label}</span></label> })}</div></fieldset>
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Facilities</legend><div className="hotel-filter-options">{visibleFacilities.map((item) => <CheckOption key={item.id} group="facility" icon={() => { const Icon = getFacilityIcon(item.iconKey); return <Icon aria-hidden="true" size={16} /> }} label={item.name} value={String(item.id)} count={item.count} checked={filters.facilityIds.includes(String(item.id))} onToggle={(value) => toggle('facilityIds', value)} />)}</div>{options.facilities.length > 6 && <button className="hotel-filter-show-more" aria-expanded={showAllFacilities} type="button" onClick={() => setShowAllFacilities((current) => !current)}>{showAllFacilities ? 'Show Less' : `Show More (${options.facilities.length - 6})`}</button>}</fieldset>
    <fieldset className="hotel-filter-group"><legend className="hotel-filter-heading">Offers / Special Deals</legend><div className="hotel-filter-options"><CheckOption group="offer" icon={Gift} label="Offers Available" value="offers" checked={filters.offersOnly} onToggle={() => onChange({ offersOnly: !filters.offersOnly })} /></div></fieldset>
    {onClose && <button className="hotel-filter-show-results" type="button" onClick={onClose}>Show {resultCount} {resultCount === 1 ? 'Hotel' : 'Hotels'}</button>}
  </div>
}
