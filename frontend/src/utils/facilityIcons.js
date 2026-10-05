import { Car, CircleCheck, Coffee, Compass, Dumbbell, MapPin, Plane, Sparkles, Trees, Umbrella, Utensils, Waves, Wifi, Zap } from 'lucide-react'

export const facilityIconMap = {
  wifi: Wifi, pool: Waves, restaurant: Utensils, spa: Sparkles, beach: Umbrella,
  plane: Plane, car: Car, fitness: Dumbbell, zap: Zap, coffee: Coffee,
  'map-pin': MapPin, trees: Trees, compass: Compass,
}

export const facilityIconOptions = [
  ['wifi', 'Wi-Fi'], ['pool', 'Pool / Water'], ['restaurant', 'Dining'], ['spa', 'Wellness'],
  ['beach', 'Beach'], ['plane', 'Airport'], ['car', 'Parking'], ['fitness', 'Fitness'],
  ['zap', 'EV Charging'], ['coffee', 'Coffee'], ['map-pin', 'Location'], ['trees', 'Nature'], ['compass', 'Experience'],
]

const facilityNameIcons = {
  'free wi-fi': 'wifi', 'swimming pool': 'pool', restaurant: 'restaurant', spa: 'spa',
  'spa & wellness': 'spa', 'beach access': 'beach', 'airport transfer': 'plane',
  'free parking': 'car', 'fitness centre': 'fitness', breakfast: 'coffee', garden: 'trees',
  'sea view': 'pool', 'lagoon view': 'pool', 'mountain view': 'trees', 'nature view': 'trees',
  'safari access': 'compass', 'tea estate view': 'trees', 'heritage view': 'map-pin',
}
export function getFacilityIcon(iconKey) {
  const normalized = String(iconKey || '').trim().toLowerCase()
  return facilityIconMap[normalized] || facilityIconMap[facilityNameIcons[normalized]] || CircleCheck
}
