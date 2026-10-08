import { Check, X } from 'lucide-react'
import useStayCollections from '../../context/useStayCollections.js'
import { getCollectionIcon } from '../../utils/collectionIcons.jsx'
import './StayCollectionSelector.css'

export default function StayCollectionSelector({ value = [], onChange, includeInactive = false, error }) {
  const { collections, activeCollections } = useStayCollections()
  const options = includeInactive ? collections : activeCollections
  const selected = new Set(value.map(String))
  const toggle = (id) => onChange(selected.has(String(id)) ? value.filter((item) => String(item) !== String(id)) : [...new Set([...value.map(String), String(id)])])
  return <div className="stay-collection-selector"><div className="stay-collection-options">{options.map((collection) => { const Icon = getCollectionIcon(collection.iconKey); const checked = selected.has(String(collection.id)); return <button key={collection.id} type="button" role="checkbox" aria-checked={checked} className={checked ? 'is-selected' : ''} onClick={() => toggle(collection.id)}><span className="stay-collection-icon"><Icon size={21} /></span><span><strong>{collection.title}</strong><small>{collection.shortDescription}</small>{collection.status !== 'ACTIVE' && <em>Inactive</em>}</span>{checked && <Check className="stay-collection-check" size={18} />}</button> })}</div>{error && <small className="stay-collection-error" role="alert">{error}</small>}{value.length > 0 && <div className="stay-collection-selected"><strong>Selected Collections</strong><div>{value.map((id) => { const collection = collections.find((item) => String(item.id) === String(id)); return collection ? <button type="button" key={id} onClick={() => toggle(id)}><Check size={13} />{collection.title}<X size={13} aria-label="Remove" /></button> : null })}</div></div>}</div>
}
