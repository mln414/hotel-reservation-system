import { ArrowLeft, Check, Eye, Pencil, Plus, Tag, Trash2, AlertTriangle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import CalendarPicker from '../../components/SearchBar/CalendarPicker.jsx'
import useHotels from '../../context/useHotels.js'
import useRates from '../../context/useRates.js'
import useRooms from '../../context/useRooms.js'
import { calculateDerivedRate, DAY_KEYS, formatRateAmount, formatRateChange, getBaseRate, getRateStatus, PRICING_METHOD_LABELS, RATE_TYPE_DESCRIPTIONS, RATE_TYPE_LABELS, RATE_TYPES } from '../../utils/rateFormatting.js'
import './ManageRates.css'

const typeOptions = RATE_TYPES.map((value) => ({ value, label: RATE_TYPE_LABELS[value], description: RATE_TYPE_DESCRIPTIONS[value] }))
const methodOptions = Object.entries(PRICING_METHOD_LABELS).map(([value, label]) => ({ value, label }))
const statusOptions = [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]
const dayLabels = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }
const blankRate = (rateType = 'BASE') => ({ name: rateType === 'BASE' ? 'Base Rate' : RATE_TYPE_LABELS[rateType], rateType, pricingMethod: 'SET_PRICE', changeType: 'PERCENTAGE', amount: '', value: '', validFrom: '', validTo: '', applicableDays: rateType === 'WEEKEND' ? ['FRI', 'SAT'] : [], minimumStay: '', notes: '', status: 'ACTIVE' })

export default function ManageRates() {
  const { hotels, destinations } = useHotels(); const { rooms } = useRooms(); const rates = useRates(); const [params, setParams] = useSearchParams(); const [modeError, setModeError] = useState('')
  const section = params.get('section') || ''; const hotelId = params.get('hotelId') || ''; const roomTypeId = params.get('roomTypeId') || ''; const source = params.get('from') || ''
  const hasRateMode = section === 'hotelRates' || section === 'roomTypeRates'
  const hotel = hasRateMode ? hotels.find((item) => String(item.id) === String(hotelId)) : null
  const room = rooms.find((item) => String(item.id) === String(roomTypeId)); const hotelRooms = rooms.filter((item) => String(item.hotelId) === String(hotelId)); const destination = destinations.find((item) => String(item.id) === String(hotel?.destinationId))
  const setContext = (updates) => { const next = new URLSearchParams(params); Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); setParams(next) }
  const backTarget = source === 'hotelSetup' ? `/management/hotels/${hotelId}/setup?tab=rates` : source === 'roomDetails' ? `/management/rooms/${roomTypeId}` : '/management/rates'
  const chooseMode = (key) => { setModeError(''); setContext({ section: key, roomTypeId: '' }) }
  const chooseHotel = (id) => { if (!hasRateMode) { setModeError('Select Hotel Rates or Room Type Rates before choosing a Hotel.'); return } setModeError(''); setContext({ hotelId: id, section }) }

  return <section className="rates-page"><header className="rates-header"><div><span>{hotel ? `${hotel.name} · Commercial setup` : 'Commercial setup'}</span><h1>Rates</h1><p>Normal Hotel and Room Type selling prices. Promotions remain in Offers.</p></div>{hotel && <Link to={backTarget}><ArrowLeft size={15} />{source === 'roomDetails' ? 'Back to Room Type' : source === 'hotelSetup' ? `Back to ${hotel.name} Rates` : 'Change Hotel'}</Link>}</header>
    {!hotel && <nav className="rates-section-nav" aria-label="Rate sections">{[['hotelRates', 'Hotel Rates', 'Property-level pricing rules.'], ['roomTypeRates', 'Room Type Rates', 'Date-aware selling rates for Room Types.']].map(([key, title, description]) => <button type="button" className={section === key ? 'active' : ''} key={key} onClick={() => chooseMode(key)}><strong>{title}</strong><small>{description}</small></button>)}</nav>}
    {hotel && <section className="rates-context-banner"><span>Pricing for</span><div><h2>{hotel.name}</h2><p>{destination?.name || hotel.destination}{room && <> <b>→</b> {room.name}</>}</p></div></section>}
    {!hotel && modeError && <p className="rate-mode-error" role="alert">{modeError}</p>}
    {!hotel && <HotelPicker hotels={hotels} destinations={destinations} rooms={rooms} roomRates={rates.roomRates} section={section} select={chooseHotel} />}
    {hotel && section === 'hotelRates' && <RateWorkspace scope="hotel" subject={hotel} items={rates.getRatesForHotel(hotel.id)} add={rates.addHotelRate} update={rates.updateHotelRate} activate={rates.activateHotelRate} deactivate={rates.deactivateHotelRate} remove={() => {}} />}
    {hotel && section === 'roomTypeRates' && !room && <RoomPicker hotel={hotel} rooms={hotelRooms} getCurrentRoomRate={rates.getCurrentRoomRate} select={(id) => setContext({ roomTypeId: id })} />}
    {hotel && section === 'roomTypeRates' && room && <RateWorkspace scope="room" subject={room} items={rates.getRatesByRoomId(room.id)} add={rates.addRoomRate} update={rates.updateRoomRate} activate={rates.activateRoomRate} deactivate={rates.deactivateRoomRate} remove={rates.deleteRoomRate} />}
  </section>
}

