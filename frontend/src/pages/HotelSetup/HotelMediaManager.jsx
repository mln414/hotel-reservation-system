import { ArrowLeft, ArrowRight, Eye, ImagePlus, Save, Star, X } from 'lucide-react'
import { useState } from 'react'
import ManagementDialog from '../../components/ManagementDialog/ManagementDialog.jsx'
import useHotels from '../../context/useHotels.js'
import { applyImageFallback, getHotelGalleryImages, getHotelMainImage } from '../../utils/hotelMedia.js'
import { hotelApi } from '../../services/hotelApi.js'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
async function validateFiles(files) {
  const accepted = []; const errors = []
  for (const file of [...files]) {
    if (!allowedTypes.includes(file.type)) { errors.push(`${file.name}: use JPG, PNG or WebP.`); continue }
    if (file.size > 5 * 1024 * 1024) { errors.push(`${file.name}: maximum size is 5 MB.`); continue }
    const src = URL.createObjectURL(file)
    const valid = await new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image.naturalWidth >= 600 && image.naturalHeight >= 350); image.onerror = () => resolve(false); image.src = src })
    URL.revokeObjectURL(src)
    if (!valid) errors.push(`${file.name}: use an image at least 600 × 350 px.`)
    else accepted.push(file)
  }
  return { accepted, errors }
}

export default function HotelMediaManager({ hotel, updateSetupSection, onContinue }) {
  const { addHotelGalleryImages, setHotelMainImage, removeHotelGalleryImage, moveHotelGalleryImage } = useHotels()
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [preview, setPreview] = useState(''); const [removeCandidate, setRemoveCandidate] = useState(null)
  const gallery = getHotelGalleryImages(hotel); const main = getHotelMainImage(hotel)
  const add = async (event) => {
    const result = await validateFiles(event.target.files || [])
    setError(result.errors.join(' '))
    if (!result.accepted.length) return
    try {
      const uploads = await Promise.all(result.accepted.map((file) => hotelApi.uploadImage(file)))
      const urls = uploads.map((item) => item.url).filter(Boolean)
      await addHotelGalleryImages(hotel.id, urls)
      setMessage(`${urls.length} gallery image${urls.length === 1 ? '' : 's'} added and saved.`)
    } catch (uploadError) { setError(uploadError.message || 'Unable to upload gallery images.') }
  }
  const replaceMain = async (event) => {
    const result = await validateFiles(event.target.files || [])
    setError(result.errors.join(' '))
    if (!result.accepted[0]) return
    try {
      const upload = await hotelApi.uploadImage(result.accepted[0])
      await setHotelMainImage(hotel.id, upload.url)
      setMessage('Cover photo updated and saved across management and customer surfaces.')
    } catch (uploadError) { setError(uploadError.message || 'Unable to upload the cover image.') }
  }
  const save = async () => { try { await updateSetupSection(hotel.id, 'gallery', Boolean(main), {}); setMessage('Gallery saved.') } catch (saveError) { setError(saveError.message || 'Unable to save the gallery.') } }

  return <article className="hotel-workspace-card hotel-media-manager">
    <div className="hotel-card-heading"><div><span>Canonical property media</span><h2>Gallery &amp; Media</h2><p>{hotel.name} · {gallery.length + (main ? 1 : 0)} total images</p></div><label className="workspace-image-upload"><input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={add} /><ImagePlus size={18} />Add Images</label></div>
    {message && <p className="hotel-workspace-status" role="status" aria-live="polite">{message}</p>}{error && <p className="property-error" role="alert">{error}</p>}
    <div className="hotel-main-media">{main ? <div className="hotel-cover-preview"><img src={main} onError={applyImageFallback} alt={`Cover for ${hotel.name}`} /><span><Star size={13} />Cover</span></div> : <div className="hotel-cover-empty"><ImagePlus size={28} /><strong>Main Photo required</strong></div>}<div><strong>Main / Cover Photo</strong><p>This single source powers the Hotel card, Hotel Details hero, manager workspace and Preview.</p><label className="workspace-image-upload"><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={replaceMain} /><ImagePlus size={18} />{main ? 'Replace Cover' : 'Select Cover'}</label></div></div>
    <div className="hotel-gallery-heading"><div><span>Customer gallery</span><h2>{gallery.length} Gallery Images</h2><p>Reorder images, preview them, or select one as the canonical cover.</p></div></div>
    {gallery.length ? <div className="workspace-gallery hotel-gallery-cards">{gallery.map((image, index) => <figure key={image}><button className="gallery-preview-button" type="button" onClick={() => setPreview(image)}><img src={image} onError={applyImageFallback} alt={`${hotel.name} gallery image ${index + 1}`} /><span className="sr-only">Preview image {index + 1}</span></button><figcaption>Gallery Image {index + 1}</figcaption><div><button type="button" title="Preview" aria-label={`Preview gallery image ${index + 1}`} onClick={() => setPreview(image)}><Eye size={13} /></button><button type="button" title="Set as Cover" aria-label={`Set gallery image ${index + 1} as Cover`} onClick={() => { setHotelMainImage(hotel.id, image); setMessage('Gallery image set as the canonical Cover.') }}><Star size={13} /></button><button type="button" title="Move left" disabled={index === 0} aria-label={`Move image ${index + 1} left`} onClick={() => moveHotelGalleryImage(hotel.id, image, -1)}><ArrowLeft size={13} /></button><button type="button" title="Move right" disabled={index === gallery.length - 1} aria-label={`Move image ${index + 1} right`} onClick={() => moveHotelGalleryImage(hotel.id, image, 1)}><ArrowRight size={13} /></button><button type="button" title="Remove" aria-label={`Remove gallery image ${index + 1}`} onClick={() => setRemoveCandidate({ image, index })}><X size={13} /></button></div></figure>)}</div> : <div className="workspace-empty"><p>No gallery images yet. Add images to enrich the customer Hotel Details page.</p></div>}
    <p className="workspace-media-note">Hotel images are validated, uploaded securely, and persisted with this Hotel.</p>
    <div className="gallery-final-actions"><button type="button" onClick={save}><Save size={15} />Save Gallery</button><button className="primary" type="button" onClick={() => { save(); onContinue?.('policies') }}><Save size={15} />Save &amp; Continue to Policies</button></div>
    {preview && <div className="media-preview-dialog" role="dialog" aria-modal="true" aria-label="Hotel photo preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview('') }}><div><button type="button" aria-label="Close preview" onClick={() => setPreview('')}><X /></button><img src={preview} onError={applyImageFallback} alt={`${hotel.name} gallery preview`} /></div></div>}
    {removeCandidate && <ManagementDialog danger title="Remove Gallery Image?" description="This image will disappear from the shared customer gallery. The canonical Cover is retained." onClose={() => setRemoveCandidate(null)} actions={<><button type="button" onClick={() => setRemoveCandidate(null)}>Keep Image</button><button className="danger" type="button" onClick={() => { removeHotelGalleryImage(hotel.id, removeCandidate.image); setRemoveCandidate(null); setMessage('Gallery image removed from shared Hotel surfaces.') }}>Remove Image</button></>} />}
  </article>
}
