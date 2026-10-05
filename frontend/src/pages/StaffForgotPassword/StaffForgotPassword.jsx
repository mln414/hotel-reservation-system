import { KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import StaffAuthShell from '../../components/StaffAuthShell/StaffAuthShell.jsx'
import { authApi } from '../../services/authApi.js'
import { isValidEmail } from '../../utils/authValidation.js'

function StaffForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    if (!isValidEmail(email.trim())) { setError('Enter a valid work email address.'); return }
    setSubmitting(true); setError(''); setStatus('')
    try {
      const response = await authApi.forgotPassword({ email: email.trim() })
      setStatus(response.message)
    } catch (failure) { setError(failure.message || 'Could not request a reset. Please try again later.') }
    finally { setSubmitting(false) }
  }
  return <StaffAuthShell eyebrow="Account Recovery" title="Forgot Password"
    description="Enter your work email. Use the link sent to your inbox to reset your password.">
    <form className="staff-auth-form" noValidate onSubmit={submit}>
      <div className="staff-auth-field"><label htmlFor="staff-recovery-email">Work Email Address *</label>
        <div className="staff-auth-input"><Mail size={18} aria-hidden="true" />
          <input id="staff-recovery-email" type="email" autoComplete="email" value={email}
            aria-invalid={Boolean(error)} onChange={(event) => { setEmail(event.target.value); setError(''); setStatus('') }} />
        </div>
      </div>
      <button className="staff-auth-submit" type="submit" disabled={submitting}><KeyRound size={17} />
        {submitting ? 'Sending...' : 'Send Reset Instructions'}</button>
      {error && <p className="staff-auth-status staff-auth-status--error" role="alert">{error}</p>}
      {status && <p className="staff-auth-status staff-auth-status--success" role="status">{status}</p>}
    </form>
  </StaffAuthShell>
}
export default StaffForgotPassword
