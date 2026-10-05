import {
  BedDouble,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  House,
  Images,
  Languages as LanguagesIcon,
  MapPin,
  Play,
  Ruler,
  Sparkles,
  Star,
  Tag,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import HotelAvailability from "../../components/HotelAvailability/HotelAvailability.jsx";
import HotelAccommodation from "../../components/HotelAccommodation/HotelAccommodation.jsx";
import HotelDining from "../../components/HotelDining/HotelDining.jsx";
import HotelExperiences from "../../components/HotelExperiences/HotelExperiences.jsx";
import HotelFacilities from "../../components/HotelFacilities/HotelFacilities.jsx";
import HotelGallery from "../../components/HotelGallery/HotelGallery.jsx";
import HotelLocation from "../../components/HotelLocation/HotelLocation.jsx";
import HotelOffers from "../../components/HotelOffers/HotelOffers.jsx";
import HotelPolicies from "../../components/HotelPolicies/HotelPolicies.jsx";
import HotelReviews from "../../components/HotelReviews/HotelReviews.jsx";
import useSavedHotels from "../../context/useSavedHotels.js";
import useHotels from "../../context/useHotels.js";
import usePropertyContent from "../../context/usePropertyContent.js";
import useReviews from "../../context/useReviews.js";
import useHotelDiscovery from "../../hooks/useHotelDiscovery.js";
import { getHotelSearchContext } from "../../utils/hotelDiscovery.js";
import { formatRateAmount } from "../../utils/rateFormatting.js";
import { getRatingLabel } from "../../utils/reviewDomain.js";
import { getFacilityIcon } from "../../utils/facilityIcons.js";
import { applyImageFallback, getHotelDisplayImages, getHotelGalleryImages, getHotelMainImage } from "../../utils/hotelMedia.js";
import "./HotelDetails.css";
import "./HotelDetailsVisualRefinement.css";

const hotelDetailTabs = [
  { id: "overview", label: "Overview", icon: House },
  { id: "accommodation", label: "Accommodation", icon: BedDouble },
  { id: "dining", label: "Dining", icon: Utensils },
  { id: "facilities", label: "Facilities", icon: Sparkles },
  { id: "experiences", label: "Experiences", icon: Compass },
  { id: "offers", label: "Offers", icon: Tag },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "location", label: "Location", icon: MapPin },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "policies", label: "Policies", icon: ClipboardList },
];

