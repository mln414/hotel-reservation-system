import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import useHotels from '../../context/useHotels.js'
import './ManagementHotelSelectorModule.css'

function ManagementHotelSelectorModule({ title, description }) {
  const { hotels } = useHotels()
  const [searchParams] = useSearchParams()
  const [selectedHotelId, setSelectedHotelId] = useState(searchParams.get('hotelId') || '')

  return <section className="management-selector-module"><header><span>Shared property relationship</span><h1>{title}</h1><p>{description}</p></header><article><div><span><Building2 aria-hidden="true" size={22} /></span><div><h2>Select Hotel</h2><p>All management hotel records are available here, including properties that are still pending setup or inactive.</p></div></div><label htmlFor={`${title.replaceAll(' ','-').toLowerCase()}-hotel`}><span>Hotel</span><select id={`${title.replaceAll(' ','-').toLowerCase()}-hotel`} value={selectedHotelId} onChange={(event) => setSelectedHotelId(event.target.value)}><option value="">Select a hotel</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} · {hotel.setupStatus === 'SETUP_PENDING' ? 'Pending Setup' : hotel.publicationStatus}</option>)}</select></label>{selectedHotelId && <p className="management-selector-ready" role="status">Selected property relationship is ready for this frontend session. Module CRUD will be connected in the next implementation.</p>}</article></section>
}

export default ManagementHotelSelectorModule
