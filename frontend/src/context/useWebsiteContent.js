import { useContext } from 'react'
import WebsiteContentContext from './websiteContentContext.js'
export default function useWebsiteContent() { const value = useContext(WebsiteContentContext); if (!value) throw new Error('useWebsiteContent must be used within WebsiteContentProvider'); return value }
