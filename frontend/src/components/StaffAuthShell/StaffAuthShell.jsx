import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import logo from "../../assets/images/lankastay-logo.png";
import staffImage from "../../assets/images/home/hero/galle-ocean-resort.png";
import "./StaffAuthShell.css";

function StaffAuthShell({
  eyebrow,
  title,
  description,
  backTo = "/staff/login",
  backLabel = "Back to Staff Sign In",
  children,
}) {
  return (
    <main className="staff-auth-page">
      <section className="staff-auth-shell" aria-labelledby="staff-auth-title">
        <div className="staff-auth-visual">
          <img src={staffImage} alt="LankaStay coastal hotel" />
          <div className="staff-auth-visual-content">
            <Link
              className="staff-auth-brand"
              to="/"
              aria-label="LankaStay home"
            >
              <img src={logo} alt="" />
              <span>
                <strong>LankaStay</strong>
                <small>Management Portal</small>
              </span>
            </Link>
            <div className="staff-auth-message">
              <span>
                <ShieldCheck aria-hidden="true" size={16} />
                Protected account access
              </span>
              <h2>
                Security built for
                <br />
                trusted hospitality.
              </h2>
              <p>
                Staff password actions will be secured by the LankaStay
                authentication service.
              </p>
            </div>
          </div>
        </div>

        <div className="staff-auth-content">
          <Link className="staff-auth-back" to={backTo}>
            <ArrowLeft aria-hidden="true" size={16} />
            {backLabel}
          </Link>
          <div className="staff-auth-content-inner">
            <header className="staff-auth-header">
              <span>{eyebrow}</span>
              <h1 id="staff-auth-title">{title}</h1>
              <p>{description}</p>
            </header>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export default StaffAuthShell;
