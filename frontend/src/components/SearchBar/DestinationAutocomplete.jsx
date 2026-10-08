import { useEffect, useRef, useState } from 'react'
import { Building2, MapPin } from 'lucide-react'
import useDestinations from '../../context/useDestinations.js'
import useHotels from '../../context/useHotels.js'

export default function DestinationAutocomplete({ value = '', onChange }) {
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const { activeDestinations } = useDestinations()
  const { publicHotels } = useHotels()
  const [inputValue, setInputValue] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  useEffect(() => setInputValue(value), [value])
  useEffect(() => { const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close) }, [])
  const query = inputValue.trim().toLowerCase()
  const suggestions = [
    ...activeDestinations.filter((item) => !query || item.name.toLowerCase().includes(query)).map((item) => ({ id: `destination-${item.id}`, type: 'destination', name: item.name, destinationName: item.name })),
    ...publicHotels.filter((hotel) => { const destination = activeDestinations.find((item) => String(item.id) === String(hotel.destinationId)); return !query || `${hotel.name} ${destination?.name || ''}`.toLowerCase().includes(query) }).map((hotel) => ({ id: `hotel-${hotel.id}`, type: 'hotel', name: hotel.name, destinationName: activeDestinations.find((item) => String(item.id) === String(hotel.destinationId))?.name || 'Sri Lanka' })),
  ]
  const select = (item) => { setInputValue(item.name); onChange?.(item.name); setOpen(false); setActiveIndex(-1) }
  const keyDown = (event) => {
    if (event.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActiveIndex((current) => event.key === 'ArrowDown' ? (current + 1) % Math.max(1, suggestions.length) : (current - 1 + Math.max(1, suggestions.length)) % Math.max(1, suggestions.length)) }
    if (event.key === 'Enter' && open && suggestions[activeIndex]) { event.preventDefault(); select(suggestions[activeIndex]) }
  }
  useEffect(() => { listRef.current?.querySelector(`[data-suggestion-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' }) }, [activeIndex])
  return <div className="destination-autocomplete" ref={rootRef}><div className="search-control"><span className="location-pin" aria-hidden="true" /><input id="destination" name="destination" type="text" role="combobox" autoComplete="off" placeholder="Where do you want to go?" value={inputValue} aria-autocomplete="list" aria-expanded={open} aria-controls="destination-suggestions" aria-activedescendant={open && activeIndex >= 0 ? suggestions[activeIndex]?.id : undefined} onChange={(event) => { setInputValue(event.target.value); onChange?.(event.target.value); setOpen(true); setActiveIndex(-1) }} onFocus={() => setOpen(true)} onKeyDown={keyDown} /></div>{open && <div id="destination-suggestions" className="destination-suggestions" role="listbox" aria-label="Destinations and hotels" ref={listRef}>{suggestions.length ? suggestions.map((item, index) => <button id={item.id} key={item.id} type="button" role="option" className={`suggestion-item suggestion-item--${item.type} ${index === activeIndex ? 'suggestion-item--active' : ''}`} aria-selected={index === activeIndex} data-suggestion-index={index} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item)}><span className={`suggestion-icon-container suggestion-icon-container--${item.type}`} aria-hidden="true">{item.type === 'destination' ? <MapPin size={20} /> : <Building2 size={20} />}</span><span className="suggestion-copy"><span className="suggestion-name">{item.name}</span><span className="suggestion-meta">{item.type === 'hotel' ? `${item.destinationName}, Sri Lanka` : 'Destination'}</span></span></button>) : <p className="suggestion-empty" role="status">No public destination or Hotel found</p>}</div>}</div>
}
