import { ArrowLeft, ArrowRight, Eye, ImagePlus, Star, X } from 'lucide-react'
import { useState } from 'react'
import ManagementDialog from '../ManagementDialog/ManagementDialog.jsx'
import { applyImageFallback, getRoomGalleryImages, getRoomMainImage } from '../../utils/roomMedia.js'
import roomApi from '../../services/roomApi.js'
import './RoomMediaEditor.css'

const accepted = ['image/jpeg', 'image/png', 'image/webp']

export default function RoomMediaEditor({ room, onChange, error }) {
  const [preview, setPreview] = useState('')
  const [removeCandidate, setRemoveCandidate] = useState(null)
  const [mediaError, setMediaError] = useState('')
  const [uploading, setUploading] = useState(false)

  const main = getRoomMainImage(room)
  const gallery = getRoomGalleryImages(room)

  const setMain = (image) => onChange({
    mainImage: image,
    gallery: [...new Set([...(gallery || []), main].filter((item) => item && item !== image))],
  })

  const handleMainUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!accepted.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMediaError('Use a JPG, PNG or WebP image up to 5 MB.')
      return
    }
    setMediaError('')
    setUploading(true)
    try {
      const res = await roomApi.uploadImage(file)
      if (res?.url) {
        setMain(res.url)
      } else {
        setMain(URL.createObjectURL(file))
      }
    } catch {
      setMain(URL.createObjectURL(file))
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const valid = files.filter((file) => accepted.includes(file.type) && file.size <= 5 * 1024 * 1024)
    if (valid.length !== files.length) {
      setMediaError('Unsupported or oversized files were skipped. Use JPG, PNG or WebP up to 5 MB.')
    } else {
      setMediaError('')
    }
    if (!valid.length) return

    setUploading(true)
    try {
      const uploadedUrls = []
      for (const file of valid) {
        try {
          const res = await roomApi.uploadImage(file)
          if (res?.url) uploadedUrls.push(res.url)
          else uploadedUrls.push(URL.createObjectURL(file))
        } catch {
          uploadedUrls.push(URL.createObjectURL(file))
        }
      }
      if (uploadedUrls.length) {
        onChange({ gallery: [...new Set([...gallery, ...uploadedUrls].filter((item) => item !== main))] })
      }
    } finally {
      setUploading(false)
    }
  }

  const move = (image, direction) => {
    const next = [...gallery]
    const index = next.indexOf(image)
    const target = index + direction
    if (index < 0 || target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ gallery: next })
  }

  return (
    <div className="room-media-editor">
      <div className="room-media-main">
        <div>
          <h3>Main / Cover Photo *</h3>
          <p>This single image drives management Room Type cards, customer Room cards, booking selection and Room Details.</p>
        </div>
        <div className="room-media-main-preview">
          {main ? <img src={main} onError={applyImageFallback} alt="Current Room Type Main" /> : <span><ImagePlus size={29} />Main Photo not configured</span>}
          <label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleMainUpload} disabled={uploading} />
            <ImagePlus size={16} />{uploading ? 'Uploading...' : main ? 'Change Main Photo' : 'Choose Main Photo'}
          </label>
        </div>
        {error && <small className="room-error" role="alert">{error}</small>}
      </div>

      <div className="room-media-gallery-heading">
        <div>
          <h3>Room Type Gallery</h3>
          <p>These ordered images power the Room Details slideshow and thumbnails.</p>
        </div>
        <label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleGalleryUpload} disabled={uploading} />
          <ImagePlus size={16} />{uploading ? 'Uploading...' : 'Add Images'}
        </label>
      </div>

      {mediaError && <p className="room-error" role="alert">{mediaError}</p>}

      <div className="room-media-gallery">
        {gallery.map((image, index) => (
          <figure key={image}>
            <img src={image} onError={applyImageFallback} alt={`Room Gallery ${index + 1}`} />
            <figcaption>Gallery Photo {index + 1}</figcaption>
            <div>
              <button type="button" aria-label={`Preview Room Gallery Photo ${index + 1}`} onClick={() => setPreview(image)}><Eye size={13} /></button>
              <button type="button" aria-label={`Set Room Gallery Photo ${index + 1} as Main`} onClick={() => setMain(image)}><Star size={13} /></button>
              <button type="button" disabled={index === 0} aria-label={`Move Room Gallery Photo ${index + 1} left`} onClick={() => move(image, -1)}><ArrowLeft size={13} /></button>
              <button type="button" disabled={index === gallery.length - 1} aria-label={`Move Room Gallery Photo ${index + 1} right`} onClick={() => move(image, 1)}><ArrowRight size={13} /></button>
              <button type="button" aria-label={`Remove Room Gallery Photo ${index + 1}`} onClick={() => setRemoveCandidate(image)}><X size={13} /></button>
            </div>
          </figure>
        ))}
      </div>

      {!gallery.length && <p className="room-media-empty">No Gallery images added. The Main Photo remains available on Room Details.</p>}

      {preview && (
        <div className="media-preview-dialog" role="dialog" aria-modal="true" aria-label="Room photo preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview('') }}>
          <div>
            <button type="button" aria-label="Close preview" onClick={() => setPreview('')}><X /></button>
            <img src={preview} onError={applyImageFallback} alt="Room Gallery preview" />
          </div>
        </div>
      )}

      {removeCandidate && (
        <ManagementDialog
          danger
          title="Remove Room Gallery Photo?"
          description="The photo will be removed from Room Details and all shared Room Type gallery surfaces."
          onClose={() => setRemoveCandidate(null)}
          actions={
            <>
              <button type="button" onClick={() => setRemoveCandidate(null)}>Keep Photo</button>
              <button className="primary" type="button" onClick={() => { onChange({ gallery: gallery.filter((item) => item !== removeCandidate) }); setRemoveCandidate(null) }}>Remove Photo</button>
            </>
          }
        />
      )}
    </div>
  )
}
