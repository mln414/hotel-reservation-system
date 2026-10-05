import { useState, useEffect } from 'react'
import { Building2, CheckCircle2, Mail, ShieldCheck, User, Save, Lock } from 'lucide-react'
import useAuth from '../../context/useAuth.js'
import useHotels from '../../context/useHotels.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import { STAFF_ROLE_LABELS } from '../../utils/staffManagement.js'
import './StaffProfile.css'

export default function StaffProfile() {
  const { user, refreshUser } = useAuth()
  const { hotels } = useHotels()
  const { notify } = useManagementFeedback()

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const assignedHotelName = user?.role === 'MANAGER'
    ? 'All LankaStay Properties (Global Portfolio Scope)'
    : hotels.find((h) => String(h.id) === String(user?.assignedHotelId))?.name || 'No property assigned'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      notify('First name and last name are required', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/management/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to update profile')
      }

      await refreshUser()
      notify('Profile updated successfully!', 'success')
    } catch (err) {
      notify(err.message || 'Profile update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const initials = `${formData.firstName[0] || 'S'}${formData.lastName[0] || 'U'}`.toUpperCase()

  return (
    <div className="staff-profile-container">
      <header className="staff-profile-header">
        <span className="eyebrow">MY PROFILE</span>
        <h1>Account & Employment Details</h1>
        <p>Manage your personal contact details and view your operational assignment scope.</p>
      </header>

      <div className="staff-profile-layout">
        {/* Left Column: Identity Summary Card */}
        <aside className="profile-identity-card">
          <div className="profile-avatar">{initials}</div>
          <h2>{formData.firstName} {formData.lastName}</h2>
          <p className="profile-job-title">{user?.jobTitle || (user?.role === 'MANAGER' ? 'Portfolio Manager' : user?.role)}</p>
          <span className={`profile-role-badge role-${user?.role?.toLowerCase()}`}>
            <ShieldCheck size={14} /> {STAFF_ROLE_LABELS[user?.role] || user?.role}
          </span>

          <hr className="profile-divider" />

          <ul className="profile-meta-list">
            <li>
              <Mail size={16} />
              <div>
                <small>Work Email</small>
                <strong>{user?.email}</strong>
              </div>
            </li>
            <li>
              <Building2 size={16} />
              <div>
                <small>Property Scope</small>
                <strong>{assignedHotelName}</strong>
              </div>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <div>
                <small>Account Status</small>
                <span className="status-tag active">ACTIVE</span>
              </div>
            </li>
          </ul>
        </aside>

        {/* Right Column: Editable Profile & Managed Permissions */}
        <main className="profile-details-panel">
          <form className="profile-form" onSubmit={handleSubmit}>
            <section className="form-section">
              <div className="section-title">
                <User size={18} />
                <div>
                  <h3>Personal Information</h3>
                  <p>Editable contact information associated with your LankaStay account.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="firstName">First Name <span className="req">*</span></label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="lastName">Last Name <span className="req">*</span></label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </section>

            <section className="form-section read-only-section">
              <div className="section-title">
                <Lock size={18} />
                <div>
                  <h3>System Authorization & Scope</h3>
                  <p>Administrative properties managed directly by Portfolio Management.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label>Work Email</label>
                  <input type="text" value={user?.email || ''} disabled />
                  <small className="managed-hint"><Lock size={12} /> Managed by Portfolio Manager</small>
                </div>

                <div className="form-field">
                  <label>System Role</label>
                  <input type="text" value={STAFF_ROLE_LABELS[user?.role] || user?.role || ''} disabled />
                  <small className="managed-hint"><Lock size={12} /> Managed by Portfolio Manager</small>
                </div>

                <div className="form-field full-width">
                  <label>Assigned LankaStay Property</label>
                  <input type="text" value={assignedHotelName} disabled />
                  <small className="managed-hint"><Lock size={12} /> Managed by Portfolio Manager</small>
                </div>
              </div>
            </section>
          </form>
        </main>
      </div>
    </div>
  )
}
