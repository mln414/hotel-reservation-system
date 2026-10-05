// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import ManagementSidebar from '../../components/ManagementSidebar/ManagementSidebar.jsx'
import ManagementTopbar from '../../components/ManagementTopbar/ManagementTopbar.jsx'
import useAuth from '../../context/useAuth.js'
import './ManagementLayout.css'

function ManagementLayout() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('lankastay:sidebar-collapsed') === 'true'
  })

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('lankastay:sidebar-collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isSidebarOpen])

  return (
    <div className="management-layout">
      <ManagementSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentRole={user?.role}
        onLogout={logout}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className={`management-layout-content${isCollapsed ? ' is-sidebar-collapsed' : ''}`}>
        <ManagementTopbar isMenuOpen={isSidebarOpen} onMenuOpen={() => setIsSidebarOpen(true)} user={user} />
        <main className="management-main"><Outlet /></main>
      </div>
    </div>
  )
}

export default ManagementLayout
