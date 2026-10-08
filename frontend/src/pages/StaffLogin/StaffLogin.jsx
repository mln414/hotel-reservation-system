import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import logo from '../../assets/images/lankastay-logo.png'
import staffImage from '../../assets/images/home/hero/galle-ocean-resort.png'
import { STAFF_LOGIN_DESTINATIONS } from '../../constants/staffAccess.js'
import useAuth from '../../context/useAuth.js'
import { isValidEmail } from '../../utils/authValidation.js'
import './StaffLogin.css'

function StaffLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const clearError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setStatus('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const nextErrors = {}

    if (!trimmedEmail) nextErrors.email = 'Email address is required.'
    else if (!isValidEmail(trimmedEmail)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus('Please review the highlighted fields.')
      return
    }

    setSubmitting(true)
    try {
      const result = await login({ email: trimmedEmail, password })
      setPassword('')
      if (result.status === 'PASSWORD_CHANGE_REQUIRED') {
        navigate('/staff/change-password', { replace: true })
        return
      }
      const requested = location.state?.from?.pathname
      navigate(requested?.startsWith('/management/') ? requested : STAFF_LOGIN_DESTINATIONS[result.user.role] || '/management/dashboard', { replace: true })
    } catch (error) {
      if (error.status === 401) setStatus('Invalid email or password.')
      else if (error.status === 429) setStatus(error.message)
      else if (error.status === 0) setStatus('The browser could not reach the sign-in API. Confirm the frontend is running at http://localhost:5174 and try again.')
      else setStatus(error.message || `Sign in failed with HTTP ${error.status}.`)
    } finally { setSubmitting(false) }
  }

  return (
    <main className="staff-login-page">
      <section className="staff-login-card" aria-labelledby="staff-login-title">
        <div className="staff-login-visual">
          <img src={staffImage} alt="LankaStay coastal hotel" />
          <div className="staff-login-visual-content">
            <Link className="staff-login-brand" to="/" aria-label="LankaStay home">
              <img src={logo} alt="" />
              <span><strong>LankaStay</strong><small>Management Portal</small></span>
            </Link>
            <div className="staff-login-message">
              <span><ShieldCheck aria-hidden="true" size={16} /> Authorized staff access</span>
              <h2>Manage every stay<br />with confidence.</h2>
              <p>A focused workspace for LankaStay property and reservation operations.</p>
            </div>
          </div>
        </div>

        <div className="staff-login-form-panel">
          <Link className="staff-login-back" to="/"><ArrowLeft aria-hidden="true" size={16} />Back to LankaStay</Link>
          <div className="staff-login-form-wrap">
            <header className="staff-login-header">
              <span>Management Portal</span>
              <h1 id="staff-login-title">Staff Sign In</h1>
              <p>Access the LankaStay management portal using your authorized staff account.</p>
            </header>

            <form className="staff-login-form" noValidate onSubmit={handleSubmit}>
              <div className="staff-login-field">
                <label htmlFor="staff-email">Email Address <span aria-hidden="true">*</span></label>
                <div className="staff-login-input">
                  <Mail aria-hidden="true" size={18} />
                  <input id="staff-email" type="email" autoComplete="email" placeholder="staff@lankastay.com" value={email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'staff-email-error' : undefined} onChange={(event) => { setEmail(event.target.value); clearError('email') }} />
                </div>
                {errors.email && <small id="staff-email-error" role="alert">{errors.email}</small>}
              </div>

              <div className="staff-login-field">
                <label htmlFor="staff-password">Password <span aria-hidden="true">*</span></label>
                <div className="staff-login-input">
                  <LockKeyhole aria-hidden="true" size={18} />
                  <input id="staff-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'staff-password-error' : undefined} onChange={(event) => { setPassword(event.target.value); clearError('password') }} />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}</button>
                </div>
                {errors.password && <small id="staff-password-error" role="alert">{errors.password}</small>}
              </div>

              <div className="staff-login-options">
                <span>Secure staff session</span>
                <Link to="/staff/forgot-password">Forgot Password?</Link>
              </div>

              <button className="staff-login-submit" type="submit" disabled={submitting}><LogIn aria-hidden="true" size={18} />{submitting ? 'Signing In...' : 'Sign In'}</button>
              {status && <p className="staff-login-status" role="alert" aria-live="polite">{status}</p>}
            </form>

            <p className="staff-login-help">Staff accounts are issued by authorized LankaStay management.</p>

          </div>
        </div>
      </section>
    </main>
  )
}

export default StaffLogin
