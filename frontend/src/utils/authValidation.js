const asString = (value) => typeof value === "string" ? value : "";

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asString(value).trim());

export function isValidPhone(value) {
  const trimmedPhone = asString(value).trim();
  const digitCount = trimmedPhone.replace(/\D/g, "").length;
  return /^\+?[\d\s]+$/.test(trimmedPhone) && digitCount >= 9 && digitCount <= 15;
}

export const getPasswordChecks = (password) => {
  const candidate = asString(password);
  return {
    length: candidate.length >= 8 && candidate.length <= 128,
    letter: /[A-Za-z]/.test(candidate),
    uppercase: /[A-Z]/.test(candidate),
    lowercase: /[a-z]/.test(candidate),
    number: /\d/.test(candidate),
    special: /[^A-Za-z0-9\s]/.test(candidate),
  };
};

export function validateProfileFields(fields = {}) {
  const source = fields && typeof fields === "object" && !Array.isArray(fields) ? fields : {};
  const trimmed = Object.fromEntries(["firstName", "lastName", "email", "phone"]
    .map((key) => [key, asString(source[key]).trim()]));
  const errors = {};
  if (!trimmed.firstName) errors.firstName = "First name is required.";
  if (!trimmed.lastName) errors.lastName = "Last name is required.";
  if (!trimmed.email) errors.email = "Email address is required.";
  else if (!isValidEmail(trimmed.email)) errors.email = "Enter a valid email address.";
  if (trimmed.phone && !isValidPhone(trimmed.phone)) errors.phone = "Enter a valid phone number.";
  return { values: trimmed, errors };
}

export function validateCustomerPasswordChange(fields = {}) {
  const source = fields && typeof fields === "object" && !Array.isArray(fields) ? fields : {};
  const current = asString(source.current);
  const next = asString(source.next);
  const confirm = asString(source.confirm);
  const checks = getPasswordChecks(next);
  const errors = {};
  if (!current) errors.current = "Current password is required.";
  if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number || !checks.special) {
    errors.next = "Use at least 8 characters with an uppercase letter, lowercase letter, and a number.";
  }
  if (confirm !== next) errors.confirm = "Passwords do not match.";
  return errors;
}

export function getPasswordStrength(password) {
  if (!password) return { label: "", level: 0 };

  const checks = getPasswordChecks(password);
  let score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: "Weak", level: 1 };
  if (score === 3) return { label: "Fair", level: 2 };
  if (score === 4) return { label: "Good", level: 3 };
  return { label: "Strong", level: 4 };
}
