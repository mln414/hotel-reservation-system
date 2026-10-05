import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  Coffee,
  Compass,
  Flower2,
  Gift,
  Headphones,
  Heart,
  Landmark,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  TreePalm,
  Trees,
  Utensils,
  Waves,
  Wifi,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import OfferCard from "../../components/OfferCard/OfferCard.jsx";

import yalaImage from "../../assets/images/home/hero/yala-safari-resort.png";
import nuwaraEliyaImage from "../../assets/images/home/hero/nuwara-eliya-hill-resort.png";
import galleImage from "../../assets/images/home/hero/galle-ocean-resort.png";
import sigiriyaImage from "../../assets/images/home/hero/sigiriya-rock-resort.png";
import kandyImage from "../../assets/images/home/hero/kandy-lake-resort.png";
import usePropertyContent from "../../context/usePropertyContent.js";
import useReviews from "../../context/useReviews.js";
import useHotels from "../../context/useHotels.js";
import useWebsiteContent from "../../context/useWebsiteContent.js";
import useStayCollections from "../../context/useStayCollections.js";
import useHotelDiscovery from "../../hooks/useHotelDiscovery.js";
import useSavedHotels from "../../context/useSavedHotels.js";
import useDestinations from "../../context/useDestinations.js";
import useRooms from "../../context/useRooms.js";
import useRates from "../../context/useRates.js";
import { getCollectionIcon } from "../../utils/collectionIcons.jsx";
import { getCollectionSearchUrl } from "../../utils/stayCollectionDomain.js";
import { getExperienceHeroImage, getFeaturedExperiences, getPublicFeaturedHotels, getValidHeroSlides } from "../../utils/contentDomain.js";
import { applyImageFallback, getHotelMainImage } from "../../utils/hotelMedia.js";
import { formatOfferDiscount } from "../../utils/offerEligibility.js";
import { getPublicOfferEligibility, getCustomerOffers } from "../../utils/customerOffers.js";

import "./Home.css";

const fallbackHeroSlides = [
  { image: yalaImage, label: "Yala" },
  { image: nuwaraEliyaImage, label: "Nuwara Eliya" },
  { image: galleImage, label: "Galle" },
  { image: sigiriyaImage, label: "Sigiriya" },
  { image: kandyImage, label: "Kandy" },
];

const facilityIcons = {
  Pool: Waves,
  "Swimming Pool": Waves,
  "Wi-Fi": Wifi,
  "Free Wi-Fi": Wifi,
  Breakfast: Coffee,
  "Beach Access": TreePalm,
  Restaurant: Utensils,
  Courtyard: Landmark,
  "City View": Building2,
  Spa: Flower2,
  "Nature View": Trees,
  Garden: Flower2,
  "Mountain View": Mountain,
};

const priceFormatter = new Intl.NumberFormat("en-LK");

const bookingBenefits = [
  {
    id: 1,
    title: "Best Price Guarantee",
    description: "Enjoy our best available rates when you book directly.",
    icon: BadgeCheck,
  },
  {
    id: 2,
    title: "Instant Confirmation",
    description: "Receive your reservation confirmation immediately.",
    icon: CircleCheckBig,
  },
  {
    id: 3,
    title: "Flexible Booking",
    description: "Modify or cancel eligible reservations with ease.",
    icon: CalendarDays,
  },
  {
    id: 4,
    title: "Exclusive Offers",
    description: "Access special offers available only through LankaStay.",
    icon: Gift,
  },
  {
    id: 5,
    title: "Secure Reservation",
    description: "Your personal and booking information is handled securely.",
    icon: ShieldCheck,
  },
  {
    id: 6,
    title: "Direct Hotel Support",
    description: "Get assistance directly from our hotel support team.",
    icon: Headphones,
  },
];

