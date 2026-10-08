import { applyImageFallback, getHotelMainImage, resolveCatalogImageUrl } from './hotelMedia.js'

export function getRoomMainImage(room) {
  return resolveCatalogImageUrl(room?.mainImage || room?.image) || null
}

export function getRoomImageOrPlaceholder(room) {
  return getRoomMainImage(room) || getHotelMainImage(null)
}

export function getRoomGalleryImages(room) {
  const main = getRoomMainImage(room)
  return [...new Set((room?.gallery || room?.galleryImages || []).map(resolveCatalogImageUrl).filter((image) => image && image !== main))]
}

export function getRoomDisplayImages(room) {
  return [getRoomImageOrPlaceholder(room), ...getRoomGalleryImages(room)]
}

export { applyImageFallback }
