import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const hotelIcon=L.icon({iconUrl:markerIcon,iconRetinaUrl:markerIcon2x,shadowUrl:markerShadow,iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]})
const attractionIcon=L.divIcon({className:'hotel-attraction-marker',html:'<span></span>',iconSize:[17,17],iconAnchor:[8,8]})
export default function HotelMap({hotel,attractions=[],destination}){return <MapContainer center={[hotel.latitude,hotel.longitude]} zoom={14} scrollWheelZoom className="hotel-location-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[hotel.latitude,hotel.longitude]} icon={hotelIcon}><Popup><strong>{hotel.name}</strong><br/>{hotel.address||`${destination?.name||'Destination unavailable'}, ${hotel.country}`}</Popup></Marker>{attractions.filter((item)=>Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))).map((item)=><Marker key={item.id} position={[item.latitude,item.longitude]} icon={attractionIcon}><Popup><strong>{item.name}</strong><br/>{item.type}</Popup></Marker>)}</MapContainer>}
