import { MapPin } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { hasCoordinates } from '../../utils/destinationDomain.js'
import './DestinationMap.css'

const LeafletDestinationMap=lazy(()=>import('./LeafletDestinationMap.jsx'))
export default function DestinationMap({destination,className=''}){if(!hasCoordinates(destination))return <div className={`destination-map-fallback ${className}`}><strong>Map location unavailable</strong><span>{destination.region}, Sri Lanka</span></div>;return <Suspense fallback={<div className={`destination-map-fallback ${className}`}><MapPin size={24}/><span>Loading Destination map…</span></div>}><LeafletDestinationMap destination={destination} className={className}/></Suspense>}
