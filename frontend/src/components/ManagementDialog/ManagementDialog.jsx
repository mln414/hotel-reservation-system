import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import './ManagementDialog.css'

export default function ManagementDialog({ title, description, children, actions, onClose, danger = false }) {
  const dialog = useRef(null)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    dialog.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape) }
  }, [onClose])
  return <div className="management-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section ref={dialog} tabIndex="-1" className={`management-dialog${danger ? ' management-dialog--danger' : ''}`} role="dialog" aria-modal="true" aria-labelledby="management-dialog-title"><button className="management-dialog-close" type="button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button><h2 id="management-dialog-title">{title}</h2>{description && <p>{description}</p>}{children}<div className="management-dialog-actions">{actions}</div></section></div>
}