function Home() {
  const { offers, experiences: experienceData } = usePropertyContent();
  const { publicHotels: hotels } = useHotels();
  const { hotelCards } = useHotelDiscovery();
  const { isHotelSaved, toggleSavedHotel } = useSavedHotels();
  const { heroSlides: heroConfiguration, heroSettings, featuredHotelIds, featuredExperienceIds } = useWebsiteContent();
  const { getHotelAverageRating, getHotelReviewCount } = useReviews();
  const { homeCollections: collections } = useStayCollections();
  const { activeDestinations } = useDestinations();
  const { rooms, physicalRooms } = useRooms();
  const { getCurrentRoomRate } = useRates();
  const publicOfferOptions = { physicalRooms, getCurrentRoomRate };
  const canonicalPublicOffers = getCustomerOffers(offers, hotels, rooms, publicOfferOptions);
  const specialOffers = canonicalPublicOffers.filter((offer) => offer.featured).slice(0, 3);
  const managedHeroSlides = getValidHeroSlides(heroConfiguration, hotels);
  const heroSlides = managedHeroSlides.length ? managedHeroSlides : fallbackHeroSlides;
  const sharedFeaturedHotels = getPublicFeaturedHotels(featuredHotelIds, hotels);
  const featuredHotels = sharedFeaturedHotels.length ? sharedFeaturedHotels : hotels.filter((hotel) => hotel.featured);
  const homeDestinations = activeDestinations.map((destination) => {
    return {
      ...destination,
      subtitle: destination.category || destination.shortDescription,
      hotelCount: hotels.filter((hotel) => String(hotel.destinationId) === String(destination.id)).length,
    };
  }).filter((destination) => destination.image);
  const featuredContent = getFeaturedExperiences(experienceData, featuredExperienceIds);
  const experiences = featuredContent.filter((item) => item.contentType !== 'TRAVEL_STORY');
  const travelStories = featuredContent.filter((item) => item.contentType === 'TRAVEL_STORY');
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  function handleRoomSearch(searchValues) {
    const searchParams = new URLSearchParams(searchValues);
    navigate(`/hotels?${searchParams.toString()}`);
  }

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (prefersReducedMotion.matches || !heroSettings.autoplay || heroSlides.length <= 1) return undefined;

    const slideTimer = window.setInterval(() => {
      setActiveSlide((currentSlide) =>
        currentSlide === heroSlides.length - 1 ? 0 : currentSlide + 1,
      );
    }, heroSettings.transitionSeconds * 1000);

    return () => window.clearInterval(slideTimer);
  }, [activeSlide, heroSettings.autoplay, heroSettings.transitionSeconds, heroSlides.length]);

  return (
    <div className="home-page">
      <section
        className={`hero-section hero-section--${heroSettings.animation.toLowerCase()}`}
        style={{
          "--hero-backdrop-image": `url("${heroSlides[activeSlide].image}")`,
        }}
      >
        <div className="hero-image-backdrop" aria-hidden="true" />
        <img
          key={`hero-slide-${activeSlide}-${heroSlides[activeSlide].image}`}
          className="hero-slide-image"
          src={heroSlides[activeSlide].image}
          alt={heroSlides[activeSlide].hotel ? heroSlides[activeSlide].hotel.name : `${heroSlides[activeSlide].label} LankaStay Hotel`}
        />
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="hero-small-title">WELCOME TO LANKASTAY</p>

          <h1>
            Discover Sri Lanka,
            <span> One Extraordinary Stay at a Time</span>
          </h1>

          <p className="hero-description">
            Explore carefully selected hotels and resorts across Sri Lanka. Find
            the perfect stay for your next journey.
          </p>

          <div className="hero-buttons">
            <Link to={heroSlides[activeSlide].hotel ? `/hotels/${heroSlides[activeSlide].hotel.id}` : "/hotels"} className="hero-primary-button">
              {heroSlides[activeSlide].hotel ? `Explore ${heroSlides[activeSlide].hotel.name}` : 'Explore Our Hotels'}
            </Link>

            <Link to="/rooms/search" className="hero-secondary-button">
              Book Your Stay
            </Link>
          </div>
        </div>

        {heroSlides.length > 1 && <button className="hero-manual hero-manual--previous" type="button" aria-label="Previous Hero slide" onClick={() => setActiveSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length)}>‹</button>}
        {heroSlides.length > 1 && <button className="hero-manual hero-manual--next" type="button" aria-label="Next Hero slide" onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}>›</button>}
        <div className="hero-slide-controls" aria-label="Select hero image">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id || slide.label}
              type="button"
              className={`hero-slide-dot ${index === activeSlide ? "hero-slide-dot--active" : ""}`}
              aria-label={`Show ${slide.hotel?.name || slide.label} Hero image`}
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>

      <div className="home-search-panel">
        <SearchBar onSearch={handleRoomSearch} />
      </div>

      <section
        className="collections-section"
        aria-labelledby="collections-title"
      >
        <div className="collections-container">
          <header className="collections-header">
            <p className="collections-eyebrow">DISCOVER YOUR STYLE</p>
            <h2 className="collections-title" id="collections-title">
              Browse by Collection
            </h2>
            <p className="collections-subtitle">
              Find the perfect stay for every kind of journey.
            </p>
            <span className="collections-divider" aria-hidden="true" />
          </header>

          <div className="collections-grid">
            {collections.map((collection) => {
              const CollectionIcon = getCollectionIcon(collection.iconKey);

              return (
                <article className="collection-card" key={collection.id}>
                  <Link
                    className="collection-card-link"
                    to={getCollectionSearchUrl(collection)}
                    aria-label={`Explore ${collection.title} hotels`}
                  >
                    <img
                      className="collection-image"
                      src={collection.coverImage}
                      onError={applyImageFallback}
                      alt={`${collection.title} collection`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="collection-overlay" aria-hidden="true" />

                    <div className="collection-content">
                      <span className="collection-icon" aria-hidden="true">
                        <CollectionIcon size={20} strokeWidth={1.9} />
                      </span>
                      <h3 className="collection-name">{collection.title}</h3>
                      <p className="collection-description">
                        {collection.shortDescription}
                      </p>
                      <span className="collection-explore">
                        Explore
                        <ArrowUpRight
                          size={17}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="destinations-section"
        aria-labelledby="destinations-title"
      >
        <div className="destinations-container">
          <header className="destinations-header">
            <p className="destinations-eyebrow">EXPLORE SRI LANKA</p>
            <h2 className="destinations-title" id="destinations-title">
              Hotels by Destination
            </h2>
            <p className="destinations-subtitle">
              Discover handpicked stays across Sri Lanka’s most beautiful
              destinations.
            </p>
            <span className="destinations-divider" aria-hidden="true" />
          </header>

          <div className="destinations-grid">
            {homeDestinations.map((destination) => (
              <article className="destination-card" key={destination.id}>
                <Link
                  className="destination-card-link"
                  to={`/hotels?destination=${destination.slug}`}
                  aria-label={`Explore hotels in ${destination.name}`}
                >
                  <img
                    className="destination-card-image"
                    src={destination.image}
                    alt={`${destination.name}, Sri Lanka`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    className="destination-card-overlay"
                    aria-hidden="true"
                  />

                  <div className="destination-card-content">
                    <span className="destination-card-icon" aria-hidden="true">
                      <MapPin size={18} strokeWidth={2} />
                    </span>
                    <h3 className="destination-card-name">
                      {destination.name}
                    </h3>
                    <p className="destination-card-subtitle">
                      {destination.subtitle}
                    </p>
                    <div className="destination-card-meta">
                      <span className="destination-hotel-count">
                        {destination.hotelCount} hotels
                      </span>
                      <span className="destination-card-explore">
                        Explore
                        <ArrowUpRight
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="destinations-actions">
            <Link className="view-all-destinations-button" to="/destinations">
              View All Destinations
              <ArrowUpRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="featured-hotels-section"
        aria-labelledby="featured-hotels-title"
      >
        <div className="featured-hotels-container">
          <header className="featured-hotels-header">
            <p className="featured-hotels-eyebrow">HANDPICKED STAYS</p>
            <h2 className="featured-hotels-title" id="featured-hotels-title">
              Featured Hotels
            </h2>
            <p className="featured-hotels-subtitle">
              Stay at some of our most loved hotels and resorts across Sri
              Lanka.
            </p>
            <span className="featured-hotels-divider" aria-hidden="true" />
          </header>

          <div className="featured-hotels-grid">
            {featuredHotels.map((hotel) => {
              const hotelData = hotelCards.find((item) => String(item.hotel.id) === String(hotel.id));
              if (!hotelData) return null;
              const isFavorite = isHotelSaved(hotel.id);
              const hotelOffers = hotelData.currentOffers;
              const featuredOffer = hotelData.advertisedOffer;
              const hotelWideOffer = featuredOffer?.applicableHotelIds?.some((id) => String(id) === String(hotel.id));

              return (
                <article className="featured-hotel-card" key={hotel.id}>
                  <Link
                    className="featured-hotel-card-link"
                    to={`/hotels/${hotel.id}`}
                    aria-label={`View ${hotel.name}`}
                  />

                  <div className="featured-hotel-image-wrapper">
                    <img
                      className="featured-hotel-image"
                      src={getHotelMainImage(hotel)}
                      onError={applyImageFallback}
                      alt={`${hotel.name} in ${hotelData.destination?.name || "Sri Lanka"}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span
                      className="featured-hotel-image-overlay"
                      aria-hidden="true"
                    />
                    <span className="featured-hotel-category">
                      {hotel.propertyType}
                    </span>
                    <button
                      type="button"
                      className={`featured-hotel-favourite ${isFavorite ? "featured-hotel-favourite--selected" : ""}`}
                      aria-label={`${isFavorite ? "Remove" : "Add"} ${hotel.name} ${isFavorite ? "from" : "to"} favourites`}
                      aria-pressed={isFavorite}
                      onClick={() => toggleSavedHotel(hotel.id)}
                    >
                      <Heart
                        size={19}
                        strokeWidth={2}
                        fill={isFavorite ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="featured-hotel-content">
                    <h3 className="featured-hotel-name">{hotel.name}</h3>

                    <div className="featured-hotel-summary">
                      <span className="featured-hotel-location">
                        <MapPin size={15} strokeWidth={2} aria-hidden="true" />
                        {hotelData.destination?.name || "Destination unavailable"}
                      </span>
                      <span
                        className="featured-hotel-rating"
                        aria-label={getHotelReviewCount(hotel.id) ? `${getHotelAverageRating(hotel.id)} out of 5 from ${getHotelReviewCount(hotel.id)} reviews` : "No Reviews Yet"}
                      >
                        <Star
                          size={15}
                          strokeWidth={2}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                        <strong>{getHotelReviewCount(hotel.id) ? getHotelAverageRating(hotel.id).toFixed(1) : "New"}</strong>
                        <span>{getHotelReviewCount(hotel.id) ? `(${getHotelReviewCount(hotel.id)})` : "No Reviews Yet"}</span>
                      </span>
                    </div>

                    <p className="featured-hotel-description">
                      {hotel.shortDescription || hotel.description}
                    </p>

                    <ul
                      className="featured-hotel-facilities"
                      aria-label={`${hotel.name} facilities`}
                    >
                      {hotelData.facilities.slice(0, 4).map((facility) => {
                        const FacilityIcon = facilityIcons[facility.name] || Sparkles;

                        return (
                          <li
                            className="featured-hotel-facility"
                            key={facility.id}
                          >
                            <FacilityIcon
                              size={14}
                              strokeWidth={1.9}
                              aria-hidden="true"
                            />
                            {facility.name}
                          </li>
                        );
                      })}
                    </ul>

                    {featuredOffer && <div className="featured-hotel-offer"><strong>{hotelOffers.length > 1 ? `Up to ${formatOfferDiscount(featuredOffer)}` : hotelWideOffer ? `${formatOfferDiscount(featuredOffer)} available` : `${formatOfferDiscount(featuredOffer)} on selected rooms`}</strong><span>{featuredOffer.title}</span></div>}

                    <div className="featured-hotel-footer">
                      <p className="featured-hotel-price">
                        <span className="featured-hotel-price-label">From</span>
                        {hotelData.fromRate ? `LKR ${priceFormatter.format(hotelData.fromRate)}` : "Check rates"}
                        <span className="featured-hotel-price-night">
                          per night
                        </span>
                      </p>
                      <Link
                        className="featured-hotel-button"
                        to={`/hotels/${hotel.id}`}
                      >
                        View Hotel
                        <ArrowRight
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="featured-hotels-actions">
            <Link className="view-all-hotels-button" to="/hotels">
              View All Hotels
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="why-book-direct-section"
        aria-labelledby="why-book-direct-title"
      >
        <div className="why-book-direct-container">
          <header className="why-book-direct-header">
            <p className="why-book-direct-eyebrow">BOOK WITH CONFIDENCE</p>
            <h2 className="why-book-direct-title" id="why-book-direct-title">
              Why Book Direct
            </h2>
            <p className="why-book-direct-subtitle">
              Enjoy more value, flexibility, and support when you reserve
              through LankaStay.
            </p>
            <span className="why-book-direct-divider" aria-hidden="true" />
          </header>

          <div className="why-book-direct-grid">
            {bookingBenefits.map((benefit) => {
              const BenefitIcon = benefit.icon;

              return (
                <article className="booking-benefit-item" key={benefit.id}>
                  <span className="booking-benefit-icon" aria-hidden="true">
                    <BenefitIcon size={25} strokeWidth={1.8} />
                  </span>
                  <div className="booking-benefit-content">
                    <h3 className="booking-benefit-title">{benefit.title}</h3>
                    <p className="booking-benefit-description">
                      {benefit.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="special-offers-section"
        aria-labelledby="special-offers-title"
      >
        <div className="special-offers-container">
          <header className="special-offers-header">
            <p className="special-offers-eyebrow">LIMITED-TIME DEALS</p>
            <h2 className="special-offers-title" id="special-offers-title">
              Special Offers
            </h2>
            <p className="special-offers-subtitle">
              Discover exclusive savings and memorable stays across LankaStay
              Hotels & Resorts.
            </p>
            <span className="special-offers-divider" aria-hidden="true" />
          </header>

          <div className="special-offers-grid">
            {specialOffers.map((offer) => <OfferCard key={offer.id} offer={offer} coverage={getPublicOfferEligibility(offer, { publicHotels: hotels, rooms, ...publicOfferOptions })} variant="home" />)}
          </div>

          <div className="special-offers-actions">
            <Link className="view-all-offers-button" to="/offers">
              View All Offers
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="discover-section" aria-labelledby="discover-title">
        <div className="discover-container">
          <header className="discover-header">
            <p className="discover-eyebrow">
              <Sparkles size={15} strokeWidth={1.9} aria-hidden="true" />
              DISCOVER MORE
            </p>
            <h2 className="discover-title" id="discover-title">
              Experiences & Travel Stories
            </h2>
            <p className="discover-subtitle">
              Find meaningful experiences and inspiring stories to make your Sri
              Lanka journey even more memorable.
            </p>
            <span className="discover-divider" aria-hidden="true" />
          </header>

          <div className="discover-layout">
            <div className="discover-experiences">
              <header className="discover-column-header">
                <span className="discover-column-icon" aria-hidden="true">
                  <Compass size={23} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="discover-column-title">Experiences</h3>
                  <p className="discover-column-subtitle">
                    See Sri Lanka beyond your stay.
                  </p>
                </div>
              </header>

              <div className="experiences-grid">
                {experiences.map((experience) => (
                  <article className="experience-card" key={experience.id}>
                    <Link
                      className="experience-card-link"
                      to={`/experiences/${experience.slug}`}
                      aria-label={`Explore ${experience.title}`}
                    >
                      <img
                        className="experience-card-image"
                    src={getExperienceHeroImage(experience)}
                        alt={`${experience.title} experience in Sri Lanka`}
                        loading="lazy"
                        decoding="async"
                      />
                      <span
                        className="experience-card-overlay"
                        aria-hidden="true"
                      />
                      <div className="experience-card-content">
                        <h4 className="experience-card-title">
                          {experience.title}
                        </h4>
                        <p className="experience-card-description">
                        {experience.shortDescription}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            <div className="discover-stories">
              <header className="discover-column-header">
                <span className="discover-column-icon" aria-hidden="true">
                  <BookOpen size={23} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="discover-column-title">Travel Stories</h3>
                  <p className="discover-column-subtitle">
                    Inspiration and guides for your journey.
                  </p>
                </div>
              </header>

              <div className="stories-list">
                {travelStories.map((story) => (
                  <article className="story-card" key={story.id}>
                    <Link
                      to={`/experiences/${story.slug}`}
                      className="story-card-link-wrapper"
                      aria-label={`Read ${story.title}`}
                    >
                      <div className="story-card-image-wrapper">
                        <img
                          className="story-card-image"
                          src={getExperienceHeroImage(story)}
                          alt={`${story.title} travel story`}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="story-card-content">
                        <div className="story-card-topline">
                          <span className="story-card-category">
                            Travel Story
                          </span>
                          <span className="story-card-meta">
                            <Clock3
                              size={14}
                              strokeWidth={1.9}
                              aria-hidden="true"
                            />
                            {story.duration || 'Editorial Story'}
                          </span>
                        </div>
                        <h4 className="story-card-title">{story.title}</h4>
                        <p className="story-card-description">
                          {story.shortDescription}
                        </p>
                        <span className="story-card-link">
                          Read Story
                          <ArrowRight
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
