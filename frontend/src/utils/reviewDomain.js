export const REVIEW_STATUS = { ACTIVE: 'ACTIVE', HIDDEN: 'HIDDEN_BY_MODERATION', DELETED: 'DELETED_BY_CUSTOMER' }
export const REVIEW_ELIGIBILITY = { NOT_AUTHENTICATED:'NOT_AUTHENTICATED', NOT_FOUND:'NOT_FOUND', NOT_OWNER:'NOT_OWNER', NOT_COMPLETED:'NOT_COMPLETED', ALREADY_REVIEWED:'ALREADY_REVIEWED', ELIGIBLE:'ELIGIBLE' }
export const REVIEW_CATEGORIES = [
  ['cleanliness','Cleanliness'],['comfort','Comfort'],['staffService','Staff & Service'],['facilities','Facilities'],['location','Location'],['value','Value for Money'],
]
export const MODERATION_REASONS = ['Spam / Advertising','Harassment / Threats','Hate / Discriminatory Content','Obscene / Abusive Content','Personal Information','Off-topic','Duplicate Content','Fraud / Manipulation','Other Policy Violation']
const same=(a,b)=>String(a)===String(b)
export const getReviewById=(reviews,id)=>reviews.find((review)=>same(review.id,id))||null
export const getReviewForReservation=(reviews,reservationId)=>reviews.find((review)=>same(review.reservationId,reservationId)&&review.status!==REVIEW_STATUS.DELETED)||null
export const getActiveReviews=(reviews=[])=>reviews.filter((review)=>review.status===REVIEW_STATUS.ACTIVE)
export const getHotelReviews=(reviews=[],hotelId,{includeHistory=false}={})=>reviews.filter((review)=>same(review.hotelId,hotelId)&&(includeHistory||review.status===REVIEW_STATUS.ACTIVE))
export const getActiveHotelReviews=(reviews,hotelId)=>getHotelReviews(reviews,hotelId)
export function getHotelAverageRating(reviews,hotelId){const items=getActiveHotelReviews(reviews,hotelId);return items.length?Math.round(items.reduce((sum,item)=>sum+Number(item.overallRating),0)/items.length*10)/10:null}
export const getHotelReviewCount=(reviews,hotelId)=>getActiveHotelReviews(reviews,hotelId).length
export function getHotelRatingDistribution(reviews,hotelId){const items=getActiveHotelReviews(reviews,hotelId);return [5,4,3,2,1].map((rating)=>({rating,count:items.filter((item)=>Number(item.overallRating)===rating).length,percentage:items.length?items.filter((item)=>Number(item.overallRating)===rating).length/items.length*100:0}))}
export function getHotelCategoryAverages(reviews,hotelId){const items=getActiveHotelReviews(reviews,hotelId);return Object.fromEntries(REVIEW_CATEGORIES.map(([key])=>{const values=items.map((item)=>Number(item.categoryRatings?.[key])).filter((value)=>value>=1&&value<=5);return [key,values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null]}).filter(([,value])=>value!==null))}
export function getRatingLabel(rating,count=1){if(!count||rating==null)return 'No Reviews Yet';if(rating>=4.5)return'Excellent';if(rating>=4)return'Very Good';if(rating>=3)return'Good';if(rating>=2)return'Fair';return'Poor'}
export function canCustomerReviewReservation(customerId,reservationId,reservations=[],reviews=[]){if(customerId==null)return{eligible:false,reason:REVIEW_ELIGIBILITY.NOT_AUTHENTICATED};const reservation=reservations.find((item)=>same(item.id,reservationId));if(!reservation)return{eligible:false,reason:REVIEW_ELIGIBILITY.NOT_FOUND};if(!same(reservation.customerId,customerId))return{eligible:false,reason:REVIEW_ELIGIBILITY.NOT_OWNER};if(reservation.status!=='COMPLETED')return{eligible:false,reason:REVIEW_ELIGIBILITY.NOT_COMPLETED};if(getReviewForReservation(reviews,reservation.id))return{eligible:false,reason:REVIEW_ELIGIBILITY.ALREADY_REVIEWED,review:getReviewForReservation(reviews,reservation.id)};return{eligible:true,reason:REVIEW_ELIGIBILITY.ELIGIBLE,reservation}}
export const getReviewEligibleReservations=(customerId,reservations=[],reviews=[])=>reservations.filter((reservation)=>canCustomerReviewReservation(customerId,reservation.id,reservations,reviews).eligible)
export const canCustomerEditReview=(customerId,review)=>Boolean(review&&same(review.customerId,customerId)&&review.status===REVIEW_STATUS.ACTIVE)
export const canCustomerDeleteReview=(customerId,review)=>Boolean(review&&same(review.customerId,customerId)&&review.status!==REVIEW_STATUS.DELETED)
export const getReviewManagementResponse=(review)=>review?.managementResponse||null
export const getUnansweredReviews=(reviews=[])=>getActiveReviews(reviews).filter((review)=>!review.managementResponse?.responseText)
export const getReviewsNeedingModerationAttention=(reviews=[])=>reviews.filter((review)=>review.status===REVIEW_STATUS.HIDDEN)
export function getManagementReviewSummary(reviews=[],hotelId=''){
  const scoped=hotelId===''||hotelId==null?reviews:reviews.filter((review)=>same(review.hotelId,hotelId))
  const published=getActiveReviews(scoped)
  return {
    publishedCount:published.length,
    averageRating:published.length?Math.round(published.reduce((sum,item)=>sum+Number(item.overallRating),0)/published.length*10)/10:null,
    unansweredCount:getUnansweredReviews(scoped).length,
    moderationCount:getReviewsNeedingModerationAttention(scoped).length,
  }
}
export const getInitials=(name='Guest')=>name.trim().split(/\s+/).slice(0,2).map((part)=>part[0]).join('').toUpperCase()
export function getPrimaryRoomTypeId(reservation){return reservation?.items?.[0]?.roomTypeId??reservation?.roomTypeId??reservation?.roomId}
export function formatStayedMonth(reservation){if(!reservation?.checkOut)return 'Stay date unavailable';return `Stayed ${new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${reservation.checkOut}T00:00:00Z`))}`}
