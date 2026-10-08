import { Save, Undo2 } from 'lucide-react'
import { useState } from 'react'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import StayCollectionSelector from '../../components/StayCollectionSelector/StayCollectionSelector.jsx'
import useHotels from '../../context/useHotels.js'
import { HOTEL_CATEGORIES } from '../../constants/hotelManagement.js'
import { isValidEmail, isValidPhone } from '../../utils/authValidation.js'
import './HotelBasicInformation.css'

const option = (value, label = value) => ({ value, label })

export default function HotelBasicInformation({ hotel, onContinue }) {
  const { destinations, updateHotel, workspaceDrafts, updateHotelWorkspaceDraft, clearHotelWorkspaceDraft } = useHotels()
  const stored = workspaceDrafts[String(hotel.id)]
  const initial = { name: hotel.name, propertyType: hotel.propertyType || hotel.category, shortDescription: hotel.shortDescription || '', collectionIds: hotel.collectionIds || [], destinationId: String(hotel.destinationId || ''), address: hotel.address || '', city: hotel.city || '', province: hotel.province || '', postalCode: hotel.postalCode || '', email: hotel.email || '', phone: hotel.phone || '', website: hotel.website || '' }
  const form = { ...initial, ...(stored || {}) }
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const change = (field, value) => { updateHotelWorkspaceDraft(hotel.id, { [field]: value }); setErrors((current) => ({ ...current, [field]: '' })); setMessage('') }
  const save = async (event, continueAfterSave = false) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Hotel Name is required.'
    if (!form.propertyType) next.propertyType = 'Select a Property Type.'
    if (!form.shortDescription.trim()) next.shortDescription = 'Short Description is required.'
    if (!form.destinationId) next.destinationId = 'Select an active Destination.'
    if (form.email && !isValidEmail(form.email)) next.email = 'Enter a valid email.'
    if (form.phone && !isValidPhone(form.phone)) next.phone = 'Enter a valid phone number.'
    setErrors(next)
    if (Object.keys(next).length) return
    const destination = destinations.find((item) => String(item.id) === String(form.destinationId))
    try {
      await updateHotel(hotel.id, { ...form, destinationId: Number(form.destinationId), destination: destination?.name, collectionIds: form.collectionIds, lastUpdatedSection: 'Basic Info' })
      clearHotelWorkspaceDraft(hotel.id)
      setMessage('Hotel Basic Information saved.')
      if (continueAfterSave) onContinue?.('about')
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error.message || 'Unable to save Hotel information.' }))
    }
  }
  const Error = ({ name }) => errors[name] ? <small className="basic-info-error" role="alert">{errors[name]}</small> : null
  return <div className="hotel-basic-information"><div className="basic-info-status"><span>{stored?.dirty ? 'Unsaved Changes' : message || 'All displayed values are saved'}</span>{stored?.updatedAt && <small>Session draft updated {new Date(stored.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}</div><form onSubmit={save} noValidate><section><div className="basic-info-heading"><span>Public property record</span><h2>Hotel Identity</h2><p>These details identify the Hotel across management and customer pages.</p></div><div className="basic-info-grid"><label><span>Hotel Name *</span><input value={form.name} onChange={(event) => change('name', event.target.value)} /><Error name="name" /></label><ManagementSelect label="Property Type" required value={form.propertyType} options={[option('', 'Select Property Type'), ...HOTEL_CATEGORIES.map((item) => option(item))]} onChange={(value) => change('propertyType', value)} error={errors.propertyType} helper="What kind of property is this?" /><label className="wide"><span>Short Description *</span><textarea rows="4" value={form.shortDescription} onChange={(event) => change('shortDescription', event.target.value)} /><small>This summary appears on customer Hotel cards.</small><Error name="shortDescription" /></label></div></section><section><div className="basic-info-heading"><span>Guest discovery</span><h2>Stay Collections</h2><p>Choose every Browse Collection where guests should discover this Hotel. Property Type remains independent.</p></div><StayCollectionSelector includeInactive value={form.collectionIds} onChange={(value) => change('collectionIds', value)} /></section><section><div className="basic-info-heading"><span>Property contact</span><h2>Contact Information</h2><p>Location coordinates are managed in the dedicated Property Location card below.</p></div><div className="basic-info-grid"><label><span>Contact Email</span><input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} /><Error name="email" /></label><label><span>Contact Phone</span><input type="tel" value={form.phone} onChange={(event) => change('phone', event.target.value)} /><Error name="phone" /></label><label className="wide"><span>Website</span><input type="url" value={form.website} onChange={(event) => change('website', event.target.value)} /></label></div></section>{errors.submit && <p className="basic-info-error" role="alert">{errors.submit}</p>}<div className="basic-info-actions"><button type="button" disabled={!stored?.dirty} onClick={() => { clearHotelWorkspaceDraft(hotel.id); setErrors({}); setMessage('Unsaved changes cancelled.') }}><Undo2 size={15} />Cancel Changes</button><button className="primary" type="submit"><Save size={16} />Save Changes</button></div></form></div>
}
