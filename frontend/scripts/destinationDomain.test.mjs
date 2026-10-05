import assert from 'node:assert/strict'
import { canTransitionDestinationStatus, calculateDistanceKm, createDestinationSaveMetadata, DESTINATION_STATUS, getActiveAttractions, getAttractionsForHotel, getDestinationLifecycleActions, getDestinationResumeStep, getDestinationThemes, getHighestReachableDestinationStep, hasCoordinates, isDuplicateAttraction, normalizeDestination, validateDestinationForActivation, validateDestinationStep } from '../src/utils/destinationDomain.js'
import { getDistrictCentre, getDistrictsForProvince, isValidProvinceDistrict, SRI_LANKA_ADMINISTRATIVE_AREAS } from '../src/utils/sriLankaAdministrative.js'

const galle=normalizeDestination({id:3,name:'Galle',slug:'galle',category:'Heritage & Coast',shortDescription:'Card copy',description:'Full copy',image:'galle.jpg',highlights:['Galle Fort'],active:true})
assert.deepEqual(galle.themeKeys,['HERITAGE','COAST'],'legacy combined category migrates to flexible theme keys')
assert.equal(getDestinationThemes(galle).length,2,'both legacy themes resolve')
assert.equal(galle.attractions.length,4,'Galle receives curated canonical sample attractions')
assert.equal(hasCoordinates({latitude:null,longitude:null}),false,'null coordinates are not a location')
assert.equal(hasCoordinates(galle),true,'normalized Galle has an internal map location')

const hotel={latitude:6.0329,longitude:80.2168}
const fort=galle.attractions[0]
const distance=calculateDistanceKm(hotel,fort)
assert.ok(distance>0&&distance<1,'Haversine distance is calculated from exact Hotel coordinates')
assert.equal(getAttractionsForHotel(galle,hotel,2).length,2,'Hotel Location derives a compact active attraction list')
assert.equal(getActiveAttractions({...galle,attractions:[fort,{...fort,id:'inactive',status:'INACTIVE'}]}).length,1,'inactive attractions remain managed but customer-hidden')
assert.equal(isDuplicateAttraction([fort],{...fort,id:'candidate',source:'openstreetmap',sourceId:'node/1'}),true,'nearby name and coordinate duplicates are rejected')
assert.deepEqual(validateDestinationForActivation(galle),{},'complete normalized Destination can activate')
assert.ok(validateDestinationForActivation(normalizeDestination({name:'Draft'})).themeKeys,'incomplete Draft cannot activate')
assert.equal(fort.estimatedTravelTime,'','travel time is not fabricated from geographic distance')
assert.equal(SRI_LANKA_ADMINISTRATIVE_AREAS.length,9,'the canonical registry contains all nine Provinces')
assert.equal(SRI_LANKA_ADMINISTRATIVE_AREAS.flatMap((item)=>item.districts).length,25,'the canonical registry contains all twenty-five Districts')
assert.equal(getDistrictsForProvince('Eastern Province').length,3,'District options depend on Province')
assert.equal(getDistrictCentre('Eastern Province','Trincomalee').latitude,8.5874,'Trincomalee uses its local district centre')
assert.equal(isValidProvinceDistrict('Northern Province','Trincomalee'),false,'impossible Province/District relationships are rejected')
assert.equal(normalizeDestination({name:'Trincomalee'}).region,'Eastern Province','Trincomalee never falls back to Northern Province')
assert.ok(validateDestinationStep({...galle,district:''},2).district,'Step 3 reports an exact missing District error')
assert.equal(getHighestReachableDestinationStep(galle),5,'a fully valid Destination can reach Review & Submit')
assert.deepEqual(getDestinationLifecycleActions(DESTINATION_STATUS.DRAFT),['VIEW','CONTINUE_SETUP'],'Draft never exposes Reactivate')
assert.deepEqual(getDestinationLifecycleActions(DESTINATION_STATUS.READY_FOR_REVIEW),['VIEW','REVIEW'],'Ready for Review does not expose direct activation controls')
assert.equal(canTransitionDestinationStatus(DESTINATION_STATUS.DRAFT,DESTINATION_STATUS.ACTIVE),false,'Draft cannot skip Manager review')
assert.equal(canTransitionDestinationStatus(DESTINATION_STATUS.DRAFT,DESTINATION_STATUS.READY_FOR_REVIEW),true,'valid workflow submits Draft for review')
assert.equal(canTransitionDestinationStatus(DESTINATION_STATUS.INACTIVE,DESTINATION_STATUS.ACTIVE),true,'only Inactive records reactivate')
const savedStepFive={...galle,status:DESTINATION_STATUS.DRAFT,lastSavedStep:5,lastCompletedStep:5}
assert.equal(getDestinationResumeStep(savedStepFive),4,'an incomplete Draft resumes its last meaningful saved Step')
assert.equal(getDestinationResumeStep(galle),0,'completed Destination editing starts at Step 1 by default')
assert.equal(getDestinationResumeStep(galle,4),4,'completed Destination editing supports direct section routing')
const saveMetadata=createDestinationSaveMetadata(2,2,'2026-08-11T03:00:00.000Z')
assert.deepEqual(saveMetadata,{draftStep:2,lastSavedStep:3,lastCompletedStep:3,updatedAt:'2026-08-11T03:00:00.000Z',lastUpdatedAt:'2026-08-11T03:00:00.000Z',lastUpdatedSection:'Location'},'successful Step saves preserve workflow and accurate mutation metadata')
assert.deepEqual(normalizeDestination({...galle,imageFocalPoint:{x:20,y:72}}).imageFocalPoint,{x:20,y:72},'Main Image focal metadata survives normalization')
console.log('PASS destination domain normalization, relationships, lifecycle, duplicates and distance')
