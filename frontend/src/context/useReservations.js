import { useContext } from 'react'
import ReservationsContext from './reservationsContext.js'
export default function useReservations() { const value = useContext(ReservationsContext); if (!value) throw new Error('useReservations must be used inside ReservationsProvider'); return value }
