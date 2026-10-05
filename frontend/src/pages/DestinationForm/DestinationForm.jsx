import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, ImagePlus, MapPin, Pencil, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import AttractionEditor from '../../components/AttractionEditor/AttractionEditor.jsx'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import MapLocationPicker from '../../components/MapLocationPicker/MapLocationPicker.jsx'
import useDestinations from '../../context/useDestinations.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import { discoverNearbyPlaces } from '../../services/nearbyPlacesService.js'
import { AttractionIcon, ThemeIcon } from '../../utils/destinationIcons.jsx'
import { ATTRACTION_TYPES, createDestinationSaveMetadata, DESTINATION_STATUS, DESTINATION_THEMES, calculateDistanceKm, formatDistanceKm, getAttractionType, getDestinationResumeStep, getDestinationThemes, getFirstInvalidDestinationStep, getHighestReachableDestinationStep, hasCoordinates, isDuplicateAttraction, normalizeDestination, validateDestinationForReview, validateDestinationStep } from '../../utils/destinationDomain.js'
import { groupNearbyPlacesByCategory } from '../../utils/destinationDiscovery.js'
import { getDistrictCentre, getDistrictsForProvince, SRI_LANKA_PROVINCES } from '../../utils/sriLankaAdministrative.js'
import './DestinationForm.css'
import './DestinationFormFeedback.css'
import './AttractionRefinement.css'

const STEPS = ['Destination Identity', 'Travel Themes', 'Location', 'Media', 'Highlights & Attractions', 'Review & Submit']
const SECTION_NAMES = ['Destination Identity', 'Travel Themes', 'Location', 'Media', 'Highlights & Attractions', 'Review & Submit']
const blank = normalizeDestination({ name: '', shortDescription: '', fullDescription: '', themeKeys: [], region: '', district: '', latitude: null, longitude: null, locationConfirmed: false, mainImage: '', highlights: [], attractions: [], status: DESTINATION_STATUS.DRAFT })
const defaultCategories = ['HERITAGE', 'BEACH', 'NATURE', 'WILDLIFE']

function requestedStep(searchParams) {
  const value = Number(searchParams.get('step'))
  return Number.isInteger(value) && value >= 1 && value <= 6 ? value - 1 : null
}

function initialStepFor(destination, searchParams) {
  const requested = requestedStep(searchParams)
  return getDestinationResumeStep(destination, requested)
}

function DestinationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { notify } = useManagementFeedback()
  const isEditing = Boolean(id)
  const { destinations, getDestinationById, updateDestination, createDraft, updateCreateDraft, clearCreateDraft, editDrafts, updateEditDraft, clearEditDraft, saveDestinationDraft, submitDestinationForReview } = useDestinations()
  const existing = id ? getDestinationById(id) : null
  const initial = useMemo(() => normalizeDestination(isEditing ? (editDrafts[String(id)] || existing || blank) : (createDraft || blank)), [editDrafts, existing, id, isEditing, createDraft])
  const [form, setForm] = useState(initial)
  const [step, setStep] = useState(() => initialStepFor(initial, searchParams))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(Boolean((isEditing && editDrafts[String(id)]) || (!isEditing && createDraft)))
  const [highlightText, setHighlightText] = useState('')
  const [highlightEditIndex, setHighlightEditIndex] = useState(null)
  const [editor, setEditor] = useState(null)
  const [viewingAttraction, setViewingAttraction] = useState(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [success, setSuccess] = useState(null)
  const [actionNotice, setActionNotice] = useState('')
  const [radius, setRadius] = useState(10)
  const [categories, setCategories] = useState(defaultCategories)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [discoveryState, setDiscoveryState] = useState('idle')
  const [discoveryError, setDiscoveryError] = useState('')
  const firstField = useRef(null)
  const attractionsRef = useRef(null)

  useEffect(() => {
    if (!dirty || success) return undefined
    const timer = window.setTimeout(() => {
      const draft = { ...form, draftStep: step }
      if (isEditing) updateEditDraft(id, draft)
      else updateCreateDraft(draft)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [form, step, dirty, success, isEditing, id, updateEditDraft, updateCreateDraft])

  useEffect(() => {
    if (searchParams.get('section') !== 'attractions' || step !== 4) return
    window.requestAnimationFrame(() => attractionsRef.current?.focus())
  }, [searchParams, step])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => navigate(success.updated ? `/management/destinations/${success.id}` : '/management/destinations', { replace: true }), 1800)
    return () => window.clearTimeout(timer)
  }, [success, navigate])

  if (isEditing && !existing) return <section className="destination-form-not-found"><MapPin size={28} /><h1>Destination Not Found</h1><Link to="/management/destinations">Back to Destinations</Link></section>

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setDirty(true)
  }
  const duplicateName = () => destinations.some((item) => String(item.id) !== String(id) && item.name.trim().toLowerCase() === form.name.trim().toLowerCase())
  const errorsForStep = (index) => {
    const next = validateDestinationStep(form, index)
    if (index === 0 && form.name.trim() && duplicateName()) next.name = 'A Destination with this name already exists.'
    return next
  }
  const focusError = () => window.requestAnimationFrame(() => firstField.current?.querySelector('input, textarea, button')?.focus())
  const goToStep = (index) => {
    const reachable = getHighestReachableDestinationStep(form)
    const savedReach = Math.min(5, Math.max(Number(form.lastSavedStep || 0) - 1, Number(form.lastCompletedStep || 0)))
    if (index > Math.max(reachable, savedReach)) return
    setErrors({}); setStep(index); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const continueStep = () => {
    const next = errorsForStep(step)
    setErrors(next)
    if (Object.keys(next).length) { notify(Object.values(next)[0], 'error'); focusError(); return }
    setStep((value) => Math.min(5, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const saveDraft = () => {
    const next = errorsForStep(step)
    setErrors(next)
    if (Object.keys(next).length) { notify(Object.values(next)[0], 'error'); focusError(); return }
    const metadata = createDestinationSaveMetadata(step, form.lastCompletedStep)
    const saved = saveDestinationDraft(id, form, metadata)
    setForm((current) => normalizeDestination({ ...current, ...metadata, id: saved.id, status: saved.status, updatedAt: saved.updatedAt, lastUpdatedAt: saved.lastUpdatedAt }))
    setDirty(false)
    notify(`${SECTION_NAMES[step]} saved successfully.`)
    setActionNotice(`${SECTION_NAMES[step]} saved successfully.`)
    if (!id) navigate(`/management/destinations/${saved.id}/edit?step=${step + 1}`, { replace: true })
  }
  const submit = () => {
    const next = validateDestinationForReview(form)
    if (duplicateName()) next.name = 'A Destination with this name already exists.'
    setErrors(next)
    if (Object.keys(next).length) {
      const invalid = getFirstInvalidDestinationStep(form) ?? 0
      setStep(invalid); notify(`Step ${invalid + 1} needs attention: ${Object.values(next)[0]}`, 'error'); return
    }
    if (id && form.status !== DESTINATION_STATUS.DRAFT) {
      updateDestination(id, { ...form, lastSavedStep: 6, lastCompletedStep: 6, draftStep: 5, lastUpdatedSection: 'Review & Submit' })
      clearEditDraft(id); setDirty(false); setSuccess({ name: form.name, updated: true, id }); return
    }
    const target = id ? { id } : saveDestinationDraft(null, form, { lastSavedStep: 5, lastCompletedStep: 5, lastUpdatedSection: 'Highlights & Attractions' })
    const result = submitDestinationForReview(target.id, form)
    if (!result.ok) { setErrors(result.errors); setStep(getFirstInvalidDestinationStep(form) ?? 0); return }
    if (id) clearEditDraft(id); else clearCreateDraft()
    setDirty(false); setSuccess({ name: form.name, updated: false })
  }
  const chooseImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setErrors((current) => ({ ...current, mainImage: 'Use a JPG, PNG or WebP image up to 5 MB.' })); return }
    change('mainImage', URL.createObjectURL(file)); setActionNotice('Main image changed. Adjust its focal point for both previews.')
  }
  const addHighlight = (value = highlightText) => {
    const text = value.trim()
    if (!text || form.highlights.some((item, index) => index !== highlightEditIndex && item.toLowerCase() === text.toLowerCase())) return
    change('highlights', highlightEditIndex != null ? form.highlights.map((item, index) => index === highlightEditIndex ? text : item) : [...form.highlights, text])
    setHighlightText(''); setHighlightEditIndex(null); setActionNotice(highlightEditIndex != null ? 'Highlight updated.' : 'Highlight added.')
  }
  const move = (field, index, direction) => {
    const list = [...form[field]]; const target = index + direction
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    change(field, field === 'attractions' ? list.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex })) : list)
  }
  const saveAttraction = (item) => {
    const wasEditing = Boolean(editor?.id)
    const list = wasEditing ? form.attractions.map((current) => String(current.id) === String(editor.id) ? item : current) : [...form.attractions, { ...item, displayOrder: form.attractions.length }]
    change('attractions', list); setEditor(null); setActionNotice(wasEditing ? 'Attraction updated.' : 'Attraction added.')
  }
  const discover = async (nextRadius = radius) => {
    if (!hasCoordinates(form)) { setErrors((current) => ({ ...current, location: 'Choose the Destination location before discovering nearby places.' })); setStep(2); return }
    if (!categories.length) { notify('Select at least one nearby place category.', 'error'); return }
    setRadius(nextRadius); setDiscoveryState('loading'); setDiscoveryError(''); setSelectedCandidates([])
    try {
      const results = await discoverNearbyPlaces({ latitude: form.latitude, longitude: form.longitude, radiusKm: nextRadius, categoryKeys: categories })
      setCandidates(results); setDiscoveryState('ready'); setActionNotice(`Nearby search completed within ${nextRadius} km.`)
    } catch {
      setDiscoveryState('error'); setDiscoveryError('Nearby places could not be loaded right now. Your selected location, radius and categories are preserved.')
    }
  }
  const addSelected = () => {
    const additions = candidates.filter((item) => selectedCandidates.includes(item.sourceId) && !isDuplicateAttraction(form.attractions, item)).map((item, index) => ({ ...item, id: `attraction-${Date.now()}-${index}`, shortDescription: '', status: 'ACTIVE', displayOrder: form.attractions.length + index, estimatedTravelTime: '' }))
    change('attractions', [...form.attractions, ...additions]); setSelectedCandidates([]); notify(`${additions.length} attraction${additions.length === 1 ? '' : 's'} added.`)
  }
  const highlightSuggestions = [...new Set([...form.themeKeys.flatMap((key) => ({ HERITAGE: ['Historic Heritage'], COAST: ['Coastal Escapes'], NATURE: ['Natural Landscapes'], HILLS: ['Scenic Hill Country'], URBAN: ['City Discovery'], ADVENTURE: ['Outdoor Adventure'], WELLNESS: ['Restorative Stays'] }[key] || [])), ...form.attractions.map((item) => item.type === 'BEACH' ? 'Golden Beaches' : item.type === 'WILDLIFE' ? 'Wildlife Encounters' : item.type === 'HERITAGE' ? 'Historic Landmarks' : null).filter(Boolean)])].filter((item) => !form.highlights.includes(item))
  const focalPosition = `${form.imageFocalPoint?.x ?? 50}% ${form.imageFocalPoint?.y ?? 50}%`

  if (success) return <section className="destination-success destination-submit-success" role="status"><span><Check size={30} /></span><p>{success.updated ? 'Destination updated successfully' : 'Destination setup completed'}</p><h1>{success.name}</h1><p>All 6 steps completed successfully.</p><p>{success.updated ? 'The canonical Destination record has been updated.' : `${success.name} has been submitted for Manager review.`}</p>{!success.updated && <strong className="destination-status-badge destination-status-badge--ready_for_review">READY FOR REVIEW</strong>}<small>Redirecting to {success.updated ? 'Destination details' : 'Destinations'}...</small></section>

  return <section className="destination-form-page">
    <button className="destination-form-back" type="button" onClick={() => dirty ? setDiscardOpen(true) : navigate(isEditing ? `/management/destinations/${id}` : '/management/destinations')}><ArrowLeft size={17} />Back to Destinations</button>
    <header><div><span>Destination record</span><h1>{isEditing ? 'Edit Destination' : 'Create Destination'}</h1><p>{isEditing ? `Editing Destination · ${existing.name}` : 'Build one shared Destination record for management and customer discovery.'}</p></div><div className="destination-draft-state"><strong className={`destination-status-badge destination-status-badge--${form.status.toLowerCase()}`}>{form.status.replaceAll('_', ' ')}</strong>{dirty && <span>Unsaved Changes</span>}{form.lastUpdatedAt && <small>Last saved · {new Date(form.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}</div></header>
    {actionNotice && <p className="destination-action-notice" role="status" aria-live="polite">{actionNotice}</p>}
    <nav className="destination-stepper" aria-label="Destination setup progress"><div><span style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} /></div><p>Step {step + 1} of {STEPS.length}</p><ol>{STEPS.map((label, index) => { const completed = index < Number(form.lastCompletedStep || 0); const reachable = index <= Math.max(getHighestReachableDestinationStep(form), Math.min(5, Number(form.lastCompletedStep || 0))); return <li key={label} className={index === step ? 'is-current' : completed ? 'is-complete' : ''}><button type="button" disabled={!reachable} onClick={() => goToStep(index)} aria-current={index === step ? 'step' : undefined}><span>{completed ? <Check size={14} /> : index + 1}</span>{label}</button></li> })}</ol></nav>
    <form onSubmit={(event) => { event.preventDefault(); submit() }} noValidate>
      {step === 0 && <StepCard eyebrow="Step 1" title="Destination Identity" copy="Create the name and descriptions guests will see."><div className="destination-fields" ref={firstField}><Field label="Destination Name *" value={form.name} error={errors.name} onChange={(value) => change('name', value)} /><Field wide area rows={3} maxLength={220} label={`Short Description * · ${form.shortDescription.length} / 220`} value={form.shortDescription} error={errors.shortDescription} onChange={(value) => change('shortDescription', value)} helper="Used on Destination cards and discovery surfaces." /><Field wide area rows={7} label="Full Description *" value={form.fullDescription} error={errors.fullDescription} onChange={(value) => change('fullDescription', value)} /></div></StepCard>}
      {step === 1 && <StepCard eyebrow="Step 2" title="Travel Themes" copy="Choose every theme that genuinely describes this Destination."><div className="destination-theme-grid" ref={firstField} role="group" aria-label="Travel Themes">{DESTINATION_THEMES.map((theme) => { const selected = form.themeKeys.includes(theme.key); return <button key={theme.key} type="button" aria-pressed={selected} className={selected ? 'is-selected' : ''} onClick={() => change('themeKeys', selected ? form.themeKeys.filter((key) => key !== theme.key) : [...form.themeKeys, theme.key])}><ThemeIcon themeKey={theme.key} size={22} /><span><strong>{theme.label}</strong><small>{theme.description}</small></span>{selected && <Check size={17} />}</button> })}</div>{errors.themeKeys && <small className="destination-field-error" role="alert">{errors.themeKeys}</small>}</StepCard>}
      {step === 2 && <StepCard eyebrow="Step 3" title="Location" copy="Choose a Province and District, then confirm the exact Destination centre."><div className="destination-location-fields" ref={firstField}><ManagementSelect label="Province" required value={form.region} placeholder="Select province" options={SRI_LANKA_PROVINCES.map((value) => ({ value, label: value }))} onChange={(value) => { setForm((current) => ({ ...current, region: value, district: '', latitude: null, longitude: null, locationConfirmed: false })); setErrors((current) => ({ ...current, region: '', district: '', location: '' })); setDirty(true) }} error={errors.region} /><ManagementSelect label="District" required value={form.district} placeholder={form.region ? 'Select district' : 'Select a Province first'} options={getDistrictsForProvince(form.region).map((item) => ({ value: item.name, label: item.name }))} onChange={(value) => { const centre = getDistrictCentre(form.region, value); setForm((current) => ({ ...current, district: value, latitude: centre?.latitude ?? null, longitude: centre?.longitude ?? null, locationConfirmed: false })); setErrors((current) => ({ ...current, district: '', location: '' })); setDirty(true) }} error={errors.district} /></div>{form.district && hasCoordinates(form) && !form.locationConfirmed && <div className="destination-location-suggestion"><strong>Suggested Destination centre</strong><p>The map is centred on {form.district} District. Drag the marker or click the map to adjust it, then confirm the location.</p><button type="button" onClick={() => change('locationConfirmed', true)}><Check size={15} />Confirm suggested centre</button></div>}<MapLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(location) => { setForm((current) => ({ ...current, ...location, locationConfirmed: hasCoordinates(location) })); setDirty(true); setErrors((current) => ({ ...current, location: '' })) }} label={[form.name || form.district, form.region, 'Sri Lanka'].filter(Boolean).join(', ')} heading="Destination centre" error={errors.location} />{form.locationConfirmed && <div className="destination-selected-location"><strong>Selected Location</strong><span>{form.name || form.district}</span><small>{form.region} · {form.district} District</small><p>Destination centre selected</p></div>}</StepCard>}
      {step === 3 && <StepCard eyebrow="Step 4" title="Destination Media" copy="Use one canonical image and position its focal subject for every Destination surface."><div className={`destination-cover-upload${errors.mainImage ? ' has-error' : ''}`}>{form.mainImage ? <><img src={form.mainImage} alt={`${form.name || 'Destination'} cover preview`} style={{ objectPosition: focalPosition }} /><div><strong>Main / Cover Image</strong><p>Original media is preserved; focal positioning controls non-destructive display cropping.</p><label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><ImagePlus size={17} />Replace Image</label><button type="button" onClick={() => change('mainImage', '')}><Trash2 size={16} />Remove</button></div></> : <label ref={firstField}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><ImagePlus size={30} /><strong>Choose Main / Cover Image</strong><span>JPG, PNG or WebP · maximum 5 MB</span></label>}</div>{errors.mainImage && <small className="destination-field-error" role="alert">{errors.mainImage}</small>}{form.mainImage && <><div className="destination-focal-controls"><label><span>Horizontal focal point</span><input type="range" min="0" max="100" value={form.imageFocalPoint?.x ?? 50} onChange={(event) => change('imageFocalPoint', { ...form.imageFocalPoint, x: Number(event.target.value) })} /></label><label><span>Vertical focal point</span><input type="range" min="0" max="100" value={form.imageFocalPoint?.y ?? 50} onChange={(event) => change('imageFocalPoint', { ...form.imageFocalPoint, y: Number(event.target.value) })} /></label></div><div className="destination-media-previews"><figure><div className="is-card"><img src={form.mainImage} alt="Destination Card preview" style={{ objectPosition: focalPosition }} /></div><figcaption>Destination Card · 4:3</figcaption></figure><figure><div className="is-hero"><img src={form.mainImage} alt="Destination Hero preview" style={{ objectPosition: focalPosition }} /></div><figcaption>Destination Hero · wide</figcaption></figure></div></>}</StepCard>}
      {step === 4 && <StepCard eyebrow="Step 5" title="Highlights & Attractions" copy="Curate concise Highlights and real nearby places."><section className="destination-highlights-editor" ref={firstField}><div className="section-heading"><div><h3>Highlights</h3><p>Short Destination-specific facts—not full Experiences.</p></div></div><div className="highlight-compose"><input value={highlightText} placeholder="e.g. Historic Fort" onChange={(event) => setHighlightText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addHighlight() } }} /><button type="button" onClick={() => addHighlight()}>{highlightEditIndex == null ? <Plus size={16} /> : <Check size={16} />}{highlightEditIndex == null ? 'Add Highlight' : 'Save Highlight'}</button></div>{errors.highlights && <small className="destination-field-error" role="alert">{errors.highlights}</small>}{highlightSuggestions.length > 0 && <div className="highlight-suggestions"><span>Suggested Highlights — review before adding</span>{highlightSuggestions.map((item) => <button type="button" key={item} onClick={() => addHighlight(item)}><Plus size={13} />{item}</button>)}</div>}{form.highlights.length ? <ul className="saved-highlights">{form.highlights.map((item, index) => <li key={`${item}-${index}`}><span>{item}</span><div><button type="button" aria-label={`Edit ${item}`} onClick={() => { setHighlightText(item); setHighlightEditIndex(index) }}><Pencil size={14} /></button><button type="button" disabled={index === 0} aria-label={`Move ${item} up`} onClick={() => move('highlights', index, -1)}><ChevronUp size={15} /></button><button type="button" disabled={index === form.highlights.length - 1} aria-label={`Move ${item} down`} onClick={() => move('highlights', index, 1)}><ChevronDown size={15} /></button><button type="button" aria-label={`Remove ${item}`} onClick={() => change('highlights', form.highlights.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></button></div></li>)}</ul> : <Empty text="No Highlights added yet." action="Add Highlight" onClick={() => document.querySelector('.highlight-compose input')?.focus()} />}</section>
        <section className="nearby-discovery"><div className="section-heading"><div><h3>Nearby Attractions</h3><p>Provider suggestions remain staged until you select and add them.</p></div><button type="button" className="discovery-button" disabled={discoveryState === 'loading'} onClick={() => discover()}><Search size={16} />{discoveryState === 'loading' ? 'Searching…' : 'Discover Nearby Places'}</button></div><div className="discovery-controls"><fieldset><legend>Radius</legend>{[2, 5, 10, 20].map((value) => <button type="button" aria-pressed={radius === value} className={radius === value ? 'is-selected' : ''} key={value} onClick={() => setRadius(value)}>{value} km</button>)}</fieldset><fieldset><legend>Categories</legend>{ATTRACTION_TYPES.map((type) => <button type="button" aria-pressed={categories.includes(type.key)} className={categories.includes(type.key) ? 'is-selected' : ''} key={type.key} onClick={() => setCategories(categories.includes(type.key) ? categories.filter((key) => key !== type.key) : [...categories, type.key])}><AttractionIcon type={type.key} size={14} />{type.label}</button>)}</fieldset></div>
          {discoveryState === 'loading' && <div className="discovery-message" role="status"><RotateCcw className="spin" size={19} /><div><strong>Searching nearby places within {radius} km...</strong><span>{categories.map((key) => getAttractionType(key).label).join(' · ')}</span></div></div>}
          {discoveryState === 'error' && <div className="discovery-message is-error" role="alert"><p>{discoveryError}</p><button type="button" onClick={() => discover()}>Try Again</button><button type="button" onClick={() => setEditor({})}>Add Attraction Manually</button></div>}
          {discoveryState === 'ready' && <div className="nearby-result-groups">{groupNearbyPlacesByCategory(candidates, categories).map(({ categoryKey, results: items }) => { const type = getAttractionType(categoryKey); return <section key={categoryKey}><header><span><AttractionIcon type={categoryKey} size={16} />{type.label}</span><strong>{items.length} {items.length === 1 ? 'place' : 'places'} found</strong></header>{items.length ? <div className="discovery-results">{items.map((item) => { const already = isDuplicateAttraction(form.attractions, item); const selected = selectedCandidates.includes(item.sourceId); const toggle = () => { if (!already) setSelectedCandidates(selected ? selectedCandidates.filter((value) => value !== item.sourceId) : [...selectedCandidates, item.sourceId]) }; return <article key={item.sourceId} role="checkbox" tabIndex={already ? -1 : 0} aria-checked={selected || already} className={already ? 'is-added' : selected ? 'is-selected' : ''} onClick={toggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle() } }}><span className="discovery-result-icon"><AttractionIcon type={item.type} size={22} /></span><div><strong>{item.name}</strong><span>{getAttractionType(item.type).label}</span><small>{formatDistanceKm(item.distanceKm)} away</small><em>OpenStreetMap</em></div><button type="button" disabled={already} aria-label={`${selected ? 'Deselect' : 'Select'} ${item.name}`} onClick={(event) => { event.stopPropagation(); toggle() }}>{already ? <><CheckCircle2 size={14} />Added</> : selected ? <><Check size={14} />Selected</> : 'Select Attraction'}</button></article> })}</div> : <div className="nearby-zero-result"><p>No nearby places were found for this category within {radius} km.</p><span>Try another radius or category.</span>{radius < 20 && <button type="button" onClick={() => discover(radius < 5 ? 5 : radius < 10 ? 10 : 20)}>Search within {radius < 5 ? 5 : radius < 10 ? 10 : 20} km</button>}</div>}</section> })}<footer><span>{selectedCandidates.length} attraction{selectedCandidates.length === 1 ? '' : 's'} selected</span><button className="clear-selection" type="button" disabled={!selectedCandidates.length} onClick={() => setSelectedCandidates([])}>Clear Selection</button><button type="button" disabled={!selectedCandidates.length} onClick={addSelected}>Add {selectedCandidates.length} Attraction{selectedCandidates.length === 1 ? '' : 's'}</button></footer></div>}
        </section>
        <section className="added-attractions" ref={attractionsRef} tabIndex="-1"><div className="section-heading"><div><h3>Added Attractions</h3><p>Only active curated attractions are shown to customers.</p></div><button type="button" onClick={() => setEditor({})}><Plus size={15} />Add Attraction Manually</button></div>{form.attractions.length ? <div>{form.attractions.map((item, index) => <article key={item.id}><div className="attraction-card-media">{item.image ? <img src={item.image} alt={`${item.name} attraction`} /> : <AttractionIcon type={item.type} size={25} />}</div><div className="attraction-card-copy"><strong>{item.name}</strong><small>{getAttractionType(item.type).label} · {formatDistanceKm(calculateDistanceKm(form, item)) || 'Location pending'}</small><p>{item.shortDescription || 'No description added.'}</p></div><span className={`attraction-status attraction-status--${item.status.toLowerCase()}`}>{item.status}</span><div className="attraction-card-actions"><button type="button" onClick={() => setViewingAttraction(item)}><Eye size={14} />View</button><button type="button" onClick={() => setEditor(item)}><Pencil size={14} />Edit</button>{hasCoordinates(item) && <a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} />Map</a>}<span className="attraction-order-actions"><button type="button" disabled={index === 0} title="Move up" aria-label={`Move ${item.name} up`} onClick={() => move('attractions', index, -1)}><ChevronUp size={15} /></button><button type="button" disabled={index === form.attractions.length - 1} title="Move down" aria-label={`Move ${item.name} down`} onClick={() => move('attractions', index, 1)}><ChevronDown size={15} /></button></span><button type="button" className={item.status === 'ACTIVE' ? 'danger' : ''} onClick={() => change('attractions', form.attractions.map((current) => current.id === item.id ? { ...current, status: current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : current))}>{item.status === 'ACTIVE' ? <><EyeOff size={14} />Deactivate</> : <><CheckCircle2 size={14} />Reactivate</>}</button></div></article>)}</div> : <Empty text="No curated attractions have been added yet. Search nearby places or add one manually." action="Add Attraction Manually" onClick={() => setEditor({})} />}</section>
      </StepCard>}
      {step === 5 && <ReviewStep form={form} errors={errors} onEdit={goToStep} />}
      <footer className="destination-form-actions"><button type="button" className="secondary" onClick={() => dirty ? setDiscardOpen(true) : navigate('/management/destinations')}>Cancel</button>{step < 5 && <button type="button" className="secondary" onClick={saveDraft}><Save size={16} />Save Draft</button>}<div>{step > 0 && <button type="button" className="secondary" onClick={() => goToStep(step - 1)}><ArrowLeft size={16} />Back</button>}{step < 5 ? <button type="button" className="primary" onClick={continueStep}>Continue<ArrowRight size={16} /></button> : <button type="submit" className="primary">{form.status === DESTINATION_STATUS.DRAFT ? 'Submit for Manager Review' : 'Save Changes'}</button>}</div></footer>
    </form>
    {editor && <AttractionEditor attraction={editor.id ? editor : null} destination={form} attractions={form.attractions} onSave={saveAttraction} onClose={() => setEditor(null)} />}
    {viewingAttraction && <ManagementDialog title={viewingAttraction.name} description={`${getAttractionType(viewingAttraction.type).label} · ${viewingAttraction.status}`} onClose={() => setViewingAttraction(null)} actions={<><button type="button" onClick={() => setViewingAttraction(null)}>Close</button><button className="management-dialog-primary" type="button" onClick={() => { setEditor(viewingAttraction); setViewingAttraction(null) }}>Edit Attraction</button></>}><div className="attraction-view"><span className="attraction-view-icon"><AttractionIcon type={viewingAttraction.type} size={25} /></span><dl><div><dt>Description</dt><dd>{viewingAttraction.shortDescription || 'No description added.'}</dd></div><div><dt>Distance</dt><dd>{formatDistanceKm(calculateDistanceKm(form, viewingAttraction)) || 'Location pending'}</dd></div><div><dt>Coordinates</dt><dd>{hasCoordinates(viewingAttraction) ? `${viewingAttraction.latitude}, ${viewingAttraction.longitude}` : 'Not configured'}</dd></div><div><dt>Source</dt><dd>{viewingAttraction.source || viewingAttraction.sourceId ? 'OpenStreetMap' : 'Manually curated'}</dd></div></dl>{hasCoordinates(viewingAttraction) && <a href={`https://www.google.com/maps/search/?api=1&query=${viewingAttraction.latitude},${viewingAttraction.longitude}`} target="_blank" rel="noreferrer">View on Map <ExternalLink size={14} /></a>}</div></ManagementDialog>}
    {discardOpen && <ManagementDialog danger title="Discard unsaved changes?" description="Your unsaved editor changes will be removed. Successfully saved Destination data remains safe." onClose={() => setDiscardOpen(false)} actions={<><button type="button" onClick={() => setDiscardOpen(false)}>Keep Editing</button><button className="management-dialog-danger" type="button" onClick={() => { if (isEditing) clearEditDraft(id); else clearCreateDraft(); navigate(isEditing ? `/management/destinations/${id}` : '/management/destinations') }}>Discard Changes</button></>} />}
  </section>
}

