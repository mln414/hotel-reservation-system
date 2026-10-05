import { ArrowLeft, ArrowRight, Check, CheckCircle2, ImagePlus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import StayCollectionSelector from '../../components/StayCollectionSelector/StayCollectionSelector.jsx'
import useHotelDraft from '../../context/useHotelDraft.js'
import useHotels from '../../context/useHotels.js'
import useStayCollections from '../../context/useStayCollections.js'
import { HOTEL_CATEGORIES } from '../../constants/hotelManagement.js'
import { isValidEmail, isValidPhone } from '../../utils/authValidation.js'
import { getCollectionIcon } from '../../utils/collectionIcons.jsx'
import { hotelApi } from '../../services/hotelApi.js'
import './CreateHotel.css'

const steps = ['Hotel Identity', 'Classification & Collections', 'Location & Contact', 'Hotel Media', 'Review & Create Draft']
const selectOption = (value, label = value) => ({ value, label })
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

export default function CreateHotel() {
  const navigate = useNavigate(); const location = useLocation(); const [searchParams] = useSearchParams(); const { hotels, destinations, addHotelDraft } = useHotels(); const { collections } = useStayCollections()
  const { draft, step, dirty, lastSavedAt, hasDraft, updateDraft, setStep, resetDraft } = useHotelDraft()
  const [errors, setErrors] = useState({}); const [showResume, setShowResume] = useState(hasDraft); const [discardOpen, setDiscardOpen] = useState(false); const [createdHotel, setCreatedHotel] = useState(null); const [submitting, setSubmitting] = useState(false)
  const activeDestinations = destinations.filter((item) => item.active)
  useEffect(() => { const requested=searchParams.get('destinationId'); if(requested&&!draft.destinationId&&activeDestinations.some((item)=>String(item.id)===String(requested))) updateDraft({destinationId:String(requested)}) }, [searchParams, draft.destinationId, activeDestinations, updateDraft])
  const update = (field, value) => { updateDraft({ [field]: value }); setErrors((current) => ({ ...current, [field]: '' })) }
  const validateStep = (number) => {
    const next = {}
    if (number === 1) { if (!draft.name.trim()) next.name = 'Hotel Name is required.'; if (!draft.propertyType) next.propertyType = 'Select a Property Type.'; if (!draft.shortDescription.trim()) next.shortDescription = 'Short Description is required.'; else if (draft.shortDescription.length > 240) next.shortDescription = 'Use 240 characters or fewer.'; if (draft.name.trim() && hotels.some((hotel) => hotel.name.trim().toLowerCase() === draft.name.trim().toLowerCase())) next.name = 'A Hotel with this name already exists. Use a distinct name.' }
    if (number === 3) { if (!draft.destinationId) next.destinationId = 'Select an active Destination.'; if (draft.email && !isValidEmail(draft.email)) next.email = 'Enter a valid contact email.'; if (draft.phone && !isValidPhone(draft.phone)) next.phone = 'Enter a valid Sri Lanka-friendly phone number.' }
    if (number === 4 && !draft.mainImage) next.mainImage = 'Main / Cover Photo is required before creating the Hotel draft.'
    setErrors(next); return !Object.keys(next).length
  }
  const next = () => { if (validateStep(step)) setStep(step + 1) }
  const selectImages = async (files, multiple = false) => {
    const valid = [...files].filter((file) => acceptedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024)
    if (valid.length !== files.length) setErrors((current) => ({ ...current, mainImage: 'Use JPG, PNG or WebP images no larger than 5 MB.' }))
    if (!valid.length) return []
    try {
      const responses = await Promise.all(valid.slice(0, multiple ? valid.length : 1).map((file) => hotelApi.uploadImage(file)))
      return responses.map((response) => response.url).filter(Boolean)
    } catch (error) {
      setErrors((current) => ({ ...current, mainImage: error.message || 'Unable to upload the Hotel image.' }))
      return []
    }
  }
  const create = async () => {
    if (![1, 3, 4].every(validateStep)) return
    setSubmitting(true)
    setErrors((current) => ({ ...current, submit: '' }))
    try {
      const hotel = await addHotelDraft({ ...draft, destinationId: Number(draft.destinationId), name: draft.name.trim(), shortDescription: draft.shortDescription.trim(), email: draft.email.trim(), phone: draft.phone.trim(), mainImage: draft.mainImage, image: draft.mainImage })
      resetDraft()
      if (location.state?.returnTo) navigate(location.state.returnTo, { state: { roomDraft: location.state.roomDraft, createdHotelId: hotel.id } })
      else setCreatedHotel(hotel)
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error.message || 'Unable to create the Hotel. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }
  if (createdHotel) return <section className="create-hotel-page"><div className="hotel-created-success"><span><CheckCircle2 size={32} /></span><p>Hotel Draft Created</p><h1>{createdHotel.name}</h1><p>The property is Setup In Progress and hidden from customer discovery until all publishing requirements are complete.</p><div><Link className="primary" to={`/management/hotels/${createdHotel.id}/setup`} state={{ created: true }}>Continue Setup</Link><Link to={`/management/hotels/${createdHotel.id}/preview`}>View Hotel Record</Link><Link to="/management/hotels">Back to Hotels</Link></div></div></section>
  if (showResume) return <section className="create-hotel-page"><Link className="create-hotel-back" to="/management/hotels"><ArrowLeft size={16} />Back to Hotels</Link><div className="hotel-draft-resume"><span><Save size={25} /></span><p>Session draft found</p><h1>You have an unfinished Hotel draft.</h1><p>Continue from Step {step} or start a clean draft. This draft exists only while the current application session remains open.</p><div><button className="primary" type="button" onClick={() => setShowResume(false)}>Continue Draft</button><button type="button" onClick={() => { resetDraft(); setShowResume(false) }}>Start New</button><button className="danger" type="button" onClick={() => setDiscardOpen(true)}><Trash2 size={15} />Discard Draft</button></div></div>{discardOpen && <ManagementDialog danger title="Discard unfinished Hotel draft?" description="All fields, collection selections and temporary media previews in this session draft will be cleared." onClose={() => setDiscardOpen(false)} actions={<><button type="button" onClick={() => setDiscardOpen(false)}>Keep Draft</button><button className="primary" type="button" onClick={() => { resetDraft(); setDiscardOpen(false); setShowResume(false) }}>Discard Draft</button></>} />}</section>
  return <section className="create-hotel-page"><Link className="create-hotel-back" to="/management/hotels"><ArrowLeft size={16} />Back to Hotels</Link><header><span>Hotel setup wizard</span><h1>Add Hotel</h1><p>Create a safe unpublished Hotel draft, then continue through the full property workspace.</p></header><div className="hotel-draft-status" role="status"><span>{dirty ? 'Saving…' : lastSavedAt ? 'Saved in this session' : 'New session draft'}</span>{lastSavedAt && <small>{new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}</div><nav className="hotel-stepper" aria-label="Add Hotel progress">{steps.map((label, index) => <button type="button" key={label} className={`${step === index + 1 ? 'active' : ''}${step > index + 1 ? ' complete' : ''}`} onClick={() => { if (index + 1 < step) setStep(index + 1) }}><span>{step > index + 1 ? <Check size={15} /> : index + 1}</span><strong>{label}</strong></button>)}</nav><div className="hotel-step-progress"><span>Step {step} of 5</span><progress max="5" value={step}>{step} of 5</progress></div>
    <form className="create-hotel-form" onSubmit={(event) => { event.preventDefault(); if (step < 5) next(); else create() }} noValidate>
      {step === 1 && <section className="hotel-form-section"><div className="hotel-step-heading"><span>Step 1</span><h2>Hotel Identity</h2><p>Define the public-facing name and factual property classification.</p></div><div className="hotel-form-grid"><Field label="Hotel Name *" error={errors.name}><input value={draft.name} aria-invalid={Boolean(errors.name)} onChange={(event) => update('name', event.target.value)} /></Field><ManagementSelect label="Property Type" required value={draft.propertyType} options={[selectOption('', 'Select Property Type'), ...HOTEL_CATEGORIES.map((item) => selectOption(item))]} onChange={(value) => update('propertyType', value)} error={errors.propertyType} helper="What kind of property is this?" /><Field wide label={`Short Description * · ${draft.shortDescription.length}/240`} error={errors.shortDescription}><textarea rows="5" maxLength="240" value={draft.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} /><small>This appears on Hotel cards and customer discovery pages.</small></Field></div></section>}
      {step === 2 && <section className="hotel-form-section"><div className="hotel-step-heading"><span>Step 2</span><h2>Classification &amp; Collections</h2><p><strong>Property Type</strong> describes what the property is. <strong>Stay Collections</strong> control where guests discover it on LankaStay.</p></div><div className="hotel-classification-summary"><span>Property Type</span><strong>{draft.propertyType}</strong></div><StayCollectionSelector value={draft.collectionIds} onChange={(value) => update('collectionIds', value)} /></section>}
      {step === 3 && <section className="hotel-form-section"><div className="hotel-step-heading"><span>Step 3</span><h2>Location &amp; Contact</h2><p>Destination powers discovery; address and city identify the specific property location.</p></div><div className="hotel-form-grid"><ManagementSelect searchable label="Destination" required value={String(draft.destinationId)} options={[selectOption('', 'Select Destination'), ...activeDestinations.map((item) => selectOption(String(item.id), item.name))]} onChange={(value) => update('destinationId', value)} error={errors.destinationId} /><Field label="City / Area"><input value={draft.city} onChange={(event) => update('city', event.target.value)} /></Field><Field wide label="Address"><input value={draft.address} onChange={(event) => update('address', event.target.value)} /></Field><Field label="Province"><input value={draft.province} onChange={(event) => update('province', event.target.value)} /></Field><Field label="Postal Code"><input value={draft.postalCode} onChange={(event) => update('postalCode', event.target.value)} /></Field><Field label="Contact Email" error={errors.email}><input type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} /></Field><Field label="Contact Phone" error={errors.phone}><input type="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} /></Field><Field wide label="Website"><input type="url" value={draft.website} onChange={(event) => update('website', event.target.value)} /></Field></div></section>}
      {step === 4 && <section className="hotel-form-section"><div className="hotel-step-heading"><span>Step 4</span><h2>Hotel Media</h2><p>This is Hotel-owned media, not the Homepage Hero.</p></div><div className="hotel-media-create"><div><h3>Main / Cover Photo *</h3><p>This primary image represents this Hotel across LankaStay.</p><label className="hotel-main-upload"><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={async (event) => { const images = await selectImages(event.target.files || []); if (images[0]) update('mainImage', images[0]) }} />{draft.mainImage ? <img src={draft.mainImage} alt="Hotel Main preview" /> : <span><ImagePlus size={30} /><strong>Choose Main / Cover Photo</strong><small>High-quality landscape JPG, PNG or WebP · max 5 MB</small></span>}<em>{draft.mainImage ? 'Change Photo' : 'Select Photo'}</em></label>{errors.mainImage && <small className="hotel-form-error" role="alert">{errors.mainImage}</small>}</div><div><h3>Initial Gallery Photos <small>Optional</small></h3><p>These appear in the Hotel Details slideshow and gallery.</p><label className="hotel-gallery-upload"><input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={async (event) => { const images = await selectImages(event.target.files || [], true); if (images.length) update('gallery', [...new Set([...draft.gallery, ...images])]) }} /><ImagePlus size={19} />Add Gallery Photos</label><div className="hotel-create-gallery">{draft.gallery.map((image, index) => <figure key={image}><img src={image} alt={`Hotel Gallery preview ${index + 1}`} /><button type="button" aria-label={`Remove Gallery Photo ${index + 1}`} onClick={() => update('gallery', draft.gallery.filter((item) => item !== image))}><X size={14} /></button></figure>)}</div></div></div></section>}
      {step === 5 && <section className="hotel-form-section"><div className="hotel-step-heading"><span>Step 5</span><h2>Review &amp; Create Draft</h2><p>Review the initial property record. It will remain unpublished and continue to the Hotel Workspace.</p></div><div className="hotel-review-card"><img src={draft.mainImage} alt={`${draft.name} Main preview`} /><dl><div><dt>Hotel Name</dt><dd>{draft.name}</dd></div><div><dt>Property Type</dt><dd>{draft.propertyType}</dd></div><div><dt>Destination</dt><dd>{activeDestinations.find((item) => String(item.id) === String(draft.destinationId))?.name}</dd></div><div><dt>Stay Collections</dt><dd>{draft.collectionIds.length ? draft.collectionIds.map((id) => { const item = collections.find((entry) => String(entry.id) === String(id)); if (!item) return null; const Icon = getCollectionIcon(item.iconKey); return <span key={id}><Icon size={13} />{item.title}</span> }).filter(Boolean) : 'None selected'}</dd></div><div><dt>Contact</dt><dd>{[draft.email, draft.phone].filter(Boolean).join(' · ') || 'Not supplied'}</dd></div><div><dt>Publication</dt><dd><strong>Setup In Progress · Hidden</strong></dd></div></dl></div></section>}
      {errors.submit && <p className="hotel-form-error" role="alert">{errors.submit}</p>}
      <div className="create-hotel-actions"><button type="button" disabled={step === 1 || submitting} onClick={() => setStep(step - 1)}><ArrowLeft size={16} />Back</button><div><Link to="/management/hotels">Cancel</Link><button className="primary" type="submit" disabled={submitting}>{step === 5 ? <><Save size={17} />{submitting ? 'Creating Hotel...' : 'Create Hotel Draft'}</> : <>Next<ArrowRight size={17} /></>}</button></div></div>
    </form>
  </section>
}

function Field({ label, error, wide = false, children }) { return <label className={wide ? 'hotel-form-wide' : ''}><span>{label}</span>{children}{error && <small className="hotel-form-error" role="alert">{error}</small>}</label> }
