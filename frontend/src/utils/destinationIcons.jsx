import { Building2, Compass, Landmark, Mountain, PawPrint, ShoppingBag, Sparkles, TreePine, Trees, UsersRound, Waves } from 'lucide-react'

const themeIcons = { URBAN: Building2, COAST: Waves, HERITAGE: Landmark, NATURE: Trees, HILLS: Mountain, ADVENTURE: Compass, WELLNESS: Sparkles }
const attractionIcons = { HERITAGE: Landmark, BEACH: Waves, NATURE: TreePine, WILDLIFE: PawPrint, VIEWPOINT: Mountain, RELIGIOUS: Landmark, MUSEUM: Building2, PARK: Trees, FAMILY: UsersRound, SHOPPING: ShoppingBag }
export function ThemeIcon({ themeKey, ...props }) { const Icon = themeIcons[themeKey] || Sparkles; return <Icon {...props} /> }
export function AttractionIcon({ type, ...props }) { const Icon = attractionIcons[type] || Landmark; return <Icon {...props} /> }
