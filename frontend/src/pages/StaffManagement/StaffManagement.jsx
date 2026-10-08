import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Eye, KeyRound, Pencil, Plus, Search, ShieldCheck, UserRoundCheck, UserRoundX, AlertTriangle, Copy, Check } from 'lucide-react'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import ManagementSelect from '../../components/ManagementSelect/ManagementSelect.jsx'
import { MANAGEMENT_ROLES, USER_ROLES } from '../../constants/roles.js'
import useHotels from '../../context/useHotels.js'
import useManagementFeedback from '../../context/useManagementFeedback.js'
import useStaff from '../../context/useStaff.js'
import { STAFF_ROLE_LABELS, STAFF_STATUS, validateStaffAccess } from '../../utils/staffManagement.js'
import './StaffManagement.css'

const roleOptions = MANAGEMENT_ROLES.map((role) => ({ value: role, label: STAFF_ROLE_LABELS[role] }))
const provisionRoleOptions = roleOptions.filter((option) => option.value !== USER_ROLES.MANAGER)

const ALL_PERMISSIONS = [
  { key: 'DASHBOARD_VIEW', category: 'Dashboard', label: 'View Dashboard & Analytics', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'PROPERTY_VIEW', category: 'Property', label: 'View Property Content', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'PROPERTY_EDIT', category: 'Property', label: 'Edit Assigned Property Content', roles: ['MANAGER', 'HOTEL_STAFF'] },
  { key: 'PROPERTY_ACTIVATE', category: 'Property', label: 'Activate/Deactivate Listing', roles: ['MANAGER'] },
  { key: 'PROPERTY_DELETE', category: 'Property', label: 'Delete Hotel Listing', roles: ['MANAGER'] },
  { key: 'ROOMS_MANAGE', category: 'Rooms & Amenities', label: 'Manage Rooms & Amenities', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'RESERVATIONS_VIEW', category: 'Reservations', label: 'View Reservations & Search', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'RESERVATIONS_MANAGE', category: 'Reservations', label: 'Manage Bookings & Check-in', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'AVAILABILITY_MANAGE', category: 'Availability', label: 'Update Room Availability', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'RATES_MANAGE', category: 'Rates', label: 'Manage Rate Plans & Pricing', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'OFFERS_MANAGE', category: 'Offers', label: 'Create & Manage Offers', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'REVIEWS_MANAGE', category: 'Reviews', label: 'Moderate Guest Reviews', roles: ['MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST'] },
  { key: 'STAFF_MANAGE', category: 'Staff Management', label: 'Create & Manage Staff', roles: ['MANAGER'] },
]

function getRoleDefaults(role) {
  return ALL_PERMISSIONS.filter((p) => p.roles.includes(role)).map((p) => p.key)
}

function getRoleCeiling(role) {
  return ALL_PERMISSIONS.filter((p) => p.roles.includes(role)).map((p) => p.key)
}

function StaffDetailsModal({ member, hotelName, onClose, onManage }) {
  return (
    <ManagementDialog
      title={`${member.firstName || ''} ${member.lastName || member.name}`}
      description="Staff account details, employment position, and operational permissions."
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>Close</button>
          {member.role !== USER_ROLES.MANAGER && (
            <button type="button" className="primary" onClick={onManage}>
              <KeyRound size={16} /> Manage Access
            </button>
          )}
        </>
      }
    >
      <dl className="staff-detail-list">
        <div><dt>Full Name</dt><dd>{member.firstName || ''} {member.lastName || member.name}</dd></div>
        <div><dt>Work Email</dt><dd>{member.email}</dd></div>
        <div><dt>Phone</dt><dd>{member.phone || 'Not provided'}</dd></div>
        <div><dt>Job Title</dt><dd>{member.jobTitle || (member.role === USER_ROLES.MANAGER ? 'Portfolio Manager' : member.role)}</dd></div>
        <div><dt>Department</dt><dd>{member.department || 'Operations'}</dd></div>
        <div><dt>System Role</dt><dd>{STAFF_ROLE_LABELS[member.role] || member.role}</dd></div>
        <div><dt>Assigned Property</dt><dd>{hotelName}</dd></div>
        <div><dt>Account Status</dt><dd><span className={`staff-status staff-status--${(member.status || 'ACTIVE').toLowerCase()}`}>{member.status || 'ACTIVE'}</span></dd></div>
        <div><dt>Last Login</dt><dd>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString('en-GB') : 'No recorded logins'}</dd></div>
      </dl>
    </ManagementDialog>
  )
}

