import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import PasswordField from '../../components/StaffPasswordFields/StaffPasswordFields.jsx'
import { getStaffPasswordError, validatePasswordConfirmation } from '../../utils/staffPasswordValidation.js'
import useAuth from '../../context/useAuth.js'
import './ManagementAccountSecurity.css'

function ManagementAccountSecurity() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const change = (field, setter) => (value) => {
    setter(value)
    setErrors((current) => ({ ...current, [field]: '' }))
    setStatus('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {
      currentPassword: currentPassword ? '' : 'Current password is required.',
      newPassword: getStaffPasswordError(newPassword),
      confirmPassword: validatePasswordConfirmation(newPassword, confirmPassword),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus('Password changed successfully.')
    } catch (error) {
      setStatus(error.message)
    } finally { setSubmitting(false) }
  }

  return (
    <section className="management-security-page">
      <header><span>Account Security</span><h1>Change Password</h1><p>Update the password for your authorized staff account.</p></header>
      <article className="management-security-card">
        <div className="management-security-intro"><span><ShieldCheck aria-hidden="true" size={24} /></span><div><h2>Password security</h2><p>Your current password is verified by the secure backend and passwords are never stored or logged by React.</p></div></div>
        <form className="staff-auth-form" noValidate onSubmit={handleSubmit}>
          <PasswordField id="security-current-password" label="Current Password" value={currentPassword} onChange={change('currentPassword', setCurrentPassword)} error={errors.currentPassword} visible={visible.current} onToggle={() => setVisible((value) => ({ ...value, current: !value.current }))} autoComplete="current-password" />
          <PasswordField id="security-new-password" label="New Password" value={newPassword} onChange={change('newPassword', setNewPassword)} error={errors.newPassword} visible={visible.next} onToggle={() => setVisible((value) => ({ ...value, next: !value.next }))} autoComplete="new-password" />
          <PasswordField id="security-confirm-password" label="Confirm New Password" value={confirmPassword} onChange={change('confirmPassword', setConfirmPassword)} error={errors.confirmPassword} visible={visible.confirm} onToggle={() => setVisible((value) => ({ ...value, confirm: !value.confirm }))} autoComplete="new-password" />
          <p className="staff-auth-note">Use 12 to 128 characters. Spaces and symbols are supported.</p>
          <button className="staff-auth-submit" type="submit" disabled={submitting}>{submitting ? 'Changing...' : 'Change Password'}</button>
          {status && <p className="staff-auth-status" role="status" aria-live="polite">{status}</p>}
        </form>
      </article>
    </section>
  )
}

export default ManagementAccountSecurity
