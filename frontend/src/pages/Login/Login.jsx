import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import useCustomer from "../../context/useCustomer.js";
import { isValidEmail } from "../../utils/authValidation.js";
import "./Login.css";

function Login() {
  const { loginCustomer } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}` : "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });

  const clearFieldError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setStatus({ type: "", text: "" });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) nextErrors.email = "Email address is required.";
    else if (!isValidEmail(trimmedEmail)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: "error", text: "Please review the highlighted fields." });
      return;
    }

    loginCustomer({ email: trimmedEmail, password })
      .then((user) => {
        setStatus({
          type: "success",
          text: `Welcome back, ${user.firstName}! Redirecting...`,
        });
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);
      })
      .catch((err) => {
        const message = err.body?.message || err.message || "Login failed. Please check your credentials.";
        setStatus({ type: "error", text: message });
      });
  };

  return (
    <AuthLayout>
      <header className="auth-form-header">
        <span className="auth-form-eyebrow">Guest Access</span>
        <h1>Welcome Back</h1>
        <p>Sign in to manage your LankaStay reservations and profile.</p>
      </header>

      {location.state?.from && (
        <p className="auth-form-status auth-form-status--info" role="status" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#eff6ff', color: '#1e40af', fontSize: '0.875rem' }}>
          Please sign in to your account to complete your reservation or view your profile.
        </p>
      )}

      <form className="auth-form login-auth-form" noValidate onSubmit={handleLogin}>
        <div className="auth-field">
          <label htmlFor="login-email">Email Address <span aria-hidden="true">*</span></label>
          <div className="auth-input-wrap">
            <Mail aria-hidden="true" size={17} />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError("email");
              }}
            />
          </div>
          {errors.email && <span className="auth-field-error" id="login-email-error">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password <span aria-hidden="true">*</span></label>
          <div className="auth-input-wrap">
            <LockKeyhole aria-hidden="true" size={17} />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFieldError("password");
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
          {errors.password && <span className="auth-field-error" id="login-password-error">{errors.password}</span>}
        </div>

        <div className="auth-options-row">
          <label className="auth-checkbox-row" htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember Me
          </label>
          <Link className="auth-text-link" to="/forgot-password">Forgot Password?</Link>
        </div>

        <button className="auth-submit-button" type="submit">
          <LogIn aria-hidden="true" size={17} />
          Sign In
        </button>

        {status.text && (
          <p className={`auth-form-status auth-form-status--${status.type}`} role={status.type === "error" ? "alert" : "status"} aria-live="polite">
            {status.text}
          </p>
        )}

        <p className="auth-switch-copy">
          Don’t have an account?
          <Link to="/register">Create Account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
