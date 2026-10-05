import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import './DestinationStatusModal.css'

function DestinationStatusModal({ destination, hotelCount = 0, onCancel, onConfirm }) {
  useEffect(() => {
    if (!destination) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [destination, onCancel])

  if (!destination) return null
  return (
    <div className="destination-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="destination-status-modal" role="dialog" aria-modal="true" aria-labelledby="destination-deactivate-title">
        <button className="destination-modal-close" type="button" aria-label="Close dialog" onClick={onCancel}><X aria-hidden="true" size={18} /></button>
        <span className="destination-modal-icon"><AlertTriangle aria-hidden="true" size={23} /></span>
        <h2 id="destination-deactivate-title">Deactivate Destination?</h2>
        <p>This Destination will be hidden from customer discovery and new Hotel selection. Existing Hotel relationships and historical records will be retained.</p>
        <strong>{destination.name}</strong>
        {hotelCount > 0 && <p>{hotelCount} linked {hotelCount === 1 ? 'Hotel' : 'Hotels'} will remain assigned and will not be deleted.</p>}
        <div><button type="button" onClick={onCancel}>Keep Active</button><button type="button" onClick={onConfirm}>Deactivate Destination</button></div>
      </section>
    </div>
  )
}

export default DestinationStatusModal
