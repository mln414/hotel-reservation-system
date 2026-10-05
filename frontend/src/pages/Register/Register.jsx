import {
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import useCustomer from "../../context/useCustomer.js";
import {
  getPasswordChecks,
  getPasswordStrength,
  isValidEmail,
  isValidPhone,
} from "../../utils/authValidation.js";
import "./Register.css";

function Register() {
  const { registerCustomer, loginCustomer } = useCustomer();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });
  const passwordChecks = getPasswordChecks(password);
  const passwordStrength = getPasswordStrength(password);

  const clearFieldError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setStatus({ type: "", text: "" });
  };

  const handleRegistration = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) nextErrors.firstName = "First name is required.";
    else if (trimmedFirstName.length > 50) nextErrors.firstName = "Use 50 characters or fewer.";
    if (!trimmedLastName) nextErrors.lastName = "Last name is required.";
    else if (trimmedLastName.length > 50) nextErrors.lastName = "Use 50 characters or fewer.";
    if (!trimmedEmail) nextErrors.email = "Email address is required.";
    else if (!isValidEmail(trimmedEmail)) nextErrors.email = "Enter a valid email address.";
    if (!trimmedPhone) nextErrors.phone = "Phone number is required.";
    else if (!isValidPhone(trimmedPhone)) nextErrors.phone = "Enter a valid phone number using digits, spaces, and an optional +.";
    if (!password) nextErrors.password = "Password is required.";
    else if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
      nextErrors.password = "Password must be at least 8 characters with uppercase, lowercase, number, and a special character.";
    }
    if (!confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords do not match.";
    if (!acceptTerms) nextErrors.acceptTerms = "You must agree before creating an account.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: "error", text: "Please review the highlighted fields." });
      return;
    }

    const registrationData = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      phone: trimmedPhone,
      password,
    };

    registerCustomer(registrationData)
      .then(() => loginCustomer({ email: trimmedEmail, password }))
      .then((user) => {
        setStatus({
          type: "success",
          text: `Account created successfully for ${user.firstName}! Redirecting to profile...`,
        });
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 1200);
      })
      .catch((err) => {
        const message = err.body?.message || err.message || "Registration failed. Please try again.";
        if (err.status === 409) {
          setErrors({ email: "An account already exists for this email address." });
        }
        setStatus({ type: "error", text: message });
      });
  };

  const fieldError = (field, id) =>
    errors[field] ? <span className="auth-field-error" id={id}>{errors[field]}</span> : null;

  return (
    <AuthLayout>
      <header className="auth-form-header register-form-header">
        <span className="auth-form-eyebrow">LankaStay Membership</span>
        <h1>Create Your Account</h1>
        <p>Join LankaStay to manage reservations, reviews, and your travel profile.</p>
      </header>

      <form className="auth-form register-auth-form" noValidate onSubmit={handleRegistration}>
        <div className="register-fields-grid">
          <div className="auth-field">
            <label htmlFor="register-first-name">First Name <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <UserRound aria-hidden="true" size={17} />
              <input
                id="register-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                maxLength={50}
                value={firstName}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "register-first-name-error" : undefined}
                onChange={(event) => { setFirstName(event.target.value); clearFieldError("firstName"); }}
              />
            </div>
            {fieldError("firstName", "register-first-name-error")}
          </div>

          <div className="auth-field">
            <label htmlFor="register-last-name">Last Name <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <UserRound aria-hidden="true" size={17} />
              <input
                id="register-last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                maxLength={50}
                value={lastName}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "register-last-name-error" : undefined}
                onChange={(event) => { setLastName(event.target.value); clearFieldError("lastName"); }}
              />
            </div>
            {fieldError("lastName", "register-last-name-error")}
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email Address <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <Mail aria-hidden="true" size={17} />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                onChange={(event) => { setEmail(event.target.value); clearFieldError("email"); }}
              />
            </div>
            {fieldError("email", "register-email-error")}
          </div>

          <div className="auth-field">
            <label htmlFor="register-phone">Phone Number <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <Phone aria-hidden="true" size={17} />
              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0712345678 or +94712345678"
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "register-phone-error" : undefined}
                onChange={(event) => { setPhone(event.target.value); clearFieldError("phone"); }}
              />
            </div>
            {fieldError("phone", "register-phone-error")}
          </div>

          <div className="auth-field register-password-field">
            <label htmlFor="register-password">Password <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={17} />
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "register-password-error register-password-guide" : "register-password-guide"}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                  clearFieldError("confirmPassword");
                }}
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
            {fieldError("password", "register-password-error")}
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">Confirm Password <span aria-hidden="true">*</span></label>
            <div className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={17} />
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
                onChange={(event) => { setConfirmPassword(event.target.value); clearFieldError("confirmPassword"); }}
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
            {fieldError("confirmPassword", "register-confirm-password-error")}
          </div>
        </div>

        <div className="password-guide" id="register-password-guide">
          <div className="password-strength-row">
            <span>Password strength</span>
            <strong>{passwordStrength.label || "Not entered"}</strong>
          </div>
          <div className={`password-strength-meter password-strength-meter--${passwordStrength.level}`} aria-hidden="true">
            {[1, 2, 3, 4].map((level) => <span key={level} />)}
          </div>
          <ul className="password-requirements">
            <li className={passwordChecks.length ? "is-met" : ""}><Check aria-hidden="true" size={12} />At least 8 characters</li>
            <li className={passwordChecks.uppercase && passwordChecks.lowercase ? "is-met" : ""}><Check aria-hidden="true" size={12} />Upper & lowercase letters</li>
            <li className={passwordChecks.number ? "is-met" : ""}><Check aria-hidden="true" size={12} />Include a number</li>
            <li className={passwordChecks.special ? "is-met" : ""}><Check aria-hidden="true" size={12} />Special character (@$!%*#?&)</li>
          </ul>
        </div>

        <div>
          <label className="auth-checkbox-row register-terms" htmlFor="register-terms">
            <input
              id="register-terms"
              type="checkbox"
              checked={acceptTerms}
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={errors.acceptTerms ? "register-terms-error" : undefined}
              onChange={(event) => { setAcceptTerms(event.target.checked); clearFieldError("acceptTerms"); }}
            />
            <span>I agree to the <strong>Terms &amp; Conditions</strong> and <strong>Privacy Policy</strong>.</span>
          </label>
          {fieldError("acceptTerms", "register-terms-error")}
        </div>

        <button className="auth-submit-button" type="submit">
          <CircleCheck aria-hidden="true" size={17} />
          Create Account
        </button>

        {status.text && (
          <p className={`auth-form-status auth-form-status--${status.type}`} role={status.type === "error" ? "alert" : "status"} aria-live="polite">
            {status.text}
          </p>
        )}

        <p className="auth-switch-copy">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;
