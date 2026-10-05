import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { hasCoordinates } from '../../utils/destinationDomain.js'

const icon=L.icon({iconUrl:markerIcon,iconRetinaUrl:markerIcon2x,shadowUrl:markerShadow,iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]});const SRI_LANKA=[7.8731,80.7718]
function Controller({position,onChange,label}){const map=useMap();useEffect(()=>{if(position)map.setView(position,Math.max(map.getZoom(),12))},[map,position]);useMapEvents({click(event){onChange({latitude:Number(event.latlng.lat.toFixed(6)),longitude:Number(event.latlng.lng.toFixed(6))})}});if(!position)return null;return <Marker position={position} icon={icon} draggable eventHandlers={{dragend(event){const point=event.target.getLatLng();onChange({latitude:Number(point.lat.toFixed(6)),longitude:Number(point.lng.toFixed(6))})}}}><Popup>{label}</Popup></Marker>}
export default function LeafletLocationPicker({latitude,longitude,onChange,label}){const valid=hasCoordinates({latitude,longitude});const position=valid?[Number(latitude),Number(longitude)]:null;return <MapContainer center={position||SRI_LANKA} zoom={position?12:7} scrollWheelZoom className="map-location-picker-leaflet"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Controller position={position} onChange={onChange} label={label}/></MapContainer>}
