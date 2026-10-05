import { Component } from 'react'
import { Link, useLocation } from 'react-router'
import './AppErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, details) {
    console.error('LankaStay page render failed', error, details)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main className="app-error-state" role="alert">
      <span>LS</span>
      <h1>This page could not be displayed.</h1>
      <p>An unexpected page error occurred. You can safely return to Hotels and try again.</p>
      <div><Link to="/hotels">Back to Hotels</Link><button type="button" onClick={() => window.location.reload()}>Try Again</button></div>
    </main>
  }
}

export default function AppErrorBoundary({ children }) {
  const location = useLocation()
  return <ErrorBoundary key={`${location.pathname}${location.search}`}>{children}</ErrorBoundary>
}
