import { Bath, Coffee, LampDesk, Lock, Refrigerator, Snowflake, Sofa, Tv, Wifi, Wind, PanelsTopLeft, Sparkles } from 'lucide-react'
const registry={wifi:Wifi,snowflake:Snowflake,tv:Tv,refrigerator:Refrigerator,lock:Lock,coffee:Coffee,wind:Wind,'panels-top-left':PanelsTopLeft,bath:Bath,'lamp-desk':LampDesk,sofa:Sofa}
export function RoomAmenityIcon({iconKey,...props}){const Icon=registry[iconKey]||Sparkles;return <Icon {...props}/>}
