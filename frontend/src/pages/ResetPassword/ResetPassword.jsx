import { Check, Eye, EyeOff, LockKeyhole, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import { authApi } from "../../services/authApi.js";
import { getPasswordChecks, getPasswordStrength } from "../../utils/authValidation.js";
import "./ResetPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });

  const passwordChecks = getPasswordChecks(newPassword);
  const passwordStrength = getPasswordStrength(newPassword);

  const clearFieldError = (field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setStatus({ type: "", text: "" });
  };

  const handleResetPassword = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!token) {
      nextErrors.newPassword = "Password reset token is missing or invalid.";
    }
    if (!newPassword) {
      nextErrors.newPassword = "New password is required.";
    } else if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
      nextErrors.newPassword = "Use 8-128 characters with uppercase, lowercase, number, and special character.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: "error", text: "Please review the highlighted fields." });
      return;
    }

    authApi.customerResetPassword({ token, newPassword, confirmNewPassword: confirmPassword })
      .then((res) => {
        setStatus({
          type: "success",
          text: res.message || "Password has been reset successfully! Redirecting to login...",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      })
      .catch((err) => {
        const message = err.body?.message || err.message || "Could not reset password.";
        setStatus({ type: "error", text: message });
      });
  };

  return (
    <AuthLayout compact>
      <header className="auth-form-header">
        <span className="auth-form-eyebrow">Account Recovery</span>
        <h1>Reset Your Password</h1>
        <p>Choose a secure new password for your LankaStay account.</p>
      </header>

      <form className="auth-form reset-password-form" noValidate onSubmit={handleResetPassword}>
        <div className="auth-field">
          <label htmlFor="reset-new-password">New Password <span aria-hidden="true">*</span></label>
          <div className="auth-input-wrap">
            <LockKeyhole aria-hidden="true" size={17} />
            <input
              id="reset-new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={errors.newPassword ? "reset-password-error" : undefined}
              onChange={(event) => {
                setNewPassword(event.target.value);
                clearFieldError("newPassword");
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
          {errors.newPassword && <span className="auth-field-error" id="reset-password-error">{errors.newPassword}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="reset-confirm-password">Confirm New Password <span aria-hidden="true">*</span></label>
          <div className="auth-input-wrap">
            <LockKeyhole aria-hidden="true" size={17} />
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "reset-confirm-password-error" : undefined}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearFieldError("confirmPassword");
              }}
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
          {errors.confirmPassword && <span className="auth-field-error" id="reset-confirm-password-error">{errors.confirmPassword}</span>}
        </div>

        <div className="password-guide">
          <div className="password-strength-row">
            <span>Password strength</span>
            <strong>{passwordStrength.label || "Not entered"}</strong>
          </div>
          <div className={`password-strength-meter password-strength-meter--${passwordStrength.level}`} aria-hidden="true">
            {[1, 2, 3, 4].map((level) => <span key={level} />)}
          </div>
          <ul className="password-requirements">
            <li className={passwordChecks.length ? "is-met" : ""}><Check aria-hidden="true" size={12} />At least 8 characters</li>
            <li className={passwordChecks.letter ? "is-met" : ""}><Check aria-hidden="true" size={12} />Include a letter</li>
            <li className={passwordChecks.number ? "is-met" : ""}><Check aria-hidden="true" size={12} />Include a number</li>
          </ul>
        </div>

        <button className="auth-submit-button" type="submit">
          <RotateCcw aria-hidden="true" size={17} />
          Reset Password
        </button>

        {status.text && (
          <p className={`auth-form-status auth-form-status--${status.type}`} role={status.type === "error" ? "alert" : "status"} aria-live="polite">
            {status.text}
          </p>
        )}

        <p className="auth-switch-copy">
          Remember your password?
          <Link to="/login">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
