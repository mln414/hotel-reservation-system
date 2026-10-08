import { MapPin, X } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { hasCoordinates } from '../../utils/destinationDomain.js'
import './MapLocationPicker.css'
import './MapLocationPickerFallback.css'

const LeafletLocationPicker = lazy(() => import('./LeafletLocationPicker.jsx'))
export default function MapLocationPicker({ latitude, longitude, onChange, label = 'Selected location', heading = 'Location', error }) {
  const valid = hasCoordinates({ latitude, longitude })
  return <div className={`map-location-picker${error ? ' has-error' : ''}`}><div className="map-location-picker-copy"><span><MapPin size={18} />{heading}</span><p>Click the map or move the marker to set the exact location. Coordinates are stored internally.</p></div><div className="map-location-picker-map"><Suspense fallback={<div className="map-location-picker-fallback"><MapPin size={24} /><span>Loading interactive map…</span></div>}><LeafletLocationPicker latitude={latitude} longitude={longitude} onChange={onChange} label={label} /></Suspense></div><div className="map-location-picker-readout" aria-live="polite"><strong>{valid ? label : 'No location selected'}</strong><span>{valid ? 'Location pin selected — open Advanced location details to view its coordinates.' : 'Choose a point on the map.'}</span>{valid && <><button type="button" onClick={() => onChange({ latitude: null, longitude: null })}><X size={14} />Clear selected location</button><details><summary>Advanced location details</summary><dl><div><dt>Latitude</dt><dd>{Number(latitude).toFixed(6)}</dd></div><div><dt>Longitude</dt><dd>{Number(longitude).toFixed(6)}</dd></div></dl></details></>}</div>{error && <small className="destination-field-error" role="alert">{error}</small>}</div>
}
