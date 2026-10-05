import luxuryEscapesImage from '../assets/images/home/collections/luxury-escapes.png'
import coastalGetawaysImage from '../assets/images/home/collections/coastal-getaways.png'
import heritageStaysImage from '../assets/images/home/collections/heritage-stays.png'
import villasAndNatureImage from '../assets/images/home/collections/villas-and-nature.png'
import familyHolidaysImage from '../assets/images/home/collections/family-holidays.png'
import cityBreaksImage from '../assets/images/home/collections/city-breaks.png'

const stayCollections = [
  { id: 'luxury-escapes', slug: 'luxury-escapes', title: 'Luxury Escapes', shortDescription: 'Premium hotels and unforgettable luxury experiences.', iconKey: 'GEM', coverImage: luxuryEscapesImage, displayOrder: 1, status: 'ACTIVE', showOnHome: true },
  { id: 'coastal-getaways', slug: 'coastal-getaways', title: 'Coastal Getaways', shortDescription: 'Relaxing stays beside Sri Lanka’s beautiful coastline.', iconKey: 'WAVES', coverImage: coastalGetawaysImage, displayOrder: 2, status: 'ACTIVE', showOnHome: true },
  { id: 'heritage-stays', slug: 'heritage-stays', title: 'Heritage Stays', shortDescription: 'Historic hotels inspired by Sri Lankan culture and heritage.', iconKey: 'LANDMARK', coverImage: heritageStaysImage, displayOrder: 3, status: 'ACTIVE', showOnHome: true },
  { id: 'villas-and-nature', slug: 'villas-and-nature', title: 'Villas & Nature', shortDescription: 'Peaceful villas surrounded by forests, hills, and nature.', iconKey: 'TREES', coverImage: villasAndNatureImage, displayOrder: 4, status: 'ACTIVE', showOnHome: true },
  { id: 'family-holidays', slug: 'family-holidays', title: 'Family Holidays', shortDescription: 'Comfortable stays and enjoyable experiences for families.', iconKey: 'FAMILY', coverImage: familyHolidaysImage, displayOrder: 5, status: 'ACTIVE', showOnHome: true },
  { id: 'city-breaks', slug: 'city-breaks', title: 'City Breaks', shortDescription: 'Modern hotels close to city attractions and business areas.', iconKey: 'CITY', coverImage: cityBreaksImage, displayOrder: 6, status: 'ACTIVE', showOnHome: true },
]

export const initialHotelCollectionIds = Object.freeze({
  101: ['luxury-escapes', 'city-breaks'],
  102: ['luxury-escapes', 'city-breaks'],
  201: ['coastal-getaways', 'family-holidays'],
  202: ['coastal-getaways', 'family-holidays'],
  301: ['luxury-escapes', 'heritage-stays'],
  302: ['luxury-escapes', 'coastal-getaways', 'family-holidays'],
  401: ['luxury-escapes', 'villas-and-nature'],
  402: ['villas-and-nature', 'family-holidays'],
  501: ['luxury-escapes', 'villas-and-nature'],
  502: ['villas-and-nature'],
  601: ['villas-and-nature', 'family-holidays'],
  602: ['villas-and-nature', 'family-holidays'],
})

export default stayCollections
