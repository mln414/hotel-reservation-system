import { MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import authImage from "../../assets/images/home/hero/galle-ocean-resort.png";
import logo from "../../assets/images/lankastay-logo.png";
import "./AuthLayout.css";

function AuthLayout({ children, compact = false }) {
  return (
    <section className={`auth-layout${compact ? " auth-layout--compact" : ""}`}>
      <div className="auth-visual-panel">
        <img src={authImage} alt="LankaStay coastal resort in Sri Lanka" />
        <div className="auth-visual-overlay" />
        <div className="auth-brand-content">
          <Link className="auth-brand" to="/" aria-label="LankaStay home">
            <img src={logo} alt="" />
            <span>
              <strong>LankaStay</strong>
              <small>Hotels &amp; Resorts</small>
            </span>
          </Link>
          <div className="auth-brand-message">
            <span><MapPin aria-hidden="true" size={15} />Discover Sri Lanka</span>
            <h2>Stay Easy,<br />Explore Sri Lanka.</h2>
            <p>Discover memorable stays across Sri Lanka.</p>
          </div>
          <p className="auth-brand-trust">
            <ShieldCheck aria-hidden="true" size={15} />
            Thoughtful stays, trusted hospitality.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <Link className="auth-mobile-brand" to="/" aria-label="LankaStay home">
          <img src={logo} alt="" />
          <span><strong>LankaStay</strong><small>Hotels &amp; Resorts</small></span>
        </Link>
        <div className="auth-form-container">{children}</div>
      </div>
    </section>
  );
}

export default AuthLayout;
