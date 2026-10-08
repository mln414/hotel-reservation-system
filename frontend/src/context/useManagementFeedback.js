import { useContext } from 'react'
import ManagementFeedbackContext from './managementFeedbackContext.js'
export default function useManagementFeedback(){const value=useContext(ManagementFeedbackContext);if(!value)throw new Error('useManagementFeedback must be used within ManagementFeedbackProvider');return value}
