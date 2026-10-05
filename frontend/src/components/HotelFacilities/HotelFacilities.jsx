import { useState } from 'react'
import { getFacilityIcon } from '../../utils/facilityIcons.js'
import './HotelFacilities.css'

const visibleFacilityLimit = 8

export default function HotelFacilities({ facilities }) {
  const [showAll, setShowAll] = useState(false)
  const availableFacilities = Array.isArray(facilities) ? facilities : []
  if (!availableFacilities.length) return null
  const visibleFacilities = showAll ? availableFacilities : availableFacilities.slice(0, visibleFacilityLimit)
  return <section className="hotel-facilities-section" id="facilities" aria-labelledby="hotel-facilities-title"><div className="hotel-facilities-heading"><span aria-hidden="true">6</span><div><h2 id="hotel-facilities-title">Top Facilities</h2><p>Enjoy a range of facilities and services designed for a comfortable stay.</p></div></div>{availableFacilities.length ? <><ul className="hotel-facilities-grid">{visibleFacilities.map((facility) => { const item = typeof facility === 'string' ? { id: facility, name: facility, iconKey: facility } : facility; const FacilityIcon = getFacilityIcon(item.iconKey || item.name); return <li className="hotel-facility-item" key={item.id || item.name}><span className="hotel-facility-icon" aria-hidden="true"><FacilityIcon size={22} strokeWidth={1.8} /></span><span>{item.name}</span></li> })}</ul>{availableFacilities.length > visibleFacilityLimit && <button className="hotel-facilities-toggle" type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show Less' : 'View All Facilities'}</button>}</> : <p className="hotel-facilities-empty">Facility information is not available for this hotel yet.</p>}</section>
}
