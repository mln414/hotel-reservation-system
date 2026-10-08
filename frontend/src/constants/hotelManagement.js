export const HOTEL_SETUP_STATUS = Object.freeze({
  PENDING: 'SETUP_PENDING',
  COMPLETE: 'SETUP_COMPLETE',
})

export const HOTEL_PUBLICATION_STATUS = Object.freeze({
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
})

export const HOTEL_SETUP_SECTIONS = Object.freeze([
  { key: 'basic', label: 'Basic Information', required: true },
  { key: 'destination', label: 'Active Destination', required: true },
  { key: 'contact', label: 'Contact Information', required: true },
  { key: 'about', label: 'About', required: true },
  { key: 'location', label: 'Location', required: true },
  { key: 'facilities', label: 'Facilities', required: true },
  { key: 'accommodation', label: 'Active Accommodation', required: true },
  { key: 'rate', label: 'Valid Active Room Type Rate', required: true },
  { key: 'gallery', label: 'Gallery / Cover Image', required: true },
  { key: 'policies', label: 'Policies', required: true },
  { key: 'dining', label: 'Dining', required: false },
  { key: 'experiences', label: 'Experiences', required: false },
  { key: 'offers', label: 'Offers', required: false },
  { key: 'video', label: 'Hotel Video', required: false },
])

export const HOTEL_CATEGORIES = Object.freeze([
  'City Hotel',
  'Boutique Hotel',
  'Ocean View Hotel',
  'Lagoon Resort',
  'Beach Resort',
  'Heritage Hotel',
  'Coastal Resort',
  'Villa',
  'Nature Resort',
  'Hill Country Hotel',
  'Tea Estate Hotel',
  'Wildlife Resort',
  'Wildlife Lodge',
  'Safari Lodge',
])

export const HOTEL_PROPERTY_TYPES = HOTEL_CATEGORIES
