import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import './CustomerSelect.css'

export default function CustomerSelect({ label, value, options = [], onChange, searchable = false }) {
  const id = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(value)))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const visible = options.filter((option) => !query || `${option.label} ${option.description || ''}`.toLowerCase().includes(query.toLowerCase()))
  const selected = options[selectedIndex]

  useEffect(() => {
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (option) => { onChange?.(option.value); setOpen(false); setQuery(''); triggerRef.current?.focus() }
  const keyDown = (event) => {
    if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true)
      setActiveIndex((current) => event.key === 'ArrowDown' ? (current + 1) % Math.max(1, visible.length) : (current - 1 + Math.max(1, visible.length)) % Math.max(1, visible.length))
    }
    if (event.key === 'Enter' && open && visible[activeIndex]) { event.preventDefault(); choose(visible[activeIndex]) }
  }

  return <div className="customer-select" ref={rootRef}><span id={`${id}-label`}>{label}</span><button ref={triggerRef} type="button" className="customer-select-trigger" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} onClick={() => { setOpen((current) => !current); setActiveIndex(selectedIndex) }} onKeyDown={keyDown}><strong>{selected?.label || 'Select'}</strong><ChevronDown size={17} /></button>{open && <div className="customer-select-popover">{searchable && <div className="customer-select-search"><Search size={16} /><input autoFocus aria-label={`Search ${label}`} value={query} placeholder="Search" onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }} onKeyDown={keyDown} /></div>}<div id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} tabIndex="-1">{visible.map((option, index) => <button type="button" role="option" aria-selected={String(option.value) === String(value)} className={index === activeIndex ? 'active' : ''} key={option.value} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}><span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>{String(option.value) === String(value) && <Check size={16} />}</button>)}</div></div>}</div>
}
