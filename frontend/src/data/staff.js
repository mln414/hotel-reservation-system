import { USER_ROLES } from '../constants/roles.js'

const initialStaff = [
  {
    id: 'staff-001',
    name: 'Nadeesha Perera',
    email: 'nadeesha.perera@lankastay.lk',
    role: USER_ROLES.MANAGER,
    assignedHotelId: null,
    status: 'ACTIVE',
    updatedAt: null,
  },
  {
    id: 'staff-002',
    name: 'Kasun Fernando',
    email: 'kasun.fernando@lankastay.lk',
    role: USER_ROLES.HOTEL_STAFF,
    assignedHotelId: 302,
    status: 'ACTIVE',
    updatedAt: null,
  },
  {
    id: 'staff-003',
    name: 'Tharushi Silva',
    email: 'tharushi.silva@lankastay.lk',
    role: USER_ROLES.RECEPTIONIST,
    assignedHotelId: 301,
    status: 'INACTIVE',
    updatedAt: null,
  },
]

export default initialStaff
