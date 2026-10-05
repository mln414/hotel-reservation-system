import { getRoomGalleryImages, getRoomMainImage } from './roomMedia.js'
import { getPhysicalRoomOperationalState } from './reservationDomain.js'
import { HOTEL_PUBLICATION_STATUS, HOTEL_SETUP_STATUS } from '../constants/hotelManagement.js'

export const ROOM_TYPE_GROUPS=[['STANDARD','Standard'],['SUPERIOR','Superior'],['DELUXE','Deluxe'],['SUITE','Suite'],['FAMILY','Family'],['VILLA','Villa']]
export const BED_CONFIGURATIONS=['1 King Bed','1 Queen Bed','2 Queen Beds','2 Single Beds','King + Sofa Bed']
export const VIEW_TYPES=['Ocean View','City View','Garden View','Pool View','Mountain View','No Specific View']
export const SMOKING_PREFERENCES=['Non-smoking','Smoking Allowed','Mixed / Depends on Unit']
export const OPERATIONAL_STATES=['AVAILABLE','BLOCKED','MAINTENANCE','INACTIVE']
export const ROOM_CONDITIONS=['READY','SERVICE_REQUIRED','CLEANING']

export function createManagedRoomType(data,{id=Date.now(),now=new Date()}={}){const timestamp=now.toISOString();return{...data,id,status:data.status||'ACTIVE',gallery:data.gallery||[],createdAt:timestamp,updatedAt:timestamp}}
export function createManagedPhysicalRoom(data,{id=`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,now=new Date()}={}){const operationalStatus=data.operationalStatus||data.status||'AVAILABLE';const timestamp=now.toISOString();return{...data,id,roomNumber:String(data.roomNumber).trim(),wing:data.wing||'',condition:data.condition||'READY',baseOperationalStatus:operationalStatus,status:operationalStatus,operationalStatus,operationalBlocks:data.operationalBlocks||[],createdAt:timestamp,updatedAt:timestamp}}

export function normalizeRoomNumber(value=''){return String(value).trim().toLowerCase()}
export function getRoomTypesForHotel(roomTypes,hotelId){return (roomTypes||[]).filter((room)=>String(room.hotelId)===String(hotelId))}
export function getPhysicalRoomsForHotel(physicalRooms,hotelId){return (physicalRooms||[]).filter((room)=>String(room.hotelId)===String(hotelId))}
export function getPhysicalRoomsForRoomType(physicalRooms,roomTypeId){return (physicalRooms||[]).filter((room)=>String(room.roomTypeId)===String(roomTypeId))}
export function validateRoomNumberUniqueness(physicalRooms,hotelId,roomNumber,excludeId=''){const normalized=normalizeRoomNumber(roomNumber);return normalized&&!physicalRooms.some((room)=>String(room.id)!==String(excludeId)&&String(room.hotelId)===String(hotelId)&&normalizeRoomNumber(room.roomNumber)===normalized)}
export function getSuggestedRoomNumber(physicalRooms,hotelId,floor=''){const rooms=getPhysicalRoomsForHotel(physicalRooms,hotelId);const numeric=rooms.map((room)=>String(room.roomNumber).trim()).filter((value)=>/^\d+$/.test(value)).map(Number);if(floor&&/^\d+$/.test(String(floor))){const start=Number(floor)*100+1;const used=new Set(numeric);let candidate=start;while(used.has(candidate))candidate+=1;return String(candidate)}return String(numeric.length?Math.max(...numeric)+1:1)}
export function createSequentialRoomNumbers(start,count){const first=Number(start),total=Number(count);return Number.isInteger(first)&&Number.isInteger(total)&&total>0&&total<=100?Array.from({length:total},(_,index)=>String(first+index)):[]}

export function getRoomTypeReadiness({room,hotel,physicalRooms,currentRate}){
  const hasInventory = Number(room?.inventoryCount) > 0 || (Array.isArray(physicalRooms) && physicalRooms.length > 0 && getPhysicalRoomsForRoomType(physicalRooms,room?.id).some((item)=>getPhysicalRoomOperationalState(item)==='AVAILABLE'));
  const checks={basic:Boolean(room?.name&&room?.shortDescription&&Number(room?.maxGuests || room?.capacity)>=1),images:Boolean(getRoomMainImage(room)),inventory:Boolean(hasInventory),rate:Boolean(currentRate),amenities:(room?.amenityIds||[]).length};
  return{...checks,requiredReady:checks.basic&&checks.images&&checks.inventory&&checks.rate,hotelPublic:Boolean(hotel?.publicationStatus===HOTEL_PUBLICATION_STATUS.ACTIVE&&(hotel?.setupStatus===HOTEL_SETUP_STATUS.COMPLETE||hotel?.setupStatus==='COMPLETE'))}
}
export function getRoomTypeCustomerVisibility(args){const readiness=getRoomTypeReadiness(args);const reasons=[{key:'hotel',label:'Hotel published',ready:readiness.hotelPublic},{key:'status',label:'Room Type active',ready:args.room?.status==='ACTIVE'},{key:'basic',label:'Required Room Type information',ready:readiness.basic},{key:'image',label:'Main Photo',ready:readiness.images},{key:'rate',label:'Current Rate configured',ready:readiness.rate},{key:'inventory',label:'Usable Room Inventory',ready:readiness.inventory}];return{bookable:reasons.every((item)=>item.ready),label:reasons.every((item)=>item.ready)?'BOOKABLE':'CUSTOMER HIDDEN',reasons,readiness}}
export function getRoomTypeDisplayImages(room){return[getRoomMainImage(room),...getRoomGalleryImages(room)].filter(Boolean)}
export function getNextRoomSetupAction(visibility,room){if(!visibility.readiness.inventory)return{label:'Configure Room Inventory',href:`/management/rooms/${room.id}/inventory`};if(!visibility.readiness.rate)return{label:'Configure Base Rate',href:`/management/rates?hotelId=${room.hotelId}&roomTypeId=${room.id}&section=roomTypeRates&from=roomDetails`};if(!visibility.readiness.images)return{label:'Add a Main Photo',href:`/management/rooms/${room.id}/edit#media`};return null}
export function moveItemById(items,id,direction){const next=[...items];const index=next.findIndex((item)=>String(item.id)===String(id));const target=index+direction;if(index<0||target<0||target>=next.length)return items;[next[index],next[target]]=[next[target],next[index]];return next.map((item,order)=>({...item,displayOrder:order}))}
