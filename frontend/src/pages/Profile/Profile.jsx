import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Languages,
  LogOut,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import useSavedHotels from "../../context/useSavedHotels.js";
import useReservations from "../../context/useReservations.js";
import useHotels from "../../context/useHotels.js";
import useReviews from "../../context/useReviews.js";
import ReviewStars from "../../components/ReviewStars/ReviewStars.jsx";
import { applyImageFallback, getHotelMainImage } from "../../utils/hotelMedia.js";
import useCustomer from "../../context/useCustomer.js";
import { formatLkr, formatReservationDate } from "../../utils/reservationFormatting.js";
import useHotelDiscovery from "../../hooks/useHotelDiscovery.js";
import { validateCustomerPasswordChange, validateProfileFields } from "../../utils/authValidation.js";
import "./Profile.css";

const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function AccountModal({ children, labelId, onClose }) {
  return (
    <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <button className="profile-modal-close" type="button" aria-label="Close dialog" onClick={onClose}>
          <X aria-hidden="true" size={19} />
        </button>
        {children}
      </section>
    </div>
  );
}

function Profile() {
  const { customer, updateCustomer, changePassword, logoutCustomer } = useCustomer();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { savedHotelIds, unsaveHotel } = useSavedHotels();
  const { reservations } = useReservations();
  const { hotels, publicHotels } = useHotels();
  const { reviews, updateReview, deleteCustomerReview, getReviewEligibleReservations } = useReviews();
  const { hotelCards } = useHotelDiscovery();
  const [photoPreview, setPhotoPreview] = useState(customer?.profileImage || null);
  const [photoError, setPhotoError] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFields, setProfileFields] = useState({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileStatus, setProfileStatus] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(customer?.preferredLanguage || "English");
  const [preferenceStatus, setPreferenceStatus] = useState("");
  const [editReview, setEditReview] = useState(null);
  const [reviewFields, setReviewFields] = useState({ rating: 5, title: "", comment: "" });
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewStatus, setReviewStatus] = useState("");
  const [deleteReview, setDeleteReview] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStatus, setPasswordStatus] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (customer?.email) {
      setProfileFields({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
      setPreferredLanguage(customer.preferredLanguage || "English");
    }
  }, [customer]);

  // The customer reservations endpoint is already authenticated and returns
  // only the signed-in customer's records. ReservationResponse intentionally
  // does not expose customerId, so filtering on it here removed every record.
  const customerReservations = reservations;
  const customerReviews = useMemo(() => reviews.filter((item) => String(item.customerId) === String(customer.id) && item.status !== "DELETED_BY_CUSTOMER"), [reviews, customer.id]);
  const eligibleReviewStays = getReviewEligibleReservations(customer.id);
  const savedHotelRecords = useMemo(
    () => savedHotelIds.map((hotelId) => hotelCards.find((item) => String(item.hotel.id) === String(hotelId))).filter(Boolean),
    [savedHotelIds, hotelCards],
  );
  const reservationCounts = useMemo(() => customerReservations.reduce((counts, item) => ({
    ...counts,
    [item.status]: (counts[item.status] || 0) + 1,
  }), {}), [customerReservations]);
  const nextReservation = useMemo(() => customerReservations
    .filter((item) => item.status === "CONFIRMED")
    .sort((first, second) => first.checkIn.localeCompare(second.checkIn))[0], [customerReservations]);
  const nextHotel = nextReservation
    ? [...publicHotels, ...hotels].find((hotel) => String(hotel.id) === String(nextReservation.hotelId))
    : null;
  const isAnyModalOpen = Boolean(editReview || deleteReview || isPasswordOpen);

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    if (!isAnyModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setEditReview(null);
      setDeleteReview(null);
      setIsPasswordOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAnyModalOpen]);

  const fullName = `${profileFields.firstName} ${profileFields.lastName}`.trim();
  const initials = `${profileFields.firstName.charAt(0)}${profileFields.lastName.charAt(0)}`.toUpperCase();
  const memberSince = new Intl.DateTimeFormat("en-GB", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${customer.memberSince}T00:00:00Z`));

  useEffect(() => {
    const key = "lankastay_photo_" + (customer.id || customer.email || "guest");
    const storedPhoto = localStorage.getItem(key);
    if (storedPhoto) {
      setPhotoPreview(storedPhoto);
    } else {
      setPhotoPreview(customer.profileImage || null);
    }
  }, [customer.id, customer.email, customer.profileImage]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setPhotoError("");
    setPhotoStatus("");
    if (!file) return;
    if (!allowedPhotoTypes.includes(file.type)) {
      setPhotoError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Profile photo must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const key = "lankastay_photo_" + (customer.id || customer.email || "guest");
      localStorage.setItem(key, dataUrl);
      setPhotoPreview(dataUrl);
      setPhotoStatus("Profile photo saved on this device.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const key = "lankastay_photo_" + (customer.id || customer.email || "guest");
    localStorage.removeItem(key);
    setPhotoPreview(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPhotoStatus("Profile photo removed.");
  };

  const startProfileEdit = () => {
    setProfileFields({
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    });
    setProfileErrors({});
    setProfileStatus("");
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setProfileFields({
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    });
    setProfileErrors({});
    setProfileStatus("");
    setIsEditingProfile(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const { values: trimmed, errors: nextErrors } = validateProfileFields(profileFields);
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSavingProfile(true);
    setProfileStatus("");
    try {
      await updateCustomer(trimmed);
      setProfileFields(trimmed);
      setProfileStatus("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (err) {
      const msg = err.body?.message || err.message || "Failed to update profile. Please try again.";
      setProfileStatus(msg);
      if (err.status === 409) {
        setProfileErrors({ email: "An account already exists for this email address." });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const openReviewEditor = (review) => {
    setEditReview(review);
    setReviewFields({ rating: review.overallRating, title: review.title || "", comment: review.comment || "" });
    setReviewErrors({});
    setReviewStatus("");
  };

  const closeReviewEditor = () => {
    setEditReview(null);
    setReviewFields({ rating: 5, title: "", comment: "" });
    setReviewErrors({});
    setReviewStatus("");
  };

  const handleReviewUpdate = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (reviewFields.rating < 1 || reviewFields.rating > 5) nextErrors.rating = "Choose a rating from 1 to 5.";
    if (!reviewFields.comment.trim()) nextErrors.comment = "Review text is required.";
    setReviewErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const result = await updateReview(editReview.id, customer.id, { overallRating: reviewFields.rating, categoryRatings: editReview.categoryRatings || {}, title: reviewFields.title.trim(), comment: reviewFields.comment.trim(), photos: editReview.photos || [] });
    setReviewStatus(result.error ? (result.error || "This Review cannot be edited from the current account.") : "Review updated successfully");
  };

  const openDeleteReview = (review) => {
    setDeleteReview(review);
    setDeleteStatus("");
  };

  const closeDeleteReview = () => {
    setDeleteReview(null);
    setDeleteStatus("");
  };

  const handleDeleteReview = async () => {
    const result = await deleteCustomerReview(deleteReview.id, customer.id);
    setDeleteStatus(result.error ? (result.error || "This Review cannot be deleted from the current account.") : "Review deleted successfully.");
  };

  const openPasswordModal = () => {
    setPasswordFields({ current: "", next: "", confirm: "" });
    setPasswordErrors({});
    setPasswordStatus("");
    setShowPasswords(false);
    setIsPasswordOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordOpen(false);
    setPasswordFields({ current: "", next: "", confirm: "" });
    setPasswordErrors({});
    setPasswordStatus("");
    setShowPasswords(false);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    const nextErrors = validateCustomerPasswordChange(passwordFields);
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSavingPassword(true);
    setPasswordStatus("");
    try {
      await changePassword({
        currentPassword: passwordFields.current,
        newPassword: passwordFields.next,
        confirmNewPassword: passwordFields.confirm,
      });
      setPasswordStatus("Password changed successfully.");
      setPasswordFields({ current: "", next: "", confirm: "" });
      setTimeout(() => {
        setIsPasswordOpen(false);
        setPasswordStatus("");
      }, 1500);
    } catch (err) {
      const msg = err.body?.message || err.message || "Failed to change password.";
      setPasswordStatus(msg);
      if (msg.toLowerCase().includes("current password")) {
        setPasswordErrors({ current: "Current password is incorrect." });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePreferenceSave = () => {
    if (preferredLanguage === customer.preferredLanguage) return;
    setPreferenceStatus("Language preference updated for this session.");
  };

  const overviewStats = [
    { label: "Upcoming Reservations", value: reservationCounts.CONFIRMED || 0, Icon: CalendarDays, href: "/my-reservations" },
    { label: "Completed Stays", value: reservationCounts.COMPLETED || 0, Icon: CheckCircle2, href: "/my-reservations" },
    { label: "Saved Hotels", value: savedHotelRecords.length, Icon: Heart, href: "#saved-hotels" },
    { label: "Reviews", value: customerReviews.length, Icon: Star, href: "#my-reviews" },
    { label: "Eligible Stays to Review", value: eligibleReviewStays.length, Icon: CalendarCheck, href: "/reviews?write=1" },
  ];

  const handleLogout = async () => {
    await logoutCustomer();
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <nav className="profile-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight aria-hidden="true" size={14} /><span aria-current="page">Profile</span></nav>

      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-photo-area">
          <div className="profile-avatar">
            {photoPreview ? <img src={photoPreview} alt={`${customer.firstName} ${customer.lastName} profile`} /> : <span aria-label={`${fullName} initials`}>{initials || <UserRound aria-hidden="true" size={45} />}</span>}
          </div>
          <div className="profile-photo-actions">
            <input ref={fileInputRef} id="profile-photo" className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            <label htmlFor="profile-photo"><Upload aria-hidden="true" size={15} />{photoPreview ? "Change Photo" : "Upload Photo"}</label>
            {photoPreview && <button type="button" onClick={handleRemovePhoto}><Trash2 aria-hidden="true" size={14} />Remove</button>}
          </div>
        </div>
        <div className="profile-hero-copy">
          <span>My LankaStay Account</span>
          <h1 id="profile-title">{fullName}</h1>
          <p>{profileFields.email}</p>
          <small>Member since {memberSince}</small>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="profile-edit-button" type="button" onClick={startProfileEdit}><Pencil aria-hidden="true" size={16} />Edit Profile</button>
          <button className="profile-edit-button" type="button" onClick={handleLogout} style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}><LogOut aria-hidden="true" size={16} />Logout</button>
        </div>
        <div className="profile-photo-feedback" aria-live="polite">{photoError && <p className="is-error">{photoError}</p>}{photoStatus && <p>{photoStatus}</p>}</div>
      </section>

      <section className="profile-overview" aria-label="Account overview">
        {overviewStats.map(({ label, value, Icon, href }) => <a href={href} key={label}><span><Icon aria-hidden="true" size={20} /></span><div><strong>{value}</strong><small>{label}</small></div><ChevronRight aria-hidden="true" size={16} /></a>)}
      </section>

      <div className="profile-main-grid">
        <section className="profile-card profile-personal" aria-labelledby="personal-info-title">
          <div className="profile-section-heading"><span><CircleUserRound aria-hidden="true" size={20} /></span><div><h2 id="personal-info-title">Personal Information</h2><p>Your contact details for future account services.</p></div></div>
          {isEditingProfile ? (
            <form className="profile-edit-form" noValidate onSubmit={handleProfileSave}>
              {[
                ["firstName", "First Name", "text"], ["lastName", "Last Name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"],
              ].map(([field, label, type]) => <div className="profile-field" key={field}><label htmlFor={`profile-${field}`}>{label}</label><input id={`profile-${field}`} type={type} value={profileFields[field]} aria-invalid={Boolean(profileErrors[field])} onChange={(event) => { setProfileFields((current) => ({ ...current, [field]: event.target.value })); setProfileErrors((current) => ({ ...current, [field]: "" })); }} />{profileErrors[field] && <span>{profileErrors[field]}</span>}</div>)}
              <div className="profile-form-actions"><button type="submit" disabled={savingProfile}><Save aria-hidden="true" size={15} />{savingProfile ? "Saving..." : "Save Changes"}</button><button type="button" onClick={cancelProfileEdit}>Cancel</button></div>
            </form>
          ) : (
            <dl className="profile-information-list"><div><dt>First Name</dt><dd>{profileFields.firstName}</dd></div><div><dt>Last Name</dt><dd>{profileFields.lastName}</dd></div><div><dt>Email</dt><dd>{profileFields.email}</dd></div><div><dt>Phone</dt><dd>{profileFields.phone || "Not provided"}</dd></div></dl>
          )}
          {profileStatus && <p className="profile-inline-status" role="status">{profileStatus}</p>}
        </section>

        <section className="profile-card profile-reservations" aria-labelledby="profile-reservations-title">
          <div className="profile-section-heading"><span><CalendarCheck aria-hidden="true" size={20} /></span><div><h2 id="profile-reservations-title">My Reservations</h2><p>A quick view of your LankaStay history.</p></div></div>
          <dl className="profile-reservation-counts"><div><dt>Upcoming</dt><dd>{reservationCounts.CONFIRMED || 0}</dd></div><div><dt>Completed</dt><dd>{reservationCounts.COMPLETED || 0}</dd></div><div><dt>Cancelled</dt><dd>{reservationCounts.CANCELLED || 0}</dd></div></dl>
          {nextReservation && <div className="profile-next-stay"><span>Next stay</span><strong>{nextHotel?.name || "Hotel information unavailable"}</strong><p>{formatReservationDate(nextReservation.checkIn)} – {formatReservationDate(nextReservation.checkOut)}</p></div>}
          <Link className="profile-primary-link" to="/my-reservations">View My Bookings<ArrowRight aria-hidden="true" size={16} /></Link>
        </section>
      </div>

      <section className="profile-card profile-wide-section" id="saved-hotels" aria-labelledby="saved-hotels-title">
        <div className="profile-section-heading profile-section-heading--row"><span><Heart aria-hidden="true" size={20} /></span><div><h2 id="saved-hotels-title">Saved Hotels</h2><p>Your favourite LankaStay hotels, kept together for this session.</p></div><Link to="/hotels">Explore Hotels<ArrowRight aria-hidden="true" size={15} /></Link></div>
        {savedHotelRecords.length ? <div className="profile-saved-grid">{savedHotelRecords.map((item) => { const { hotel, destination, rating, reviewCount, fromRate } = item; return <article className="profile-saved-hotel" key={hotel.id}><img src={getHotelMainImage(hotel)} onError={applyImageFallback} alt={`${hotel.name} in ${destination?.name || "Sri Lanka"}`} /><div><span><MapPin aria-hidden="true" size={13} />{destination?.name || "Destination unavailable"}, {hotel.country}</span><h3>{hotel.name}</h3><p><Star aria-hidden="true" size={14} />{reviewCount ? `${rating.toFixed(1)} · ${reviewCount} ${reviewCount === 1 ? "Review" : "Reviews"}` : "New · No Reviews Yet"} · {fromRate ? `From ${formatLkr(fromRate)} / night` : "Check rates"}</p><div><Link to={`/hotels/${hotel.id}`}>View Hotel</Link><button type="button" aria-label={`Remove ${hotel.name} from saved hotels`} onClick={() => unsaveHotel(hotel.id)}><Heart aria-hidden="true" size={14} fill="currentColor" />Remove from Saved</button></div></div></article>; })}</div> : <div className="profile-empty-state"><Heart aria-hidden="true" size={24} /><h3>No saved hotels yet.</h3><p>Save hotels you like and find them here later.</p><Link to="/hotels">Explore Hotels</Link></div>}
      </section>

      <section className="profile-card profile-wide-section" id="my-reviews" aria-labelledby="my-reviews-title">
        <div className="profile-section-heading"><span><Star aria-hidden="true" size={20} /></span><div><h2 id="my-reviews-title">My Reviews</h2><p>Manage reviews connected to your completed stays.</p></div></div>
        {customerReviews.length ? <div className="profile-reviews-list">{customerReviews.map((review) => { const reviewHotel = hotels.find((hotel) => String(hotel.id) === String(review.hotelId)); const reviewReservation = reservations.find((item) => String(item.id) === String(review.reservationId)); return <article className="profile-review-card" key={review.id}>{reviewHotel && <img className="profile-review-hotel-photo" src={getHotelMainImage(reviewHotel)} onError={applyImageFallback} alt={`${reviewHotel.name} Main Photo`} />}<div className="profile-review-top"><div><span>{reviewHotel?.name || "Hotel information unavailable"}</span>{reviewReservation && <small>Reservation #{reviewReservation.reference} · {reviewReservation.roomName || "Reserved Room"} · stayed {formatReservationDate(reviewReservation.checkOut)}</small>}</div><span className="profile-review-rating" aria-label={`${review.overallRating} out of 5 stars`}><Star aria-hidden="true" size={14} fill="currentColor" />{review.overallRating} / 5</span></div><h3>{review.title || "Guest Review"}</h3><p>{review.comment}</p><footer><time dateTime={review.updatedAt || review.createdAt}>{formatReservationDate((review.updatedAt || review.createdAt).slice(0, 10))}{review.updatedAt !== review.createdAt ? " · Edited" : ""}</time><div>{review.status === "ACTIVE" && <><Link to={`/reviews/${review.id}`}>View</Link><button type="button" onClick={() => openReviewEditor(review)}><Pencil aria-hidden="true" size={14} />Edit Review</button></>}<button type="button" onClick={() => openDeleteReview(review)}><Trash2 aria-hidden="true" size={14} />Delete Review</button></div></footer></article>; })}</div> : <div className="profile-empty-state"><Star aria-hidden="true" size={24} /><h3>No reviews yet.</h3><p>After completing an eligible stay, you can share your experience.</p></div>}
      </section>

      <div className="profile-main-grid profile-account-grid">
        <section className="profile-card profile-account-card" aria-labelledby="account-security-title"><div className="profile-section-heading"><span><ShieldCheck aria-hidden="true" size={20} /></span><div><h2 id="account-security-title">Account Security</h2><p>Manage your account password securely.</p></div></div><button type="button" onClick={openPasswordModal}><KeyRound aria-hidden="true" size={16} />Change Password</button></section>
        <section className="profile-card profile-preferences" aria-labelledby="preferences-title"><div className="profile-section-heading"><span><Languages aria-hidden="true" size={20} /></span><div><h2 id="preferences-title">Preferences</h2><p>Choose your preferred account language.</p></div></div><div className="profile-language-row"><label htmlFor="preferred-language">Preferred Language</label><select id="preferred-language" value={preferredLanguage} onChange={(event) => { setPreferredLanguage(event.target.value); setPreferenceStatus(""); }}><option>English</option><option>Sinhala</option></select><button type="button" disabled={preferredLanguage === customer.preferredLanguage} onClick={handlePreferenceSave}>Save Preference</button></div>{preferenceStatus && <p className="profile-inline-status" role="status">{preferenceStatus}</p>}</section>
      </div>

      {editReview && <AccountModal labelId="edit-review-title" onClose={closeReviewEditor}><div className="profile-modal-heading"><span><Pencil size={20} /></span><div><h2 id="edit-review-title">Edit Review</h2><p>Update your rating and stay feedback.</p></div></div><form className="profile-modal-form" noValidate onSubmit={handleReviewUpdate}><div className="profile-field"><span>Overall Rating</span><ReviewStars interactive label="Overall Rating" value={reviewFields.rating} onChange={(rating) => setReviewFields((current) => ({ ...current, rating }))} />{reviewErrors.rating && <span>{reviewErrors.rating}</span>}</div><div className="profile-field"><label htmlFor="review-title">Review Title <small>(Optional)</small></label><input id="review-title" maxLength={100} value={reviewFields.title} onChange={(event) => setReviewFields((current) => ({ ...current, title: event.target.value }))} /></div><div className="profile-field"><label htmlFor="review-comment">Review Text</label><textarea id="review-comment" rows={5} maxLength={1000} value={reviewFields.comment} aria-invalid={Boolean(reviewErrors.comment)} onChange={(event) => { setReviewFields((current) => ({ ...current, comment: event.target.value })); setReviewErrors((current) => ({ ...current, comment: "" })); }} />{reviewErrors.comment && <span>{reviewErrors.comment}</span>}<small>{reviewFields.comment.length} / 1000</small></div>{reviewStatus && <p className="profile-modal-status" role="status">{reviewStatus}</p>}<div className="profile-modal-actions"><button type="button" onClick={closeReviewEditor}>Cancel</button><button type="submit">Save Review Changes</button></div></form></AccountModal>}

      {deleteReview && <AccountModal labelId="delete-review-title" onClose={closeDeleteReview}><div className="profile-modal-heading profile-modal-heading--danger"><span><Trash2 size={20} /></span><div><h2 id="delete-review-title">Permanently Delete Review?</h2><p>Are you sure you want to permanently delete this review?</p></div></div>{deleteStatus ? <div className="profile-modal-ready"><CheckCircle2 aria-hidden="true" size={23} /><p role="status">{deleteStatus}</p><button type="button" onClick={closeDeleteReview}>Close</button></div> : <div className="profile-delete-copy"><strong>{deleteReview.title || "Your review"}</strong><p>This action cannot be undone. Management will not be able to restore a review you delete.</p><div className="profile-modal-actions"><button type="button" onClick={closeDeleteReview}>Cancel</button><button type="button" className="is-danger" onClick={handleDeleteReview}>Delete Review</button></div></div>}</AccountModal>}

      {isPasswordOpen && <AccountModal labelId="change-password-title" onClose={closePasswordModal}><div className="profile-modal-heading"><span><KeyRound size={20} /></span><div><h2 id="change-password-title">Change Password</h2><p>Set a new password for your LankaStay account.</p></div></div><form className="profile-modal-form" noValidate onSubmit={handlePasswordChange}>{[["current","Current Password"],["next","New Password"],["confirm","Confirm New Password"]].map(([field,label]) => <div className="profile-field" key={field}><label htmlFor={`password-${field}`}>{label}</label><div className="profile-password-input"><input id={`password-${field}`} type={showPasswords ? "text" : "password"} autoComplete={field === "current" ? "current-password" : "new-password"} value={passwordFields[field]} aria-invalid={Boolean(passwordErrors[field])} onChange={(event) => { setPasswordFields((current) => ({ ...current, [field]: event.target.value })); setPasswordErrors((current) => ({ ...current, [field]: "" })); }} /><button type="button" aria-label={showPasswords ? "Hide passwords" : "Show passwords"} onClick={() => setShowPasswords((current) => !current)}>{showPasswords ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}</button></div>{passwordErrors[field] && <span>{passwordErrors[field]}</span>}</div>)}{passwordStatus && <p className="profile-modal-status" role="status">{passwordStatus}</p>}<div className="profile-modal-actions"><button type="button" onClick={closePasswordModal}>Cancel</button><button type="submit" disabled={savingPassword}>{savingPassword ? "Updating..." : "Change Password"}</button></div></form></AccountModal>}
    </div>
  );
}

export default Profile;
