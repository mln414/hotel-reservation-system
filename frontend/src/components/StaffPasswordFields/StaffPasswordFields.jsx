import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

function PasswordField({ id, label, value, onChange, error, visible, onToggle, autoComplete }) {
  return (
    <div className="staff-auth-field">
      <label htmlFor={id}>{label} <span aria-hidden="true">*</span></label>
      <div className="staff-auth-input">
        <LockKeyhole aria-hidden="true" size={18} />
        <input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(event.target.value)} />
        <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible} onClick={onToggle}>{visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}</button>
      </div>
      {error && <small className="staff-auth-error" id={`${id}-error`} role="alert">{error}</small>}
    </div>
  )
}

export default PasswordField
