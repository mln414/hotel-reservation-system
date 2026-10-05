import { useState } from "react";
import {
  Camera,
  CircleHelp,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
} from "lucide-react";
import { Link } from "react-router";
import logo from "../../assets/images/lankastay-logo.png";

import "./Footer.css";

const destinationLinks = [
  { label: "Colombo", to: "/hotels?destination=colombo" },
  { label: "Negombo", to: "/hotels?destination=negombo" },
  { label: "Galle", to: "/hotels?destination=galle" },
  { label: "Sigiriya", to: "/hotels?destination=sigiriya" },
  { label: "Nuwara Eliya", to: "/hotels?destination=nuwara-eliya" },
  { label: "Yala", to: "/hotels?destination=yala" },
  { label: "View All Destinations", to: "/destinations" },
];

const collectionLinks = [
  { label: "Luxury Escapes", to: "/hotels?collection=luxury-escapes" },
  { label: "Coastal Getaways", to: "/hotels?collection=coastal-getaways" },
  { label: "Heritage Stays", to: "/hotels?collection=heritage-stays" },
  { label: "Villas & Nature", to: "/hotels?collection=villas-and-nature" },
  { label: "Family Holidays", to: "/hotels?collection=family-holidays" },
  { label: "City Breaks", to: "/hotels?collection=city-breaks" },
  { label: "View All Collections", to: "/collections" },
];

const companyLinks = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Press", to: "/press" },
  { label: "Blog", to: "/stories" },
  { label: "Terms & Conditions", to: "/terms" },
];

const policyLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Use", to: "/terms" },
  { label: "Sitemap", to: "/sitemap" },
  { label: "Staff Access", to: "/management/staff" },
];

function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (newsletterMessage) {
      setNewsletterMessage("");
      setNewsletterStatus("");
    }
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setNewsletterMessage("Please enter your email address.");
      setNewsletterStatus("error");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setNewsletterMessage("Please enter a valid email address.");
      setNewsletterStatus("error");
      return;
    }

    setNewsletterMessage("Thank you for subscribing!");
    setNewsletterStatus("success");
    setEmail("");
  }

  return (
    <footer className="site-footer">
      <section
        className="footer-newsletter"
        aria-labelledby="footer-newsletter-title"
      >
        <div className="footer-newsletter-container">
          <div className="footer-newsletter-content">
            <span className="footer-newsletter-icon" aria-hidden="true">
              <Mail size={25} strokeWidth={1.8} />
            </span>
            <div className="footer-newsletter-text">
              <h2
                className="footer-newsletter-title"
                id="footer-newsletter-title"
              >
                Get Exclusive Offers & Travel Inspiration
              </h2>
              <p className="footer-newsletter-description">
                Subscribe to our newsletter and be the first to know about our
                best offers.
              </p>
            </div>
          </div>

          <form
            className="footer-newsletter-form"
            onSubmit={handleNewsletterSubmit}
            noValidate
          >
            <div className="footer-newsletter-fields">
              <label className="footer-visually-hidden" htmlFor="footer-email">
                Email address
              </label>
              <input
                className="footer-newsletter-input"
                id="footer-email"
                name="email"
                type="email"
                value={email}
                placeholder="Enter your email address"
                autoComplete="email"
                aria-required="true"
                aria-invalid={newsletterStatus === "error"}
                aria-describedby="footer-newsletter-message"
                onChange={handleEmailChange}
              />
              <button className="footer-newsletter-button" type="submit">
                Subscribe
              </button>
            </div>
            <p
              className={`footer-newsletter-message ${newsletterStatus ? `footer-newsletter-message--${newsletterStatus}` : ""}`}
              id="footer-newsletter-message"
              aria-live="polite"
            >
              {newsletterMessage}
            </p>
          </form>
        </div>
      </section>

      <div className="footer-main">
        <div className="footer-main-container">
          <div className="footer-grid">
            <section className="footer-brand" aria-label="About LankaStay">
              <div className="footer-logo-container">
                <img
                  className="footer-logo"
                  src={logo}
                  alt="LankaStay Hotels & Resorts"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="footer-brand-description">
                Curated stays in the most beautiful places across Sri Lanka.
              </p>
              <div className="footer-socials" aria-label="Social media links">
                <a
                  className="footer-social-link"
                  href="#"
                  aria-label="Facebook"
                >
                  <span className="footer-social-letter" aria-hidden="true">
                    f
                  </span>
                </a>
                <a
                  className="footer-social-link"
                  href="#"
                  aria-label="Instagram"
                >
                  <Camera size={18} strokeWidth={1.9} aria-hidden="true" />
                </a>
                <a
                  className="footer-social-link"
                  href="#"
                  aria-label="YouTube"
                >
                  <Play size={18} strokeWidth={1.9} aria-hidden="true" />
                </a>
                <a
                  className="footer-social-link"
                  href="#"
                  aria-label="WhatsApp"
                >
                  <MessageCircle
                    size={18}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                </a>
              </div>
            </section>

            <nav className="footer-column" aria-labelledby="footer-destinations">
              <h2 className="footer-column-title" id="footer-destinations">
                Destinations
              </h2>
              <ul className="footer-links">
                {destinationLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="footer-link" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="footer-column" aria-labelledby="footer-collections">
              <h2 className="footer-column-title" id="footer-collections">
                Collections
              </h2>
              <ul className="footer-links">
                {collectionLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="footer-link" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="footer-column" aria-labelledby="footer-company">
              <h2 className="footer-column-title" id="footer-company">
                Company
              </h2>
              <ul className="footer-links">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="footer-link" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="footer-column" aria-labelledby="footer-contact">
              <h2 className="footer-column-title" id="footer-contact">
                Contact
              </h2>
              <address className="footer-contact-list">
                <a className="footer-contact-item" href="tel:+94111234567">
                  <Phone size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>+94 11 123 4567</span>
                </a>
                <a
                  className="footer-contact-item"
                  href="mailto:hello@lankastay.com"
                >
                  <Mail size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>hello@lankastay.com</span>
                </a>
                <p className="footer-contact-item">
                  <MapPin size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>
                    No. 123, Galle Road,
                    <br />
                    Colombo 03, Sri Lanka
                  </span>
                </p>
              </address>
              <Link className="footer-contact-item footer-contact-faq" to="/faqs">
                <CircleHelp size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>FAQs</span>
              </Link>
            </section>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            © 2026 LankaStay Hotels & Resorts. All Rights Reserved.
          </p>
          <nav className="footer-policy-links" aria-label="Legal links">
            {policyLinks.map((link) => (
              <Link className="footer-policy-link" to={link.to} key={link.label}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