function ManageAccessModal({ member, hotels, onClose, onSaved, onGrant, onRequestRevoke }) {
  const [draft, setDraft] = useState(() => ({
    role: member.role,
    assignedHotelId: member.assignedHotelId ? String(member.assignedHotelId) : '',
    jobTitle: member.jobTitle || (member.role === USER_ROLES.MANAGER ? 'Portfolio Manager' : member.role),
    department: member.department || 'Operations',
    permissions: member.permissions || getRoleDefaults(member.role),
  }))

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmingRevoke, setConfirmingRevoke] = useState(false)
  const actionLocked = useRef(false)

  const allowedCeiling = useMemo(() => getRoleCeiling(draft.role), [draft.role])

  useEffect(() => {
    setDraft({
      role: member.role,
      assignedHotelId: member.assignedHotelId ? String(member.assignedHotelId) : '',
      jobTitle: member.jobTitle || (member.role === USER_ROLES.MANAGER ? 'Portfolio Manager' : member.role),
      department: member.department || 'Operations',
      permissions: member.permissions || getRoleDefaults(member.role),
    })
    setErrors({})
    setSaving(false)
    setConfirmingRevoke(false)
    actionLocked.current = false
  }, [member])

  const togglePermission = (permKey) => {
    if (!allowedCeiling.includes(permKey)) return // Strictly enforce ceiling
    setDraft((curr) => {
      const exists = curr.permissions.includes(permKey)
      const next = exists ? curr.permissions.filter((p) => p !== permKey) : [...curr.permissions, permKey]
      return { ...curr, permissions: next }
    })
  }

  const restoreDefaults = () => {
    setDraft((curr) => ({ ...curr, permissions: getRoleDefaults(curr.role) }))
  }

  const selectAllAllowed = () => {
    setDraft((curr) => ({ ...curr, permissions: getRoleCeiling(curr.role) }))
  }

  const save = async (event) => {
    event.preventDefault()
    if (actionLocked.current) return
    const nextErrors = validateStaffAccess(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    actionLocked.current = true
    setSaving(true)
    const result = await onSaved({
      role: draft.role,
      assignedHotelId: draft.assignedHotelId ? Number(draft.assignedHotelId) : null,
      jobTitle: draft.jobTitle,
      department: draft.department,
      permissions: draft.permissions,
    })
    if (result?.error) {
      setErrors({ submit: result.error })
      actionLocked.current = false
      setSaving(false)
    }
  }

  const grant = async () => {
    if (actionLocked.current) return
    actionLocked.current = true
    setSaving(true)
    const result = await onGrant({
      role: draft.role,
      assignedHotelId: draft.assignedHotelId ? Number(draft.assignedHotelId) : null,
      jobTitle: draft.jobTitle,
      department: draft.department,
      permissions: draft.permissions,
    })
    if (result?.error) {
      setErrors({ submit: result.error })
      actionLocked.current = false
      setSaving(false)
    }
  }

  if (confirmingRevoke) {
    const confirm = async () => {
      if (actionLocked.current) return
      actionLocked.current = true
      setSaving(true)
      const result = await onRequestRevoke()
      if (result?.error) {
        actionLocked.current = false
        setSaving(false)
        setConfirmingRevoke(false)
      }
    }
    return (
      <ManagementDialog
        danger
        title={`Disable access for ${member.firstName || member.name}?`}
        description="This employee account will be disabled and all active sessions immediately revoked."
        onClose={() => setConfirmingRevoke(false)}
        actions={
          <>
            <button type="button" disabled={saving} onClick={() => setConfirmingRevoke(false)}>Cancel</button>
            <button type="button" className="danger" disabled={saving} onClick={confirm}>
              {saving ? 'Disabling...' : 'Confirm Disable'}
            </button>
          </>
        }
      />
    )
  }

  return (
    <ManagementDialog
      title={`Manage Access - ${member.firstName || member.name}`}
      description={`Update role, property scope, and operational permissions for ${member.email}.`}
      onClose={onClose}
      actions={
        <>
          <button type="button" disabled={saving} onClick={onClose}>Cancel</button>
          {member.status === STAFF_STATUS.ACTIVE ? (
            <button type="button" className="danger" disabled={saving} onClick={() => setConfirmingRevoke(true)}>
              <UserRoundX size={16} /> Disable Access
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={grant}>
              <UserRoundCheck size={16} /> Enable Access
            </button>
          )}
          <button type="submit" form="staff-access-form" className="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id="staff-access-form" className="staff-access-form" noValidate onSubmit={save}>
        <div className="form-row-grid">
          <ManagementSelect
            label="System Role"
            required
            value={draft.role}
            options={roleOptions}
            onChange={(role) => {
              setDraft((curr) => ({
                ...curr,
                role,
                assignedHotelId: role === USER_ROLES.MANAGER ? '' : curr.assignedHotelId,
                permissions: getRoleDefaults(role),
              }))
              setErrors({})
            }}
            error={errors.role}
          />
          {draft.role !== USER_ROLES.MANAGER && (
            <ManagementSelect
              label="Assigned Property"
              required
              searchable
              value={draft.assignedHotelId}
              placeholder="Select a property"
              options={hotels.map((h) => ({ value: String(h.id), label: h.name, description: h.destination }))}
              onChange={(assignedHotelId) => {
                setDraft((curr) => ({ ...curr, assignedHotelId }))
                setErrors({})
              }}
              error={errors.assignedHotelId}
            />
          )}
        </div>

        <div className="form-row-grid">
          <label className="form-input-label">
            <span>Job Title *</span>
            <input
              type="text"
              value={draft.jobTitle}
              onChange={(e) => setDraft((curr) => ({ ...curr, jobTitle: e.target.value }))}
              placeholder="e.g. Front Desk Agent"
            />
          </label>
          <label className="form-input-label">
            <span>Department</span>
            <input
              type="text"
              value={draft.department}
              onChange={(e) => setDraft((curr) => ({ ...curr, department: e.target.value }))}
              placeholder="e.g. Guest Services"
            />
          </label>
        </div>

        <fieldset className="permissions-matrix-fieldset">
          <legend>
            <div className="matrix-legend-wrap">
              <span>Operational Permission Matrix</span>
              <div className="matrix-actions">
                <button type="button" onClick={restoreDefaults}>Restore Role Defaults</button>
                <button type="button" onClick={selectAllAllowed}>Select All Allowed</button>
              </div>
            </div>
          </legend>
          <p className="permissions-ceiling-note">
            Permissions are bounded by the role security ceiling. Non-manager roles cannot be granted system admin privileges.
          </p>

          <div className="permissions-matrix-grid">
            {ALL_PERMISSIONS.map((perm) => {
              const isAllowedByCeiling = allowedCeiling.includes(perm.key)
              const isChecked = draft.permissions.includes(perm.key) && isAllowedByCeiling

              return (
                <label
                  key={perm.key}
                  className={`perm-card ${!isAllowedByCeiling ? 'disabled-by-ceiling' : ''} ${isChecked ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!isAllowedByCeiling}
                    onChange={() => togglePermission(perm.key)}
                  />
                  <div>
                    <strong>{perm.label}</strong>
                    <small>{perm.category}</small>
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>

        {errors.submit && <p className="staff-access-error" role="alert">{errors.submit}</p>}
      </form>
    </ManagementDialog>
  )
}

function CreateStaffModal({ hotels, onClose, onCreate }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: 'Front Desk Agent',
    role: USER_ROLES.RECEPTIONIST,
    assignedHotelId: hotels[0] ? String(hotels[0].id) : '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.jobTitle.trim()) {
      setError('Please complete all required fields.')
      return
    }
    if (form.role !== USER_ROLES.MANAGER && !form.assignedHotelId) {
      setError('Assigned Property is required for property-scoped staff.')
      return
    }

    setSaving(true)
    try {
      await onCreate({
        ...form,
        assignedHotelId: form.assignedHotelId ? Number(form.assignedHotelId) : null,
        permissions: getRoleDefaults(form.role),
      })
    } catch (requestError) {
      setError(requestError.message || 'Creation failed')
      setSaving(false)
    }
  }

  return (
    <ManagementDialog
      title="Create Staff Account"
      description="Provision a new employee account. A cryptographically secure temporary password will be generated and shown ONCE."
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary" type="submit" form="create-staff-form" disabled={saving}>
            {saving ? 'Creating Account...' : 'Create Account'}
          </button>
        </>
      }
    >
      <form id="create-staff-form" className="staff-access-form" onSubmit={submit}>
        <div className="form-row-grid">
          <label className="form-input-label">
            <span>First Name *</span>
            <input
              maxLength="80"
              placeholder="e.g. Malan"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </label>
          <label className="form-input-label">
            <span>Last Name *</span>
            <input
              maxLength="80"
              placeholder="e.g. Balangoda"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </label>
        </div>

        <div className="form-row-grid">
          <label className="form-input-label">
            <span>Work Email *</span>
            <input
              type="email"
              maxLength="254"
              placeholder="malan@lankastay.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="form-input-label">
            <span>Phone Number</span>
            <input
              type="tel"
              placeholder="+94 77 123 4567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
        </div>

        <div className="form-row-grid">
          <label className="form-input-label">
            <span>Job Title *</span>
            <input
              maxLength="100"
              placeholder="e.g. Front Desk Agent"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              required
            />
          </label>
          <ManagementSelect
            label="System Role *"
            required
            value={form.role}
            options={provisionRoleOptions}
            onChange={(role) => setForm({
              ...form,
              role,
              jobTitle: role === 'RECEPTIONIST' ? 'Front Desk Agent' : 'Operations Executive'
            })}
          />
        </div>

        {form.role !== USER_ROLES.MANAGER && (
          <ManagementSelect
            label="Assigned LankaStay Property *"
            required
            searchable
            value={form.assignedHotelId}
            placeholder="Select Property"
            options={hotels.map((h) => ({ value: String(h.id), label: h.name, description: h.destination }))}
            onChange={(assignedHotelId) => setForm({ ...form, assignedHotelId })}
          />
        )}

        {error && <p className="staff-access-error" role="alert">{error}</p>}
      </form>
    </ManagementDialog>
  )
}

function AccountCreatedSuccessModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false)

  const copyDetails = () => {
    const text = `LankaStay Staff Access Details:\nEmail: ${credential.staff.email}\nTemporary Password: ${credential.temporaryPassword}\nNote: Change password on first sign in.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ManagementDialog
      title="✓ Staff Account Created"
      description="The account is ready. Provide these login details securely to the employee."
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={copyDetails}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Details!' : 'Copy Login Details'}
          </button>
          <button className="primary" type="button" onClick={onClose}>Done</button>
        </>
      }
    >
      <div className="temp-credential-card">
        <dl className="temp-detail-list">
          <div><dt>Employee Name</dt><dd>{credential.staff.firstName} {credential.staff.lastName}</dd></div>
          <div><dt>Work Email</dt><dd>{credential.staff.email}</dd></div>
          <div><dt>Job Title</dt><dd>{credential.staff.jobTitle}</dd></div>
          <div><dt>Role</dt><dd>{STAFF_ROLE_LABELS[credential.staff.role]}</dd></div>
          <div>
            <dt>One-Time Temporary Password</dt>
            <dd className="temp-password-box">
              <code>{credential.temporaryPassword}</code>
            </dd>
          </div>
        </dl>
        <div className="temp-warning-banner">
          <AlertTriangle size={18} />
          <span>This temporary password is displayed ONLY ONCE. The employee will be forced to create a permanent password upon first sign in.</span>
        </div>
      </div>
    </ManagementDialog>
  )
}

export default function StaffManagement() {
  const { staff, refreshStaff, getStaffById, updateStaffAccess, createStaff, resetStaffPassword, grantStaffAccess, revokeStaffAccess } = useStaff()
  const { hotels } = useHotels()
  const { notify } = useManagementFeedback()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [hotelFilter, setHotelFilter] = useState('ALL')

  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [credential, setCredential] = useState(null)

  const selectedStaff = selectedStaffId ? getStaffById(selectedStaffId) : null

  useEffect(() => {
    refreshStaff().catch((error) => notify(error.message, 'error'))
  }, [refreshStaff, notify])

  const visibleStaff = useMemo(() => {
    const term = query.trim().toLowerCase()
    return staff.filter((member) => {
      const matchRole = roleFilter === 'ALL' || member.role === roleFilter
      const matchStatus = statusFilter === 'ALL' || member.status === statusFilter
      const matchHotel = hotelFilter === 'ALL' || String(member.assignedHotelId) === String(hotelFilter)
      const fullName = `${member.firstName || ''} ${member.lastName || ''} ${member.name || ''}`.toLowerCase()
      const matchTerm = !term || fullName.includes(term) || member.email.toLowerCase().includes(term)
      return matchRole && matchStatus && matchHotel && matchTerm
    })
  }, [query, roleFilter, statusFilter, hotelFilter, staff])

  const activeCount = useMemo(() => staff.filter((s) => s.status === 'ACTIVE').length, [staff])
  const disabledCount = useMemo(() => staff.filter((s) => s.status === 'DISABLED' || s.status === 'LOCKED').length, [staff])
  const unassignedCount = useMemo(() => staff.filter((s) => s.role !== 'MANAGER' && !s.assignedHotelId).length, [staff])

  const close = () => { setDialog(null); setSelectedStaffId(null) }
  const open = (type, id) => { setSelectedStaffId(String(id)); setDialog(type) }

  const hotelName = (member) => {
    if (member.role === USER_ROLES.MANAGER) return 'All LankaStay Properties (Global)'
    const hotel = hotels.find((h) => String(h.id) === String(member.assignedHotelId))
    return hotel ? hotel.name : null
  }

  const saveAccess = async (updates) => {
    const result = await updateStaffAccess(selectedStaffId, updates)
    if (result.error) { notify(result.error, 'error'); return result }
    notify('Staff access updated successfully')
    close()
    return result
  }

  const grantAccess = async (updates) => {
    const updated = await updateStaffAccess(selectedStaffId, updates)
    if (updated.error) { notify(updated.error, 'error'); return updated }
    const result = await grantStaffAccess(selectedStaffId)
    if (result.error) { notify(result.error, 'error'); return result }
    notify('Staff account enabled successfully')
    close()
    return result
  }

  const revokeAccess = async () => {
    const result = await revokeStaffAccess(selectedStaffId)
    if (result.error) { notify(result.error, 'error'); return result }
    notify('Staff access disabled successfully')
    close()
    return result
  }

  const handleCreate = async (data) => {
    const result = await createStaff(data)
    setDialog(null)
    setCredential(result)
    notify('Staff account created. The temporary password is displayed once.')
  }

  const handleResetPassword = async (id, memberName) => {
    if (!window.confirm(`Reset temporary password for ${memberName}? All active sessions will be revoked.`)) return
    try {
      const result = await resetStaffPassword(id)
      setCredential(result)
      notify('New temporary password generated and active sessions revoked.')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  return (
    <section className="staff-management-page">
      <header className="staff-management-heading">
        <div>
          <span className="eyebrow">PEOPLE & ACCESS</span>
          <h1>Staff Management</h1>
          <p>Manage employee accounts, property assignments and role-based access.</p>
        </div>
        <button type="button" className="primary-gold-btn" onClick={() => setDialog('create')}>
          <Plus size={18} /> Create Staff
        </button>
      </header>

      {/* Top Metric Cards */}
      <div className="staff-metrics-row">
        <article className="metric-card active-card">
          <span className="label">Active Accounts</span>
          <strong className="value">{activeCount}</strong>
        </article>
        <article className="metric-card disabled-card">
          <span className="label">Disabled / Locked</span>
          <strong className="value">{disabledCount}</strong>
        </article>
        <article className="metric-card unassigned-card">
          <span className="label">Unassigned Property</span>
          <strong className="value">{unassignedCount}</strong>
        </article>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="staff-toolbar">
        <label className="search-wrap">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee name or work email..."
          />
        </label>

        <div className="filter-group">
          <ManagementSelect
            label="Role"
            value={roleFilter}
            options={[{ value: 'ALL', label: 'All Roles' }, ...roleOptions]}
            onChange={setRoleFilter}
          />
          <ManagementSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'DISABLED', label: 'Disabled' },
            ]}
            onChange={setStatusFilter}
          />
          <ManagementSelect
            label="Property"
            value={hotelFilter}
            options={[
              { value: 'ALL', label: 'All Properties' },
              ...hotels.map((h) => ({ value: String(h.id), label: h.name })),
            ]}
            onChange={setHotelFilter}
          />
        </div>
      </div>

      {/* Staff Cards List */}
      <div className="staff-list" aria-live="polite">
        {visibleStaff.length ? (
          visibleStaff.map((member) => {
            const hName = hotelName(member)
            const fullName = `${member.firstName || ''} ${member.lastName || member.name}`
            const initials = `${(member.firstName || member.name || 'S')[0]}${(member.lastName || 'U')[0]}`.toUpperCase()

            return (
              <article key={member.id} className={`staff-card ${member.status !== 'ACTIVE' ? 'is-disabled' : ''}`}>
                <div className="staff-avatar">{initials}</div>

                <div className="staff-identity">
                  <div className="name-status-row">
                    <h2>{fullName}</h2>
                    <span className={`staff-status staff-status--${(member.status || 'ACTIVE').toLowerCase()}`}>
                      {member.status || 'ACTIVE'}
                    </span>
                  </div>

                  <p className="email-text">{member.email}</p>

                  <div className="meta-tags">
                    <span className={`role-badge role-${member.role.toLowerCase()}`}>
                      <ShieldCheck size={14} /> {STAFF_ROLE_LABELS[member.role] || member.role}
                    </span>

                    {hName ? (
                      <span className="property-tag">
                        <Building2 size={14} /> {hName}
                      </span>
                    ) : (
                      <span className="unassigned-alert-tag">
                        <AlertTriangle size={14} /> Property assignment required
                      </span>
                    )}
                  </div>
                </div>

                <div className="staff-actions">
                  <button type="button" onClick={() => open('view', member.id)}>
                    <Eye size={16} /> View
                  </button>
                  {member.role !== USER_ROLES.MANAGER && (
                    <>
                      <button type="button" onClick={() => open('access', member.id)}>
                        <Pencil size={16} /> Manage Access
                      </button>
                      <button type="button" className="btn-reset-pass" onClick={() => handleResetPassword(member.id, fullName)}>
                        <KeyRound size={16} /> Reset Password
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="staff-empty">
            <h2>No staff accounts found</h2>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {dialog === 'create' && <CreateStaffModal hotels={hotels} onClose={close} onCreate={handleCreate} />}
      {selectedStaff && dialog === 'view' && (
        <StaffDetailsModal member={selectedStaff} hotelName={hotelName(selectedStaff) || 'Unassigned'} onClose={close} onManage={() => setDialog('access')} />
      )}
      {selectedStaff && dialog === 'access' && (
        <ManageAccessModal key={selectedStaff.id} member={selectedStaff} hotels={hotels} onClose={close} onSaved={saveAccess} onGrant={grantAccess} onRequestRevoke={revokeAccess} />
      )}
      {credential && <AccountCreatedSuccessModal credential={credential} onClose={() => setCredential(null)} />}
    </section>
  )
}
