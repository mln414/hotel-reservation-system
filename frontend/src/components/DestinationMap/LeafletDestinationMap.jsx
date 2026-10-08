import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { getActiveAttractions, hasCoordinates } from '../../utils/destinationDomain.js'

const centerIcon=L.icon({iconUrl:markerIcon,iconRetinaUrl:markerIcon2x,shadowUrl:markerShadow,iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]});const attractionIcon=L.divIcon({className:'destination-attraction-marker',html:'<span></span>',iconSize:[18,18],iconAnchor:[9,9]})
export default function LeafletDestinationMap({destination,className=''}){return <MapContainer center={[destination.latitude,destination.longitude]} zoom={12} scrollWheelZoom className={`destination-map ${className}`}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[destination.latitude,destination.longitude]} icon={centerIcon}><Popup><strong>{destination.name}</strong><br/>Destination centre</Popup></Marker>{getActiveAttractions(destination).filter(hasCoordinates).map((item)=><Marker key={item.id} position={[item.latitude,item.longitude]} icon={attractionIcon}><Popup><strong>{item.name}</strong><br/>{item.type}</Popup></Marker>)}</MapContainer>}
