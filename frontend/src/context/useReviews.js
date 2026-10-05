import { useContext } from 'react'
import ReviewsContext from './reviewsContext.js'
export default function useReviews(){const value=useContext(ReviewsContext);if(!value)throw new Error('useReviews must be used within ReviewsProvider');return value}
