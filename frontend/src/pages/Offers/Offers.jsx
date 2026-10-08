import { ArrowRight, Info, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import OfferCard from "../../components/OfferCard/OfferCard.jsx";
import useHotels from "../../context/useHotels.js";
import usePropertyContent from "../../context/usePropertyContent.js";
import useRooms from "../../context/useRooms.js";
import useRates from "../../context/useRates.js";
import { CUSTOMER_OFFER_STATE_LABELS, CUSTOMER_OFFER_STATES, getPublicOfferEligibility, getCustomerOffers, getCustomerOfferState, offerMatchesQuery } from "../../utils/customerOffers.js";
import "./Offers.css";

function Offers() {
  const { offers } = usePropertyContent();
  const { publicHotels: hotels } = useHotels();
  const { rooms, physicalRooms } = useRooms();
  const { getCurrentRoomRate } = useRates();
  const [stateFilter, setStateFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const visibleOffers = useMemo(() => getCustomerOffers(offers, hotels, rooms, { physicalRooms, getCurrentRoomRate }), [offers, hotels, rooms, physicalRooms, getCurrentRoomRate]);
  const filteredOffers = visibleOffers.filter((offer) => {
    const coverage = getPublicOfferEligibility(offer, { publicHotels: hotels, rooms, physicalRooms, getCurrentRoomRate });
    return (stateFilter === "ALL" || getCustomerOfferState(offer) === stateFilter) && offerMatchesQuery(offer, coverage, query);
  });
  const heroImage = visibleOffers[0]?.image;
  const filters = ["ALL", CUSTOMER_OFFER_STATES.AVAILABLE, CUSTOMER_OFFER_STATES.ENDING, CUSTOMER_OFFER_STATES.COMING];

  return (
    <div className="offers-page">
      <section className="offers-hero" aria-labelledby="offers-page-title">
        {heroImage && <img src={heroImage} alt="LankaStay offers and packages" />}
        <span className="offers-hero-overlay" aria-hidden="true" />
        <div className="offers-hero-content"><span>Special Offers</span><h1 id="offers-page-title">Offers &amp; Packages</h1><p>Discover selected LankaStay offers and find stays that match your next journey across Sri Lanka.</p></div>
      </section>

      <section className="offers-list-section" aria-labelledby="current-offers-title">
        <header><span><Sparkles aria-hidden="true" size={17} />Curated stays</span><h2 id="current-offers-title">Explore Our Offers</h2><p>Only Offers connected to a published Hotel and an active eligible Room Type appear here. Final savings are verified after you choose dates.</p></header>
        {visibleOffers.length > 0 && <div className="offers-controls"><div className="offers-filter-chips" aria-label="Filter offers by availability state">{filters.map((filter) => <button key={filter} type="button" className={stateFilter === filter ? "is-active" : ""} aria-pressed={stateFilter === filter} onClick={() => setStateFilter(filter)}>{filter === "ALL" ? "All Offers" : CUSTOMER_OFFER_STATE_LABELS[filter]}</button>)}</div><label className="offers-search"><Search aria-hidden="true" size={17} /><span className="sr-only">Search offers</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search offers or hotels" /></label></div>}
        {filteredOffers.length ? <div className="offers-grid">{filteredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} coverage={getPublicOfferEligibility(offer, { publicHotels: hotels, rooms, physicalRooms, getCurrentRoomRate })} />)}</div> : <div className="offers-empty"><h2>{visibleOffers.length ? "No Offers match these filters." : "No Offers are available right now."}</h2><p>{visibleOffers.length ? "Try another state or clear your search." : "Explore our Hotels and discover your next stay across Sri Lanka."}</p>{visibleOffers.length ? <button type="button" onClick={() => { setStateFilter("ALL"); setQuery("") }}>Clear Filters</button> : <Link to="/hotels">Explore Hotels</Link>}</div>}
      </section>

      <section className="offers-booking-note"><Info aria-hidden="true" size={20} /><div><strong>Planning your offer stay</strong><p>Choose a participating Room Type and stay dates. LankaStay verifies availability, Rate rules and Offer eligibility before showing the final promotional total.</p></div><Link to="/hotels">Explore Hotels<ArrowRight aria-hidden="true" size={16} /></Link></section>
    </div>
  );
}

export default Offers;