function ReviewStep({ form, errors, onEdit }) {
  const themes = getDestinationThemes(form)
  const validation = validateDestinationForReview(form)
  const issueSteps = [...new Set(Object.keys(validation).map((key) => ['name', 'shortDescription', 'fullDescription'].includes(key) ? 0 : key === 'themeKeys' ? 1 : ['region', 'district', 'location'].includes(key) ? 2 : key === 'mainImage' ? 3 : 4))]
  return <StepCard eyebrow="Step 6" title="Review & Submit" copy="Review the same canonical content used by management and customer Destination surfaces.">{issueSteps.length > 0 && <div className="destination-validation-summary" role="alert"><strong>Destination setup needs attention</strong>{issueSteps.map((index) => <div key={index}><span>{SECTION_NAMES[index]}</span><ul>{Object.entries(validation).filter(([key]) => (index === 0 ? ['name', 'shortDescription', 'fullDescription'].includes(key) : index === 1 ? key === 'themeKeys' : index === 2 ? ['region', 'district', 'location'].includes(key) : index === 3 ? key === 'mainImage' : key === 'highlights')).map(([, message]) => <li key={message}>{message}</li>)}</ul><button type="button" onClick={() => onEdit(index)}>Fix {SECTION_NAMES[index]}</button></div>)}</div>}
    <div className="destination-review-hero">{form.mainImage && <img src={form.mainImage} alt="" style={{ objectPosition: `${form.imageFocalPoint?.x ?? 50}% ${form.imageFocalPoint?.y ?? 50}%` }} />}<div><span>{form.region} · {form.district} District</span><h3>{form.name}</h3><p>{form.shortDescription}</p></div></div>
    <div className="destination-review-sections"><ReviewSection title="Destination Identity" onEdit={() => onEdit(0)}><p>{form.fullDescription}</p></ReviewSection><ReviewSection title="Travel Themes" onEdit={() => onEdit(1)}><div className="destination-review-tags">{themes.map((theme) => <span key={theme.key}><ThemeIcon themeKey={theme.key} size={14} />{theme.label}</span>)}</div></ReviewSection><ReviewSection title="Location" onEdit={() => onEdit(2)}><p>{form.region} · {form.district} District</p><small>{form.locationConfirmed ? 'Destination centre confirmed' : 'Destination centre needs confirmation'}</small></ReviewSection><ReviewSection title="Media" onEdit={() => onEdit(3)}><p>{form.mainImage ? 'Main Image configured with focal position.' : 'Main Image missing.'}</p></ReviewSection><ReviewSection title="Highlights" onEdit={() => onEdit(4)}><ul>{form.highlights.map((item) => <li key={item}>{item}</li>)}</ul></ReviewSection><ReviewSection title="Nearby Attractions" onEdit={() => onEdit(4)}><p>{form.attractions.length} curated · {form.attractions.filter((item) => item.status === 'ACTIVE').length} active</p></ReviewSection></div>{Object.keys(errors).length > 0 && <p className="destination-field-error">Resolve the items above before submission.</p>}</StepCard>
}

function ReviewSection({ title, onEdit, children }) { return <article><header><h3>{title}</h3><button type="button" onClick={onEdit}>Edit</button></header>{children}</article> }
function Field({ label, value, onChange, error, helper, area = false, wide = false, ...props }) { const Control = area ? 'textarea' : 'input'; return <label className={wide ? 'field-wide' : ''}><span>{label}</span><Control {...props} value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />{helper && <small>{helper}</small>}{error && <small role="alert">{error}</small>}</label> }
function StepCard({ eyebrow, title, copy, children }) { return <article className="destination-step-card"><header><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></header>{children}</article> }
function Empty({ text, action, onClick }) { return <div className="destination-empty"><p>{text}</p><button type="button" onClick={onClick}><Plus size={15} />{action}</button></div> }
export default DestinationForm
