import { ExternalLink, ImagePlus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { findAttractionPlace } from '../../services/nearbyPlacesService.js'
import { ATTRACTION_TYPES, hasCoordinates, isDuplicateAttraction, normalizeAttraction } from '../../utils/destinationDomain.js'
import ManagementDialog from '../ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../ManagementSelect/ManagementSelect.jsx'
import MapLocationPicker from '../MapLocationPicker/MapLocationPicker.jsx'
import './AttractionEditor.css'

export default function AttractionEditor({ attraction, destination, attractions, onSave, onClose }) {
  const [form, setForm] = useState(() => normalizeAttraction(attraction || { latitude: destination.latitude, longitude: destination.longitude, status: 'ACTIVE' }, attractions.length))
  const [errors, setErrors] = useState({}); const [lookupState, setLookupState] = useState('idle'); const [lookupMessage, setLookupMessage] = useState('')
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const save = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Attraction name is required.'
    if (!form.type) next.type = 'Attraction type is required.'
    if (!hasCoordinates(form)) next.location = 'Choose the attraction location on the map.'
    if (isDuplicateAttraction(attractions, form, attraction?.id)) next.name = `${form.name || 'This attraction'} is already in Added Attractions.`
    setErrors(next); if (Object.keys(next).length) return
    onSave({ ...form, name: form.name.trim(), shortDescription: form.shortDescription.trim(), id: attraction?.id || form.id || `attraction-${Date.now()}` })
  }
  const chooseImage = (event) => {
    const file = event.target.files?.[0]; if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setErrors((current) => ({ ...current, image: 'Use a JPG, PNG or WebP image up to 5 MB.' })); return }
    setField('image', URL.createObjectURL(file)); setErrors((current) => ({ ...current, image: '' }))
  }
  const findPlace = async () => {
    if (!form.name.trim()) { setErrors((current) => ({ ...current, name: 'Enter an Attraction Name before finding its location.' })); return }
    setLookupState('loading'); setLookupMessage('Finding this place near the Destination…')
    try {
      const result = await findAttractionPlace({ name: form.name, destination })
      if (!result) { setLookupState('empty'); setLookupMessage("We couldn't locate this place automatically. Select its exact location on the map."); return }
      setForm((current) => ({ ...current, latitude: result.latitude, longitude: result.longitude })); setErrors((current) => ({ ...current, location: '' })); setLookupState('success'); setLookupMessage('Place found. Review and adjust the marker if needed.')
    } catch { setLookupState('empty'); setLookupMessage("We couldn't locate this place automatically. Select its exact location on the map.") }
  }
  return <ManagementDialog title={attraction ? 'Edit Attraction' : 'Add Attraction Manually'} description="Curate a real nearby place and set its exact location visually." onClose={onClose} actions={<><button type="button" onClick={onClose}>Cancel</button><button className="management-dialog-primary" type="button" onClick={save}>{attraction ? 'Save Attraction' : 'Add Attraction'}</button></>}>
    <div className="attraction-destination-context"><span>Nearby to</span><strong>{destination.name || destination.district}</strong><small>{destination.region} · {destination.district} District</small></div>
    <div className="attraction-editor-fields"><label><span>Attraction Name *</span><input autoFocus value={form.name} aria-invalid={Boolean(errors.name)} onChange={(event) => { setField('name', event.target.value); setErrors((current) => ({ ...current, name: '' })) }} />{errors.name && <small role="alert">{errors.name}</small>}</label><div className="attraction-place-lookup"><span>Place lookup</span><button type="button" disabled={lookupState === 'loading'} onClick={findPlace}><Search size={15} />{lookupState === 'loading' ? 'Finding Place…' : 'Find Place'}</button>{lookupMessage && <small role="status" className={`is-${lookupState}`}>{lookupMessage}</small>}</div><ManagementSelect label="Type" required value={form.type} options={ATTRACTION_TYPES.map((type) => ({ value: type.key, label: type.label }))} onChange={(value) => setField('type', value)} error={errors.type} /><label className="attraction-editor-wide"><span>Short Description</span><textarea rows="3" value={form.shortDescription} onChange={(event) => setField('shortDescription', event.target.value)} /></label><label><span>Estimated Travel Time (optional)</span><input placeholder="Manager-configured, e.g. Approx. 15 min by car" value={form.estimatedTravelTime} onChange={(event) => setField('estimatedTravelTime', event.target.value)} /><small>No routing provider is configured; LankaStay does not fabricate travel time.</small></label><ManagementSelect label="Status" value={form.status} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} onChange={(value) => setField('status', value)} /><div className="attraction-editor-image"><span>Optional Image</span><label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><ImagePlus size={18} />{form.image ? 'Replace Image' : 'Choose Image'}</label>{form.image && <><img src={form.image} alt="Attraction preview" /><button type="button" onClick={() => setField('image', '')}><Trash2 size={14} />Remove Image</button></>}{errors.image && <small role="alert">{errors.image}</small>}</div></div>
    <MapLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(location) => { setForm((current) => ({ ...current, ...location })); setErrors((current) => ({ ...current, location: '' })) }} label={form.name || `${destination.name} area`} heading={attraction ? `${form.name || 'Attraction'} location` : 'Attraction location'} error={errors.location} />
    {hasCoordinates(form) && <a className="attraction-google-maps" href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer">View on Google Maps <ExternalLink size={14} /></a>}
  </ManagementDialog>
}