function HotelPicker({ hotels, destinations, rooms, roomRates, section, select }) {
  return <article className="rates-panel"><div className="rates-panel-heading"><span>Choose a property</span><h2>Select a Hotel to Manage Rates</h2><p>{section ? `${section === 'hotelRates' ? 'Hotel Rates' : 'Room Type Rates'} selected. Choose a Hotel to continue.` : 'First select Hotel Rates or Room Type Rates above.'}</p></div><div className="rates-hotel-grid">{hotels.map((hotel) => { const count = roomRates.filter((rate) => String(rate.hotelId) === String(hotel.id) && getRateStatus(rate) === 'CURRENT').length; return <button type="button" key={hotel.id} onClick={() => select(hotel.id)}><img src={hotel.image} alt="" /><span><strong>{hotel.name}</strong><small>{destinations.find((item) => String(item.id) === String(hotel.destinationId))?.name || hotel.destination}</small><em>{rooms.filter((room) => String(room.hotelId) === String(hotel.id)).length} Room Types · {count} Current Room Rates</em></span></button> })}</div></article>
}

function RoomPicker({ hotel, rooms, getCurrentRoomRate, select }) {
  return <article className="rates-panel"><div className="rates-panel-heading"><span>Room Type context</span><h2>Choose a Room Type at {hotel.name}</h2><p>Only Room Types belonging to this Hotel are shown.</p></div>{rooms.length ? <div className="rates-room-picker">{rooms.map((room) => { const rate = getCurrentRoomRate(room.id); return <button type="button" key={room.id} onClick={() => select(room.id)}><img src={room.mainImage || room.image} alt="" /><span><strong>{room.name}</strong><small>{rate ? `${formatRateAmount(rate.amount)} · Rate Ready` : 'Pricing Not Configured'}</small></span></button> })}</div> : <div className="rates-empty"><p>No Room Types are configured for this Hotel.</p><Link to={`/management/rooms/new?hotelId=${hotel.id}`}>Add Room Type</Link></div>}</article>
}

