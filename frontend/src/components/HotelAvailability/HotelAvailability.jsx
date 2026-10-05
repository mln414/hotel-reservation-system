import { BadgeCheck, CalendarCheck, CircleCheckBig, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import useRates from '../../context/useRates.js'
import useReservations from '../../context/useReservations.js'
import useRooms from '../../context/useRooms.js'
import { formatRateAmount } from '../../utils/rateFormatting.js'
import CalendarPicker from '../SearchBar/CalendarPicker.jsx'
import GuestSelect from '../SearchBar/GuestSelect.jsx'
import '../SearchBar/SearchBar.css'
import './HotelAvailability.css'

const options = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => ({ value: String(from + index), label: String(from + index) }))
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const nextDay = (value) => { const date = value ? new Date(`${value}T12:00:00`) : new Date(); date.setDate(date.getDate() + 1); return localDate(date) }

export default function HotelAvailability({ hotel, initialValues = {} }) {
  const formRef = useRef(null)
  const [, setParams] = useSearchParams()
  const { getActiveRoomTypesByHotelId } = useRooms()
  const { getCurrentRoomRate } = useRates()
  const { checkReservationAvailabilityRemote } = useReservations()
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || '')
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || '')
  const [adults, setAdults] = useState(String(initialValues.adults || 2))
  const [children, setChildren] = useState(String(initialValues.children || 0))
  const [rooms, setRooms] = useState(String(initialValues.requestedRooms || 1))
  const [openPicker, setOpenPicker] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [availableRooms, setAvailableRooms] = useState([])
  useEffect(() => { setCheckIn(initialValues.checkIn || ''); setCheckOut(initialValues.checkOut || ''); setAdults(String(initialValues.adults || 2)); setChildren(String(initialValues.children || 0)); setRooms(String(initialValues.requestedRooms || 1)) }, [initialValues.checkIn, initialValues.checkOut, initialValues.adults, initialValues.children, initialValues.requestedRooms])
  useEffect(() => { const close = (event) => { if (!formRef.current?.contains(event.target)) setOpenPicker(null) }; const escape = (event) => { if (event.key === 'Escape') setOpenPicker(null) }; document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape); return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape) } }, [])
  const submit = async (event) => {
    event.preventDefault(); setAvailableRooms([])
    if (!checkIn || !checkOut || checkIn < localDate() || checkOut <= checkIn) { setMessage({ type: 'error', text: 'Choose valid future check-in and check-out dates.' }); return }
    const guestCount = Number(adults) + Number(children); const quantity = Number(rooms)
    setMessage({ type: 'info', text: 'Checking live availability…' })
    const candidates = getActiveRoomTypesByHotelId(hotel.id)
    const availabilityResults = await Promise.all(candidates.map(async (room) => ({
      room,
      availability: await checkReservationAvailabilityRemote({ hotelId: hotel.id, roomId: room.id, checkIn, checkOut, quantity }),
    })))
    const matches = availabilityResults.map(({ room, availability }) => {
      const supportsGuests = Number(room.maxGuests ?? room.capacity ?? 0) * quantity >= guestCount
      const rate = getCurrentRoomRate(room.id, new Date(`${checkIn}T12:00:00`))
      return { room, availability, rate, available: Boolean(supportsGuests && availability?.available && rate) }
    }).filter((item) => item.available)
    const next = new URLSearchParams({ checkIn, checkOut, adults, children, rooms }); if (initialValues.offerId) next.set('offerId', initialValues.offerId); setParams(next, { replace: true }); setAvailableRooms(matches)
    setMessage(matches.length ? { type: 'success', text: `${matches.length} ${matches.length === 1 ? 'Room Type is' : 'Room Types are'} available for your stay.` } : { type: 'error', text: 'No Room Types can support this party with available physical inventory for these dates.' })
  }
  return <section className="hotel-availability-section" id="availability" aria-labelledby="hotel-availability-title"><div className="hotel-availability-heading"><span aria-hidden="true">3</span><div><h2 id="hotel-availability-title">Check Availability</h2><p>Live results use current Room Types, physical inventory, operational blocks and Reservations.</p></div></div><div className="hotel-availability-card"><form ref={formRef} className="hotel-availability-form" noValidate onSubmit={submit}><div className="hotel-availability-field"><label htmlFor="detail-check-in">Check In</label><CalendarPicker id="detail-check-in" name="checkIn" value={checkIn} minDate={localDate()} isOpen={openPicker === 'checkIn'} onChange={(value) => { setCheckIn(value); if (checkOut <= value) setCheckOut('') }} onToggle={(isOpen) => setOpenPicker(isOpen ? 'checkIn' : null)} /></div><div className="hotel-availability-field"><label htmlFor="detail-check-out">Check Out</label><CalendarPicker id="detail-check-out" name="checkOut" value={checkOut} minDate={nextDay(checkIn)} isOpen={openPicker === 'checkOut'} onChange={setCheckOut} onToggle={(isOpen) => setOpenPicker(isOpen ? 'checkOut' : null)} /></div><div className="hotel-availability-field"><label htmlFor="detail-adults">Adults</label><GuestSelect id="detail-adults" name="adults" value={adults} options={options(1, 6)} isOpen={openPicker === 'adults'} onChange={setAdults} onToggle={(isOpen) => setOpenPicker(isOpen ? 'adults' : null)} /></div><div className="hotel-availability-field"><label htmlFor="detail-children">Children</label><GuestSelect id="detail-children" name="children" value={children} options={options(0, 4)} isOpen={openPicker === 'children'} onChange={setChildren} onToggle={(isOpen) => setOpenPicker(isOpen ? 'children' : null)} /></div><div className="hotel-availability-field"><label htmlFor="detail-rooms">Rooms</label><GuestSelect id="detail-rooms" name="rooms" value={rooms} options={options(1, 5)} isOpen={openPicker === 'rooms'} onChange={setRooms} onToggle={(isOpen) => setOpenPicker(isOpen ? 'rooms' : null)} /></div><button className="hotel-availability-submit" type="submit"><CalendarCheck size={17} />Check Availability</button>{message.text && <p className={`hotel-availability-message hotel-availability-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}</form>{availableRooms.length > 0 && <div className="hotel-live-availability-results">{availableRooms.map(({ room, rate, availability }) => { const query = new URLSearchParams({ checkIn, checkOut, adults, children, rooms }); if (initialValues.offerId) query.set('offerId', initialValues.offerId); return <article key={room.id}><div><strong>{room.name}</strong><span>{formatRateAmount(rate.amount)} / night · {availability.message}</span></div><Link to={`/booking/${room.id}?${query.toString()}`}>Select Room</Link></article> })}</div>}<div className="hotel-availability-trust"><span><BadgeCheck size={16} />Shared live rates</span><span><CircleCheckBig size={16} />Physical inventory checked</span><span><ShieldCheck size={16} />Final availability rechecked at confirmation</span></div></div></section>
}
