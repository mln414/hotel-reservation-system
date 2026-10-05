export const SRI_LANKA_ADMINISTRATIVE_AREAS = Object.freeze([
  { province: 'Central Province', districts: [{ name: 'Kandy', latitude: 7.2906, longitude: 80.6337 }, { name: 'Matale', latitude: 7.4675, longitude: 80.6234 }, { name: 'Nuwara Eliya', latitude: 6.9497, longitude: 80.7891 }] },
  { province: 'Eastern Province', districts: [{ name: 'Ampara', latitude: 7.2912, longitude: 81.6724 }, { name: 'Batticaloa', latitude: 7.717, longitude: 81.7004 }, { name: 'Trincomalee', latitude: 8.5874, longitude: 81.2152 }] },
  { province: 'North Central Province', districts: [{ name: 'Anuradhapura', latitude: 8.3114, longitude: 80.4037 }, { name: 'Polonnaruwa', latitude: 7.9403, longitude: 81.0188 }] },
  { province: 'Northern Province', districts: [{ name: 'Jaffna', latitude: 9.6615, longitude: 80.0255 }, { name: 'Kilinochchi', latitude: 9.3803, longitude: 80.377 }, { name: 'Mannar', latitude: 8.981, longitude: 79.9044 }, { name: 'Mullaitivu', latitude: 9.2671, longitude: 80.8142 }, { name: 'Vavuniya', latitude: 8.7542, longitude: 80.4982 }] },
  { province: 'North Western Province', districts: [{ name: 'Kurunegala', latitude: 7.4863, longitude: 80.3647 }, { name: 'Puttalam', latitude: 8.0408, longitude: 79.8394 }] },
  { province: 'Sabaragamuwa Province', districts: [{ name: 'Kegalle', latitude: 7.2513, longitude: 80.3464 }, { name: 'Ratnapura', latitude: 6.7056, longitude: 80.3847 }] },
  { province: 'Southern Province', districts: [{ name: 'Galle', latitude: 6.0329, longitude: 80.2168 }, { name: 'Hambantota', latitude: 6.1241, longitude: 81.1185 }, { name: 'Matara', latitude: 5.9549, longitude: 80.555 }] },
  { province: 'Uva Province', districts: [{ name: 'Badulla', latitude: 6.9934, longitude: 81.055 }, { name: 'Monaragala', latitude: 6.8728, longitude: 81.3507 }] },
  { province: 'Western Province', districts: [{ name: 'Colombo', latitude: 6.9271, longitude: 79.8612 }, { name: 'Gampaha', latitude: 7.0873, longitude: 80.0144 }, { name: 'Kalutara', latitude: 6.5854, longitude: 79.9607 }] },
])

export const SRI_LANKA_PROVINCES = Object.freeze(SRI_LANKA_ADMINISTRATIVE_AREAS.map((item) => item.province))

export function getDistrictsForProvince(province) {
  return SRI_LANKA_ADMINISTRATIVE_AREAS.find((item) => item.province === province)?.districts || []
}

export function getDistrictCentre(province, district) {
  return getDistrictsForProvince(province).find((item) => item.name === district) || null
}

export function isValidProvinceDistrict(province, district) {
  return Boolean(province && district && getDistrictCentre(province, district))
}
