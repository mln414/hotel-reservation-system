import {
  CalendarCheck,
  CalendarDays,
  CircleUserRound,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";

import logo from "../../assets/images/lankastay-logo.png";
import useCustomer from "../../context/useCustomer.js";
import "./Navbar.css";

const navigationLinks = [
  { label: "Home", to: "/", end: true },
  { label: "Our Hotels", to: "/hotels" },
  { label: "Destinations", to: "/destinations" },
  { label: "Experiences", to: "/experiences" },
  { label: "Offers", to: "/offers" },
  { label: "Reviews", to: "/reviews" },
];

function Navbar() {
  const { customer, logoutCustomer } = useCustomer();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { pathname } = useLocation();

  const closeMenu = () => setIsMenuOpen(false);
  const isMyBookingsActive =
    pathname === "/my-reservations" || pathname.startsWith("/reservations/");

  const handleLogout = async () => {
    closeMenu();
    await logoutCustomer();
    navigate("/login");
  };

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  const renderMainLinks = () => navigationLinks.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      onClick={closeMenu}
    >
      {link.label}
    </NavLink>
  ));

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink
          to="/"
          className="navbar-logo"
          aria-label="LankaStay Hotels and Resorts home"
          onClick={closeMenu}
        >
          <img src={logo} alt="" className="navbar-logo-image" />
          <div className="logo-text">
            <span className="logo-title">LankaStay</span>
            <span className="logo-subtitle">Hotels &amp; Resorts</span>
          </div>
        </NavLink>

        <nav className="navbar-desktop-nav" aria-label="Main navigation">
          {renderMainLinks()}
        </nav>

        <div className="navbar-actions">
          {customer?.isLoggedIn ? (
            <>
              <NavLink
                to="/my-reservations"
                className={`navbar-account-link ${isMyBookingsActive ? "active" : ""}`}
              >
                <CalendarDays aria-hidden="true" size={16} />
                My Bookings
              </NavLink>
              <NavLink to="/profile" className="navbar-account-link">
                <CircleUserRound aria-hidden="true" size={17} />
                {customer.firstName || "My Profile"}
              </NavLink>
              <button
                type="button"
                className="navbar-account-link navbar-logout-button"
                onClick={handleLogout}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOut aria-hidden="true" size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar-account-link">
                <LogIn aria-hidden="true" size={16} />
                Sign In
              </NavLink>
              <NavLink to="/register" className="navbar-login-button">
                Register
              </NavLink>
            </>
          )}
          <NavLink to="/hotels" className="navbar-book-button">
            <CalendarCheck aria-hidden="true" size={16} />
            Book Your Stay
          </NavLink>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="menu-toggle"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        >
          {isMenuOpen ? <X aria-hidden="true" size={23} /> : <Menu aria-hidden="true" size={23} />}
        </button>

        <nav
          id="mobile-navigation"
          className={`navbar-mobile-menu ${isMenuOpen ? "navbar-mobile-menu--open" : ""}`}
          aria-label="Mobile navigation"
        >
          <div className="navbar-mobile-main-links">{renderMainLinks()}</div>
          <div className="navbar-mobile-account-links">
            {customer?.isLoggedIn ? (
              <>
                <NavLink
                  to="/my-reservations"
                  className={isMyBookingsActive ? "active" : ""}
                  onClick={closeMenu}
                >
                  <CalendarDays aria-hidden="true" size={17} />My Bookings
                </NavLink>
                <NavLink to="/profile" onClick={closeMenu}>
                  <CircleUserRound aria-hidden="true" size={18} />{customer.firstName || "Profile"}
                </NavLink>
                <button
                  type="button"
                  className="navbar-mobile-login"
                  onClick={handleLogout}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}
                >
                  <LogOut aria-hidden="true" size={17} />Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="navbar-mobile-login" onClick={closeMenu}>
                  <LogIn aria-hidden="true" size={17} />Sign In
                </NavLink>
                <NavLink to="/register" onClick={closeMenu}>
                  Register
                </NavLink>
              </>
            )}
          </div>
          <NavLink to="/hotels" className="navbar-mobile-book" onClick={closeMenu}>
            <CalendarCheck aria-hidden="true" size={17} />Book Your Stay
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