function HotelDetails() {
  const videoRef = useRef(null);
  const videoOpenRef = useRef(null);
  const videoCloseRef = useRef(null);
  const touchStartX = useRef(null);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const searchContext = useMemo(() => getHotelSearchContext(searchParams), [searchParams]);
  const { hotelCards } = useHotelDiscovery(searchContext);
  const { publicHotels, loadPublicHotel } = useHotels();
  const { diningItems, experiences, facilities, offers } = usePropertyContent();
  const { getHotelAverageRating, getHotelReviewCount } = useReviews();
  const hotel = publicHotels.find((item) => String(item.id) === String(id));
  const hotelData = hotelCards.find((item) => String(item.hotel.id) === String(id));
  const { isHotelSaved, toggleSavedHotel } = useSavedHotels();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState(null);
  const isFavourite = hotel ? isHotelSaved(hotel.id) : false;
  const reviewRating = hotel ? getHotelAverageRating(hotel.id) : null;
  const reviewCount = hotel ? getHotelReviewCount(hotel.id) : 0;

  const allImages = hotel ? getHotelDisplayImages(hotel) : [];
  const thumbnailImages = allImages.slice(0, 5);

  useEffect(() => {
    let active = true;
    setDetailLoading(true);
    setDetailError(null);
    loadPublicHotel(id)
      .catch((error) => { if (active) setDetailError(error); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [id, loadPublicHotel]);

  useEffect(() => {
    if (!isGalleryOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsGalleryOpen(false);
      if (event.key === "ArrowLeft") {
        setActiveImageIndex(
          (currentIndex) =>
            (currentIndex - 1 + allImages.length) % allImages.length,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveImageIndex(
          (currentIndex) => (currentIndex + 1) % allImages.length,
        );
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [allImages.length, isGalleryOpen]);

  useEffect(() => {
    if (!isVideoOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const activeVideo = videoRef.current;
    const activeVideoOpener = videoOpenRef.current;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsVideoOpen(false);
    };

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => videoCloseRef.current?.focus());
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      activeVideo?.pause();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      activeVideoOpener?.focus();
    };
  }, [isVideoOpen]);

  useEffect(() => {
    if (!hotel) return undefined;

    const observedSections = [
      "overview",
      "accommodation",
      "dining",
      "facilities",
      "experiences",
      "offers",
      "gallery",
      "location",
      "reviews",
      "policies",
    ]
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry) setActiveTab(visibleEntry.target.id);
      },
      {
        rootMargin: "-24% 0px -58% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
    return () => sectionObserver.disconnect();
  }, [hotel]);

  if (detailLoading) {
    return <main className="hotel-not-found" role="status"><h1>Loading hotel...</h1></main>;
  }

  if (detailError && detailError.status !== 404) {
    return <main className="hotel-not-found" role="alert"><h1>Unable to load hotel information. Please try again.</h1><p>{detailError.message}</p><Link to="/hotels">Back to Hotels</Link></main>;
  }

  if (!hotel || detailError?.status === 404) {
    return (
      <main className="hotel-not-found">
        <span aria-hidden="true">
          <Images size={28} />
        </span>
        <h1>Hotel not found</h1>
        <p>The hotel you are looking for may no longer be available.</p>
        <Link to="/hotels">Back to Hotels</Link>
      </main>
    );
  }

  const showPreviousImage = () => {
    setActiveImageIndex(
      (currentIndex) =>
        (currentIndex - 1 + allImages.length) % allImages.length,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex(
      (currentIndex) => (currentIndex + 1) % allImages.length,
    );
  };

  const openGalleryAt = (imageIndex) => {
    setActiveImageIndex(imageIndex);
    setIsGalleryOpen(true);
  };

  const handleCheckAvailability = () => {
    const availabilitySection = document.querySelector("#availability");

    if (availabilitySection) {
      availabilitySection.scrollIntoView({ behavior: "smooth" });
      return;
    }

    console.log("Check availability for:", hotel.id);
  };

  const handleTabClick = (tabId) => {
    const targetSection = document.querySelector(`#${tabId}`);
    if (!targetSection) return;

    setActiveTab(tabId);
    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeVideoModal = () => {
    videoRef.current?.pause();
    setIsVideoOpen(false);
  };

  const visibleTabs = hotelDetailTabs.filter((tab) => {
    if (tab.id === 'dining') return diningItems.some((item) => String(item.hotelId) === String(hotel.id) && item.active === true)
    if (tab.id === 'facilities') return (hotel.facilityIds || []).some((id) => facilities.some((item) => String(item.id) === String(id) && item.active))
    if (tab.id === 'experiences') return experiences.some((item) => item.contentType === 'EXPERIENCE' && item.active === true && (String(item.hotelId) === String(hotel.id) || (item.relatedHotelIds || []).some((id) => String(id) === String(hotel.id))))
    if (tab.id === 'policies') return Boolean((hotel.policyRecords || []).some((policy) => policy.status === 'ACTIVE') || hotel.policies || hotel.checkInTime || hotel.checkOutTime)
    return true
  })

  return (
    <main className="hotel-detail-page">
      <section className="hotel-detail-shell" aria-labelledby="hotel-detail-title">
        <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link to="/hotels">Hotels</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{hotel.name}</span>
        </nav>

        <div className="hotel-detail-banner">
          <img
            className="hotel-detail-banner-image"
            key={activeImageIndex}
            src={allImages[activeImageIndex]}
            onError={applyImageFallback}
            alt={`${hotel.name} in ${hotelData?.destination?.name || "Sri Lanka"}`}
            onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX }}
            onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStartX.current == null || end == null || Math.abs(end - touchStartX.current) < 45) return; if (end < touchStartX.current) showNextImage(); else showPreviousImage(); touchStartX.current = null }}
          />
          <div className="hotel-detail-banner-overlay" aria-hidden="true" />

          {allImages.length > 1 && (
            <>
              <button
                aria-label="Previous hotel photo"
                className="hotel-detail-banner-arrow hotel-detail-banner-arrow--previous"
                type="button"
                onClick={showPreviousImage}
              >
                <ChevronLeft aria-hidden="true" size={22} />
              </button>
              <button
                aria-label="Next hotel photo"
                className="hotel-detail-banner-arrow hotel-detail-banner-arrow--next"
                type="button"
                onClick={showNextImage}
              >
                <ChevronRight aria-hidden="true" size={22} />
              </button>
            </>
          )}

          <div className="hotel-detail-overlay-content">
            <span className="hotel-detail-category">{hotel.propertyType || hotel.category}</span>
            <h1 id="hotel-detail-title">{hotel.name}</h1>

            <div className="hotel-detail-meta">
              <span>
                <MapPin aria-hidden="true" size={16} />
                {hotelData?.destination ? `${hotelData.destination.name}, Sri Lanka` : "Destination unavailable"}
              </span>
              <span>
                <Star aria-hidden="true" size={16} />
                <strong>{reviewCount ? reviewRating.toFixed(1) : "New"}</strong> ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
              <span className="hotel-detail-rating-label">{getRatingLabel(reviewRating, reviewCount)}</span>
            </div>

            <p className="hotel-detail-tagline">
              {hotel.tagline || hotel.shortDescription}
            </p>

            <ul className="hotel-detail-facilities" aria-label="Hotel highlights">
              {(hotel.facilityIds || []).map((facilityId) => facilities.find((item) => String(item.id) === String(facilityId))).filter((item) => item?.active).slice(0, 5).map((facility) => {
                const FacilityIcon = getFacilityIcon(facility.iconKey);
                return (
                  <li key={facility.id}>
                    <FacilityIcon aria-hidden="true" size={15} />
                    {facility.name}
                  </li>
                );
              })}
            </ul>

            <div className="hotel-detail-actions">
              <button
                className="hotel-detail-availability-button"
                type="button"
                onClick={handleCheckAvailability}
              >
                <CalendarCheck aria-hidden="true" size={17} />
                Check Availability
              </button>
              <button
                aria-label={`${isFavourite ? "Remove" : "Add"} ${hotel.name} ${
                  isFavourite ? "from" : "to"
                } favourites`}
                aria-pressed={isFavourite}
                className={`hotel-detail-save-button${
                  isFavourite ? " hotel-detail-save-button--active" : ""
                }`}
                type="button"
                onClick={() => toggleSavedHotel(hotel.id)}
              >
                <Heart aria-hidden="true" size={17} />
                {isFavourite ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <div className="hotel-detail-price">
            <span>From</span>
            <strong>{hotelData?.finalNightRate ? formatRateAmount(hotelData.finalNightRate) : "Check rates"}</strong>
            <small>/ night</small>
          </div>

          <div className="hotel-detail-thumbnail-strip">
            {thumbnailImages.map((image, index) => {
              const isLastThumbnail = index === thumbnailImages.length - 1;
              const isViewAllTile = isLastThumbnail && allImages.length > 1;

              return (
                <button
                  aria-label={
                    isViewAllTile
                      ? `View all ${allImages.length} photos`
                      : `Show hotel photo ${index + 1}`
                  }
                  aria-pressed={!isViewAllTile && activeImageIndex === index}
                  className={`hotel-detail-thumbnail${
                    activeImageIndex === index ? " hotel-detail-thumbnail--active" : ""
                  }`}
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    if (isViewAllTile) {
                      setIsGalleryOpen(true);
                    } else {
                      setActiveImageIndex(index);
                    }
                  }}
                >
                  <img src={image} onError={applyImageFallback} alt="" />
                  {isViewAllTile && (
                    <span>
                      <Images aria-hidden="true" size={16} />
                      View All
                      <small>{allImages.length} Photos</small>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <nav className="hotel-detail-tabs" aria-label="Hotel detail sections">
        <div className="hotel-detail-tabs-inner">
          {visibleTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={`hotel-detail-tab${
                  isActive ? " hotel-detail-tab--active" : ""
                }`}
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
              >
                <TabIcon aria-hidden="true" size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className={`hotel-about-section${hotel.video ? '' : ' hotel-about-section--no-video'}`} id="overview">
        <div className="hotel-about-copy">
          <div className="hotel-about-heading">
            <span aria-hidden="true">2</span>
            <h2>About Hotel</h2>
          </div>
          <p className="hotel-about-description">
            {hotel.detailDescription || hotel.shortDescription}
          </p>

          <div className="hotel-at-a-glance"><h3>At a Glance</h3><dl className="hotel-quick-facts">
            <div>
              <Building2 aria-hidden="true" size={18} />
              <dt>Property Type</dt>
              <dd>{hotel.propertyType || hotel.category}</dd>
            </div>
            <div><CalendarDays aria-hidden="true" size={18} /><dt>Check-in</dt><dd>{hotel.checkInTime}</dd></div>
            <div><CalendarCheck aria-hidden="true" size={18} /><dt>Check-out</dt><dd>{hotel.checkOutTime}</dd></div>
            <div>
              <LanguagesIcon aria-hidden="true" size={18} />
              <dt>Languages</dt>
              <dd>{(Array.isArray(hotel.languages) ? hotel.languages.join(", ") : hotel.languages) || "Not configured"}</dd>
            </div>
            <div>
              <Calendar aria-hidden="true" size={18} />
              <dt>Year Opened</dt>
              <dd>{hotel.yearOpened || "—"}</dd>
            </div>
            <div>
              <Ruler aria-hidden="true" size={18} />
              <dt>Property Size</dt>
              <dd>{hotel.propertySize || "Not configured"}</dd>
            </div>
          </dl></div>
        </div>

        {hotel.video ? (
          <button
            aria-label={`Watch video about ${hotel.name}`}
            className="hotel-video-preview"
            ref={videoOpenRef}
            type="button"
            onClick={() => setIsVideoOpen(true)}
          >
            <img
              src={getHotelGalleryImages(hotel)[0] || getHotelMainImage(hotel)}
              alt={`${hotel.name} video preview`}
            />
            <span className="hotel-video-preview-overlay" aria-hidden="true" />
            <span className="hotel-video-play" aria-hidden="true">
              <Play size={24} fill="currentColor" />
            </span>
            <span className="hotel-video-preview-copy">
              <small>Discover the property</small>
              <strong>Watch {hotel.name}</strong>
            </span>
          </button>
        ) : null}
      </section>

      <HotelAvailability hotel={hotel} initialValues={searchContext} />
      <HotelAccommodation hotel={hotel} searchContext={searchContext} />
      <HotelDining
        key={`dining-${hotel.id}`}
        hotel={hotel}
        diningItems={diningItems}
      />
      <HotelFacilities
        key={`facilities-${hotel.id}`}
        facilities={(hotel.facilityIds || []).map((facilityId) => facilities.find((item) => String(item.id) === String(facilityId))).filter((item) => item?.active)}
      />
      <HotelExperiences
        key={`experiences-${hotel.id}`}
        hotel={hotel}
        experiences={experiences}
      />
      <HotelOffers key={`offers-${hotel.id}`} hotel={hotel} offers={offers} />
      <HotelGallery
        hotel={hotel}
        images={allImages}
        onOpenGallery={openGalleryAt}
      />
      <HotelLocation key={`location-${hotel.id}`} hotel={hotel} />
      <HotelReviews
        key={`reviews-${hotel.id}`}
        hotel={hotel}
      />
      <HotelPolicies key={`policies-${hotel.id}`} hotel={hotel} />

      {isGalleryOpen && (
        <div
          className="hotel-gallery-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsGalleryOpen(false);
          }}
        >
          <div
            aria-label={`${hotel.name} photo gallery`}
            aria-modal="true"
            className="hotel-gallery-modal"
            role="dialog"
          >
            <div className="hotel-gallery-modal-header">
              <span>
                {activeImageIndex + 1} / {allImages.length}
              </span>
              <button
                aria-label="Close gallery"
                type="button"
                onClick={() => setIsGalleryOpen(false)}
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>

            <div className="hotel-gallery-modal-stage">
              {allImages.length > 1 && (
                <button
                  aria-label="Previous photo"
                  className="hotel-gallery-modal-nav hotel-gallery-modal-nav--previous"
                  type="button"
                  onClick={showPreviousImage}
                >
                  <ChevronLeft aria-hidden="true" size={25} />
                </button>
              )}
              <img
                src={allImages[activeImageIndex]}
                onError={applyImageFallback}
                alt={`${hotel.name} photo ${activeImageIndex + 1}`}
              />
              {allImages.length > 1 && (
                <button
                  aria-label="Next photo"
                  className="hotel-gallery-modal-nav hotel-gallery-modal-nav--next"
                  type="button"
                  onClick={showNextImage}
                >
                  <ChevronRight aria-hidden="true" size={25} />
                </button>
              )}
            </div>

            <div className="hotel-gallery-modal-thumbnails">
              {allImages.map((image, index) => (
                <button
                  aria-label={`Show photo ${index + 1}`}
                  aria-pressed={activeImageIndex === index}
                  className={
                    activeImageIndex === index
                      ? "hotel-gallery-modal-thumbnail hotel-gallery-modal-thumbnail--active"
                      : "hotel-gallery-modal-thumbnail"
                  }
                  key={`${image}-thumbnail`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} onError={applyImageFallback} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isVideoOpen && hotel.video && (
        <div
          className="hotel-video-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeVideoModal();
          }}
        >
          <div
            aria-label={`${hotel.name} video`}
            aria-modal="true"
            className="hotel-video-modal"
            role="dialog"
          >
            <button
              aria-label="Close hotel video"
              className="hotel-video-modal-close"
              ref={videoCloseRef}
              type="button"
              onClick={closeVideoModal}
            >
              <X aria-hidden="true" size={22} />
            </button>
            <video
              autoPlay
              controls
              playsInline
              poster={getHotelGalleryImages(hotel)[0] || getHotelMainImage(hotel)}
              ref={videoRef}
              src={hotel.video}
            >
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      )}
    </main>
  );
}

export default HotelDetails;
