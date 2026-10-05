import { createContext } from 'react'

export const ROOM_TYPE_STATUS = Object.freeze({ ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' })
export const PHYSICAL_ROOM_STATUS = Object.freeze({ AVAILABLE: 'AVAILABLE', BLOCKED: 'BLOCKED', MAINTENANCE: 'MAINTENANCE', INACTIVE: 'INACTIVE' })

const RoomsContext = createContext(null)

export default RoomsContext
