import { RotateCcwKey } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import StaffAuthShell from '../../components/StaffAuthShell/StaffAuthShell.jsx'
import PasswordField from '../../components/StaffPasswordFields/StaffPasswordFields.jsx'
import { authApi } from '../../services/authApi.js'
import { getStaffPasswordError, validatePasswordConfirmation } from '../../utils/staffPasswordValidation.js'

function StaffResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visible, setVisible] = useState({ newPassword: false, confirmPassword: false })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  const change = (field, setter) => (value) => {
    setter(value)
    setErrors((current) => ({ ...current, [field]: '' }))
    setStatus('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!token) {
      setErrors({ newPassword: 'Missing or invalid password reset token.' })
      return
    }
    const nextErrors = {
      newPassword: getStaffPasswordError(newPassword),
      confirmPassword: validatePasswordConfirmation(newPassword, confirmPassword),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    authApi.resetPassword({ token, newPassword, confirmNewPassword: confirmPassword })
      .then((res) => {
        setStatus(res.message || 'Password reset successfully. Redirecting to staff login...')
        setTimeout(() => {
          window.location.href = '/staff/login'
        }, 1500)
      })
      .catch((err) => {
        const msg = err.body?.message || err.message || 'Could not reset password.'
        setErrors({ newPassword: msg })
      })
  }

  return (
    <StaffAuthShell eyebrow="Account Recovery" title="Reset Your Password" description="Create a secure new password for your staff account.">
      <form className="staff-auth-form" noValidate onSubmit={handleSubmit}>
        <PasswordField id="reset-new-password" label="New Password" value={newPassword} onChange={change('newPassword', setNewPassword)} error={errors.newPassword} visible={visible.newPassword} onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))} autoComplete="new-password" />
        <PasswordField id="reset-confirm-password" label="Confirm New Password" value={confirmPassword} onChange={change('confirmPassword', setConfirmPassword)} error={errors.confirmPassword} visible={visible.confirmPassword} onToggle={() => setVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))} autoComplete="new-password" />
        <p className="staff-auth-note">Reset links expire after 30 minutes and can be used only once.</p>
        <button className="staff-auth-submit" type="submit"><RotateCcwKey aria-hidden="true" size={18} />Reset Password</button>
        {status && <p className="staff-auth-status" role="status" aria-live="polite">{status}</p>}
      </form>
    </StaffAuthShell>
  )
}

export default StaffResetPassword
