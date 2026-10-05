import { Construction } from 'lucide-react'
import './ManagementModule.css'

function ManagementModule({ title, description }) {
  return (
    <section className="management-module-page">
      <header><span>Management module</span><h1>{title}</h1><p>{description}</p></header>
      <div className="management-module-placeholder"><Construction aria-hidden="true" size={25} /><div><h2>{title}</h2><p>Management interface will be implemented in the next module.</p></div></div>
    </section>
  )
}

export default ManagementModule
