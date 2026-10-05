import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import { authApi } from "../../services/authApi.js";
import { isValidEmail } from "../../utils/authValidation.js";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!isValidEmail(email.trim())) { setError("Enter a valid email address."); return; }
    setSubmitting(true); setError(""); setStatus("");
    try {
      const response = await authApi.customerForgotPassword({ email: email.trim() });
      setStatus(response.message);
    } catch (failure) { setError(failure.message || "Could not request a reset. Please try again later."); }
    finally { setSubmitting(false); }
  };
  return <AuthLayout compact>
    <div className="forgot-password-icon" aria-hidden="true"><KeyRound size={23} /></div>
    <header className="auth-form-header forgot-password-header">
      <span className="auth-form-eyebrow">Account Recovery</span><h1>Forgot Password</h1>
      <p>Enter your email address. Use the link sent to your inbox to reset your password.</p>
    </header>
    <form className="auth-form forgot-password-form" noValidate onSubmit={submit}>
      <div className="auth-field"><label htmlFor="forgot-email">Email Address *</label>
        <div className="auth-input-wrap"><Mail aria-hidden="true" size={17} />
          <input id="forgot-email" type="email" autoComplete="email" value={email}
            aria-invalid={Boolean(error)} onChange={(event) => { setEmail(event.target.value); setError(""); setStatus(""); }} />
        </div>
      </div>
      <button className="auth-submit-button" disabled={submitting} type="submit">{submitting ? "Sending..." : "Send Reset Instructions"}</button>
      {error && <p className="auth-form-status auth-form-status--error" role="alert">{error}</p>}
      {status && <p className="auth-form-status auth-form-status--success" role="status">{status}</p>}
    </form>
    <Link className="forgot-back-link" to="/login"><ArrowLeft size={15} />Back to Sign In</Link>
  </AuthLayout>;
}
export default ForgotPassword;
