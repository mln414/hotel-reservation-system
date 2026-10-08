import { LayoutGrid, List } from 'lucide-react'
import CustomerSelect from '../CustomerSelect/CustomerSelect.jsx'
import './HotelResultsHeader.css'

const sortOptions = [
  { value: 'recommended', label: 'Recommended', description: 'Featured, reviews, offers and price' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'highest-rated', label: 'Guest Rating' },
  { value: 'most-reviewed', label: 'Most Reviewed' },
  { value: 'name', label: 'Name A–Z' },
]

export default function HotelResultsHeader({ totalHotels, sortBy, viewMode, onSortChange, onViewChange }) {
  return <div className="hotel-results-header"><p className="hotel-results-summary" aria-live="polite"><strong>{totalHotels}</strong> {totalHotels === 1 ? 'hotel' : 'hotels'} found</p><div className="hotel-results-controls"><CustomerSelect label="Sort by" value={sortBy} options={sortOptions} onChange={onSortChange} /><div className="hotel-view-toggle" aria-label="Hotel results view"><button aria-label="Grid view" aria-pressed={viewMode === 'grid'} className={`hotel-view-button${viewMode === 'grid' ? ' hotel-view-button--active' : ''}`} type="button" onClick={() => onViewChange('grid')}><LayoutGrid aria-hidden="true" size={19} /></button><button aria-label="List view" aria-pressed={viewMode === 'list'} className={`hotel-view-button${viewMode === 'list' ? ' hotel-view-button--active' : ''}`} type="button" onClick={() => onViewChange('list')}><List aria-hidden="true" size={20} /></button></div></div></div>
}
