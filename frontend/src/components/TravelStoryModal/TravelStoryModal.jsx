import { CalendarDays, Clock3, Compass, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { formatReservationDate } from "../../utils/reservationFormatting.js";
import "./TravelStoryModal.css";

function TravelStoryModal({ onClose, story }) {
  const readerRef = useRef(null);

  useEffect(() => {
    if (!story) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    readerRef.current?.scrollTo({ top: 0 });
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [story, onClose]);

  if (!story) return null;

  return <div className="story-modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}><article ref={readerRef} className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-modal-title"><button className="story-modal-close" type="button" aria-label="Close story" onClick={onClose}><X aria-hidden="true" size={21}/></button><div className="story-modal-image"><img src={story.image} alt={`${story.title} travel story`}/></div><div className="story-modal-content"><span className="story-modal-category">{story.category}</span><h2 id="story-modal-title">{story.title}</h2><div className="story-modal-meta"><span><Clock3 size={15}/>{story.readTime}</span><span><CalendarDays size={15}/>{formatReservationDate(story.publishedDate)}</span></div><p className="story-modal-summary">{story.summary}</p><div className="story-modal-article">{story.content.map((section,index)=>typeof section==="string"?<p key={`${story.id}-${index}`}>{section}</p>:<section key={section.heading}><h3>{section.heading}</h3>{section.paragraphs.map((paragraph,paragraphIndex)=><p key={`${section.heading}-${paragraphIndex}`}>{paragraph}</p>)}</section>)}</div><footer><button type="button" onClick={onClose}>Close</button><Link to="/experiences" onClick={onClose}><Compass size={16}/>Explore Experiences</Link></footer></div></article></div>;
}

export default TravelStoryModal;
