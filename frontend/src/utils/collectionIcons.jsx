import { Building2, Gem, Landmark, Sparkles, Trees, UsersRound, Waves } from 'lucide-react'

export const COLLECTION_ICON_OPTIONS = [
  { value: 'GEM', label: 'Gem', icon: Gem },
  { value: 'WAVES', label: 'Waves', icon: Waves },
  { value: 'LANDMARK', label: 'Landmark', icon: Landmark },
  { value: 'TREES', label: 'Trees', icon: Trees },
  { value: 'FAMILY', label: 'Family', icon: UsersRound },
  { value: 'CITY', label: 'City', icon: Building2 },
  { value: 'SPARKLES', label: 'Wellness', icon: Sparkles },
]

export const COLLECTION_ICON_MAP = Object.fromEntries(COLLECTION_ICON_OPTIONS.map((item) => [item.value, item.icon]))
export const getCollectionIcon = (iconKey) => COLLECTION_ICON_MAP[iconKey] || Sparkles
