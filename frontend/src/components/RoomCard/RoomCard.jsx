import { Link } from 'react-router'
import { formatRateAmount } from '../../utils/rateFormatting.js'

function RoomCard({ room }) {
  if (!room) return null

  return (
    <article>
      <h2>{room.name}</h2>
      <p>{formatRateAmount(room.pricePerNight)} per night</p>
      <Link to={`/booking/${room.id}`}>Book this room</Link>
    </article>
  )
}

export default RoomCard