function RateWorkspace({ scope, subject, items, add, update, activate, deactivate, remove }) {
  const [editing, setEditing] = useState(null); const [form, setForm] = useState(blankRate()); const [errors, setErrors] = useState({}); const [viewing, setViewing] = useState(''); const [openPicker, setOpenPicker] = useState(''); const [actionError, setActionError] = useState(''); const [deletingId, setDeletingId] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false); const workspaceRef = useRef(null)
  const base = getBaseRate(items); const result = calculateDerivedRate(Number(base?.amount || 0), form); const needsBase = form.rateType !== 'BASE' && form.pricingMethod !== 'SET_PRICE' && !base
  useEffect(() => { const outside = (event) => { if (!workspaceRef.current?.contains(event.target)) setOpenPicker('') }; const escape = (event) => { if (event.key === 'Escape') setOpenPicker('') }; document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape); return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) } }, [])
  const set = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); setActionError('') }
  const setValidFrom = (value) => { setForm((current) => ({ ...current, validFrom: value, validTo: current.validTo && current.validTo < value ? '' : current.validTo })); setErrors((current) => ({ ...current, validFrom: '', validTo: '' })) }
  const chooseType = (rateType) => setForm((current) => ({ ...blankRate(rateType), name: current.name === 'Base Rate' || Object.values(RATE_TYPE_LABELS).includes(current.name) ? RATE_TYPE_LABELS[rateType] : current.name, status: current.status, notes: current.notes }))
  const validate = () => {
    const next = {}; const amount = Number(form.amount); const value = Number(form.value)
    if (!form.name.trim()) next.name = 'Rate Name is required.'
    if (form.rateType === 'BASE' && (!Number.isFinite(amount) || amount <= 0)) next.amount = 'Base Amount must be greater than zero.'
    if (form.rateType !== 'BASE') {
      if (form.pricingMethod === 'SET_PRICE' && (!Number.isFinite(amount) || amount <= 0)) next.amount = 'New Price must be greater than zero.'
      if (form.pricingMethod !== 'SET_PRICE') {
        if (!base) next.base = 'Configure a Base Rate before using a price increase or decrease.'
        if (form.value === '' || !Number.isFinite(value) || (form.changeType === 'PERCENTAGE' ? value <= 0 : value < 0)) next.value = form.changeType === 'PERCENTAGE' ? 'Enter a positive percentage.' : 'Enter a fixed amount of zero or more.'
        if (form.changeType === 'PERCENTAGE' && value > 1000) next.value = 'Enter a reasonable percentage.'
        if (form.pricingMethod === 'DECREASE_BASE' && result <= 0) next.value = 'Decrease must leave a positive selling price.'
      }
      if (!form.validFrom) next.validFrom = 'Valid From is required.'
      if (form.rateType !== 'SPECIAL_DATE' && !form.validTo) next.validTo = 'Valid To is required.'
      if (form.validTo && form.validFrom > form.validTo) next.validTo = 'Valid To must be on or after Valid From.'
      if (form.rateType === 'WEEKEND' && !form.applicableDays.length) next.days = 'Select at least one applicable day.'
    }
    if (form.minimumStay !== '' && (!Number.isFinite(Number(form.minimumStay)) || Number(form.minimumStay) < 1)) next.minimumStay = 'Minimum Stay must be at least one night.'
    if (!editing && form.rateType === 'BASE' && base) next.base = 'A Base Rate already exists. Edit the current Base Rate instead.'
    setErrors(next); return !Object.keys(next).length
  }
  const submit = async (event) => {
    event.preventDefault(); if (!validate()) return
    setActionError('')
    setIsSubmitting(true)
    const payload = { ...form, amount: Number(form.amount || 0), value: Number(form.value || 0), minimumStay: form.minimumStay === '' ? '' : Number(form.minimumStay), applicableDays: form.rateType === 'WEEKEND' ? form.applicableDays : [], validFrom: form.rateType === 'BASE' ? '' : form.validFrom, validTo: form.rateType === 'BASE' ? '' : form.validTo, pricingMethod: form.rateType === 'BASE' ? 'SET_PRICE' : form.pricingMethod, hotelId: scope === 'hotel' ? subject.id : subject.hotelId, ...(scope === 'room' ? { roomTypeId: subject.id } : {}) }
    try {
      if (editing) await update(editing, payload); else await add(payload)
      setEditing(null); setForm(blankRate()); setErrors({}); setOpenPicker('')
    } catch (err) {
      setActionError(err.message || 'Failed to save rate plan.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const edit = (rate) => { setEditing(rate.id); setForm({ ...blankRate(rate.rateType), ...rate, pricingMethod: rate.rateType === 'BASE' ? 'SET_PRICE' : (rate.pricingMethod || 'SET_PRICE'), changeType: rate.changeType || 'PERCENTAGE', value: rate.value || '', minimumStay: rate.minimumStay ?? '', applicableDays: [...(rate.applicableDays || [])] }); setErrors({}); setOpenPicker(''); setActionError('') }
  const cancel = () => { setEditing(null); setForm(blankRate()); setErrors({}); setOpenPicker(''); setActionError('') }

  const handleDelete = async (rateId) => {
    setActionError('')
    try {
      await remove(rateId)
      setDeletingId(null)
    } catch (err) {
      setActionError(err.message || 'This rate cannot be deleted. Deactivate it instead.')
      setDeletingId(null)
    }
  }

  return <div className="rates-workspace" ref={workspaceRef}><section className="rates-panel rate-editor"><div className="rates-panel-heading"><span>Configure Rate</span><h2>{editing ? `Edit ${RATE_TYPE_LABELS[form.rateType]}` : `Add ${RATE_TYPE_LABELS[form.rateType]}`}</h2><p>Pricing for {subject.name}</p></div>
    {actionError && <div className="rate-action-error" role="alert" style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.875rem' }}><AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{actionError}</div>}
    <form onSubmit={submit} noValidate><div className="rate-form-grid">
    <Field label="Rate Name *" error={errors.name}><input value={form.name} onChange={(event) => set('name', event.target.value)} /></Field><ManagementSelect label="Rate Type" required value={form.rateType} options={typeOptions} onChange={chooseType} />
    {form.rateType === 'BASE' ? <Field label="Base Amount (LKR) *" error={errors.amount} helper="Default selling rate. No date range is required."><input type="number" min="0.01" value={form.amount} onChange={(event) => set('amount', event.target.value)} /></Field> : <><ManagementSelect label="Pricing Method" required value={form.pricingMethod} options={methodOptions} onChange={(value) => set('pricingMethod', value)} />{form.pricingMethod === 'SET_PRICE' ? <Field label="New Price (LKR) *" error={errors.amount}><input type="number" min="0.01" value={form.amount} onChange={(event) => set('amount', event.target.value)} /></Field> : <><Field label="Change Type *"><div className="rate-segmented"><button type="button" aria-pressed={form.changeType === 'PERCENTAGE'} onClick={() => set('changeType', 'PERCENTAGE')}>Percentage %</button><button type="button" aria-pressed={form.changeType === 'FIXED_AMOUNT'} onClick={() => set('changeType', 'FIXED_AMOUNT')}>Fixed Amount LKR</button></div></Field><Field label="Value *" error={errors.value}><input type="number" min={form.changeType === 'FIXED_AMOUNT' ? 0 : 0.01} step="0.01" value={form.value} onChange={(event) => set('value', event.target.value)} /></Field></>}{needsBase && <div className="rate-base-warning" role="alert"><p>Configure a Base Rate before using a price increase or decrease.</p><button type="button" onClick={() => chooseType('BASE')}>Configure Base Rate</button></div>}<DateField id={`${scope}-rate-from`} label={form.rateType === 'SPECIAL_DATE' ? 'Special Date / Valid From *' : 'Valid From *'} value={form.validFrom} open={openPicker === 'from'} error={errors.validFrom} onToggle={(open) => setOpenPicker(open ? 'from' : '')} onChange={setValidFrom} /><DateField id={`${scope}-rate-to`} label={form.rateType === 'SPECIAL_DATE' ? 'Optional End Date' : 'Valid To *'} value={form.validTo} minDate={form.validFrom} open={openPicker === 'to'} error={errors.validTo} onToggle={(open) => setOpenPicker(open ? 'to' : '')} onChange={(value) => set('validTo', value)} />{form.rateType === 'WEEKEND' && <DaySelector days={form.applicableDays} setDays={(days) => set('applicableDays', days)} error={errors.days} />}<Field label="Minimum Stay (Nights)" error={errors.minimumStay} helper="Minimum stay required for this rate."><input type="number" min="1" value={form.minimumStay} onChange={(event) => set('minimumStay', event.target.value)} /></Field></>}
    <ManagementSelect label="Status" required value={form.status} options={statusOptions} onChange={(value) => set('status', value)} /><Field wide label="Notes"><textarea rows="3" value={form.notes} onChange={(event) => set('notes', event.target.value)} /></Field></div>{errors.base && form.rateType === 'BASE' && <p className="rates-field-error" role="alert">{errors.base}</p>}<div className="rate-form-actions">{editing && <button type="button" onClick={cancel}>Cancel</button>}<button className="rate-submit" type="submit" disabled={isSubmitting}><Plus size={14} />{isSubmitting ? 'Saving…' : (editing ? 'Save Rate' : `Add ${RATE_TYPE_LABELS[form.rateType]}`)}</button></div></form></section>
    {form.rateType !== 'BASE' && <PricePreview base={base} form={form} result={result} />}
    <section className="rates-panel current-rates"><div className="rates-panel-heading"><span>Current Rates</span><h2>{items.length} configured</h2></div>{items.length ? <div className="rates-list">{items.map((rate) => <RateCard key={rate.id} rate={rate} base={getBaseRate(items)} viewing={String(viewing) === String(rate.id)} view={() => setViewing(String(viewing) === String(rate.id) ? '' : rate.id)} edit={() => edit(rate)} toggle={() => rate.status === 'ACTIVE' ? deactivate(rate.id) : activate(rate.id)} onDelete={() => setDeletingId(rate.id)} isDeleting={deletingId === rate.id} confirmDelete={() => handleDelete(rate.id)} cancelDelete={() => setDeletingId(null)} />)}</div> : <div className="rates-empty"><Tag size={23} /><h3>No rates configured yet.</h3><p>Configure a Base Rate to establish the default price.</p><button type="button" onClick={() => chooseType('BASE')}>Add Base Rate</button></div>}</section></div>
}

function DateField({ id, label, value, minDate, open, onToggle, onChange, error }) { return <div className="rate-field"><span>{label}</span><CalendarPicker id={id} name={id} value={value} minDate={minDate} isOpen={open} onToggle={onToggle} onChange={onChange} />{error && <small className="rates-field-error" role="alert">{error}</small>}</div> }
function Field({ label, helper, error, wide, children }) { return <label className={`rate-field${wide ? ' rate-field--wide' : ''}`}><span>{label}</span>{children}{helper && <small>{helper}</small>}{error && <small className="rates-field-error" role="alert">{error}</small>}</label> }
function DaySelector({ days, setDays, error }) { const toggle = (day) => setDays(days.includes(day) ? days.filter((item) => item !== day) : [...days, day]); return <fieldset className="rate-days"><legend>Applicable Days *</legend><div className="rate-day-presets"><button type="button" onClick={() => setDays(['FRI', 'SAT'])}>Weekend</button><button type="button" onClick={() => setDays(['MON', 'TUE', 'WED', 'THU'])}>Weekdays</button><button type="button" onClick={() => setDays(DAY_KEYS)}>Every Day</button><button type="button" onClick={() => setDays([])}>Clear</button></div><div className="rate-day-chips">{DAY_KEYS.map((day) => <button type="button" key={day} aria-pressed={days.includes(day)} onClick={() => toggle(day)}>{dayLabels[day]}{days.includes(day) && <Check size={12} />}</button>)}</div>{error && <small className="rates-field-error" role="alert">{error}</small>}</fieldset> }
function PricePreview({ base, form, result }) { return <aside className="rates-panel price-preview"><span>Price Preview</span><dl><div><dt>Current Base Rate</dt><dd>{base ? formatRateAmount(base.amount) : 'Not configured'}</dd></div><div><dt>{RATE_TYPE_LABELS[form.rateType]} Change</dt><dd>{form.pricingMethod === 'SET_PRICE' ? 'Set price' : formatRateChange(form) || '—'}</dd></div><div><dt>Estimated {RATE_TYPE_LABELS[form.rateType]}</dt><dd>{result > 0 ? formatRateAmount(result) : 'Complete pricing fields'}</dd></div></dl><small>This is a derived Rate preview, not an Offer discount.</small></aside> }
function RateCard({ rate, base, viewing, view, edit, toggle, onDelete, isDeleting, confirmDelete, cancelDelete }) {
  const amount = calculateDerivedRate(base?.amount, rate); const isBase = rate.rateType === 'BASE'
  return <article className="rate-record"><div className="rate-record-chips"><span className={`rate-state rate-state--${getRateStatus(rate).toLowerCase()}`}>{getRateStatus(rate)}</span><span>{RATE_TYPE_LABELS[rate.rateType]}</span></div><h3>{rate.name}</h3>{isBase ? <><strong className="rate-record-price">{formatRateAmount(rate.amount)} <small>/ night</small></strong><p>Default Rate · No expiry</p></> : <><div className="rate-derived-summary"><span>Base <strong>{base ? formatRateAmount(base.amount) : 'Not configured'}</strong></span><b>{rate.pricingMethod === 'SET_PRICE' ? '→' : formatRateChange(rate)}</b><span>Effective <strong>{amount > 0 ? formatRateAmount(amount) : 'Unavailable'}</strong></span></div><p>{rate.rateType === 'WEEKEND' && `${(rate.applicableDays || []).map((day) => dayLabels[day]).join(' · ')} · `}{rate.validFrom}{rate.validTo ? ` – ${rate.validTo}` : ''}</p></>}{viewing && <div className="rate-record-details"><p><strong>Pricing Method:</strong> {isBase ? 'Default Price' : PRICING_METHOD_LABELS[rate.pricingMethod] || 'Set New Price'}</p>{rate.minimumStay && <p><strong>Minimum Stay:</strong> {rate.minimumStay} nights</p>}{rate.notes && <p>{rate.notes}</p>}</div>}
  {isDeleting ? (
    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '8px 10px', marginTop: '8px' }}>
      <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#9f1239' }}>Are you sure you want to permanently delete this rate?</p>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" onClick={confirmDelete} style={{ background: '#e11d48', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>Confirm Delete</button>
        <button type="button" onClick={cancelDelete} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  ) : (
    <div className="rate-record-actions"><button type="button" onClick={view}><Eye size={14} />View</button><button type="button" onClick={edit}><Pencil size={14} />Edit</button><button type="button" onClick={toggle}>{rate.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button><button type="button" onClick={onDelete} style={{ color: '#dc2626' }}><Trash2 size={14} />Delete</button></div>
  )}
  </article>
}
