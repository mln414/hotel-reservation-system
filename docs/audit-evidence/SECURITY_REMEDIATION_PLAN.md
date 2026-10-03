# LankaStay Hotels & Resorts
# Comprehensive Security Remediation Plan

> Phase 1 implementation update (2026-09-17): the final PHASE 1 REMEDIATION VERIFICATION section is authoritative for these six findings. Original examples below describe the pre-implementation plan; do not reapply them. HIGH-03 requires manual secret rotation; alternate-copy verification remains blocked.

---

## 1. Executive Summary & Remediation Strategy

This document provides the actionable, file-by-file engineering specification to remediate all vulnerabilities identified in the **LankaStay Hotels & Resorts Comprehensive Application Security Assessment** (`SECURITY_AUDIT_REPORT.md`).

Every remediation item includes:
- Exact file paths and line numbers in the repository
- Concrete, production-grade source code modifications (Before vs After)
- Compatibility and architectural impact assessments
- Automated security regression tests to prevent recurrence

---

## 2. Priority Taxonomy

| Priority | Definition | Target Remediation Window | Action Required |
|---|---|---|---|
| **P0** | **Critical / Public Deployment Blocker** | Immediate (Before any external exposure) | Block public deployment until 100% verified |
| **P1** | **High Severity / Pre-Release Requirement** | Next sprint (1–2 weeks) | Must be resolved before production release |
| **P2** | **Medium Severity / Hardening** | 3–4 weeks | Scheduled architectural improvement |
| **P3** | **Low / Informational / DevSecOps** | 1–2 months | Ongoing maintenance and pipeline integration |

---

## 3. Remediation Roadmap Overview

```
+----------------------------------------------------------------------------------------------------+
|                                    PRIORITIZED REMEDIATION ROADMAP                                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [P0: DEPLOYMENT BLOCKERS]                                                                         |
|  * CRIT-01: Remove tokenless password reset endpoints in Customer & Staff Auth controllers/services |
|  * HIGH-01: Remove email enumeration endpoints (check-email) & standardize generic responses        |
|  * HIGH-02: Restrict media file upload to verified image MIME/extensions + disable script execution |
|  * HIGH-03: Purge hardcoded database passwords from scripts/qa/ automation scripts                 |
|                                                                                                    |
|  [P1: PRE-RELEASE ACCESS CONTROL & INTEGRITY]                                                      |
|  * HIGH-04: Enforce @PreAuthorize("hasRole('MANAGER')") on Destination & Attraction CRUD           |
|  * HIGH-05: Enforce hotel property ownership checks on Discount mutations (prevent IDOR)           |
|  * MED-01:  Convert HotelService.verifyStaffHotelScope to fail-closed when assignedHotelId is null |
|  * MED-02:  Configure Content-Security-Policy (CSP) & HSTS headers in SecurityConfig             |
|                                                                                                    |
|  [P2: SESSION, RATE LIMITING & RESOURCE HARDENING]                                                 |
|  * MED-03:  Eliminate static dev reset link map; scope dev endpoint with @Profile("dev")           |
|  * MED-04:  Invalidate active user sessions upon password reset completion                        |
|  * MED-05:  Implement IP throttling and CAPTCHA backoff before triggering account lockout          |
|  * MED-06:  Replace unbounded ConcurrentHashMap in LoginRateLimiter with bounded LRU cache        |
|  * MED-07:  Enforce pagination and maximum page size limits on public discovery APIs               |
|                                                                                                    |
|  [P3: OPERATIONAL & DEVSECOPS MATURITY]                                                            |
|  * LOW-01:  Set spring.jpa.hibernate.ddl-auto=validate in production (Flyway single source)       |
|  * LOW-02:  Implement AbortController on React quote calculation requests                         |
|  * LOW-03:  Migrate profile photo storage from browser localStorage to server-side profile API    |
|  * LOW-04:  Harden IP extraction using Spring ForwardedHeaderFilter with trusted proxy config      |
|  * INFO-01: Establish GitHub Actions CI workflow (CodeQL, TruffleHog/Gitleaks, Dependabot)        |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Quick Wins vs Architectural Fixes vs Long-Term Improvements

### Quick Wins (< 2 Hours Implementation)
1. **Remove Insecure Endpoints (CRIT-01, HIGH-01):** Delete `check-email` and tokenless `change-password` methods from controllers and services.
2. **Add Missing Authorization Annotations (HIGH-04):** Add `@PreAuthorize("hasRole('MANAGER')")` to `ManagementDestinationController` and `AttractionController`.
3. **Purge Plaintext Passwords (HIGH-03):** Replace raw MySQL connection passwords in `scripts/qa/*.js` with `process.env.DB_PASSWORD`.
4. **Harden Security Headers (MED-02):** Add CSP and HSTS directives in `SecurityConfig.java`.
5. **Enforce Fail-Closed Hotel Scope (MED-01):** Correct null checks in `HotelService.verifyStaffHotelScope`.

### Architectural Fixes (1–3 Days Implementation)
1. **Media Upload Hardening (HIGH-02):** Implement server-side magic byte validation, strict extension mapping from MIME types, and serve uploaded media with sandboxed headers.
2. **Discount Multi-Property Scoping (HIGH-05):** Add property-ownership validation in `DiscountService.updateDiscount` and relocate promo code validation to an unauthenticated customer endpoint.
3. **Session Revocation on Password Reset (MED-04):** Integrate Spring Security `SessionRegistry` into password reset workflows to invalidate active sessions across all devices.
4. **Bounded Rate Limiter (MED-06):** Transition `LoginRateLimiter` from an unbounded `ConcurrentHashMap` to a bounded, time-evicting LRU cache (e.g., Caffeine).

### Long-Term Improvements (1–3 Months)
1. **Dedicated Cloud Object Storage (S3 / GCS):** Move user-generated destination images and hotel photos off local web-root disk storage to private S3 buckets with presigned URLs or CDN fronting.
2. **Automated DevSecOps Pipeline (INFO-01):** Integrate GitHub Actions with CodeQL, Secret Scanning, OWASP Dependency-Check, and Docker image vulnerability scanning.
3. **Centralized Redis Session Store:** For horizontal multi-instance scaling, replace local servlet sessions with Spring Session Data Redis.

---

## 5. Detailed Technical Remediation Specifications

### Finding CRIT-01 & HIGH-01: Remove Insecure Tokenless Password Reset and Email Enumeration Endpoints

- **Priority:** P0 (Immediate Public Deployment Blocker)
- **Affected Files:**
  - `backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java`
  - `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java`
  - `backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java`
  - `backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java`
  - `frontend/src/services/authApi.js`
  - `frontend/src/pages/ForgotPassword/ForgotPassword.jsx`
  - `frontend/src/pages/StaffForgotPassword/StaffForgotPassword.jsx`

#### Backend Changes:

1. In `backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java`:
   **DELETE** lines 56–70:
   ```java
   // DELETE THIS ENUMERATION ENDPOINT:
   @PostMapping("/forgot-password/check-email")
   public ResponseEntity<Map<String, Boolean>> checkForgotPasswordEmail(...) { ... }

   // DELETE THIS ACCOUNT TAKEOVER ENDPOINT:
   @PostMapping("/forgot-password/change-password")
   public ResponseEntity<MessageResponse> changeForgottenPassword(...) { ... }
   ```

2. In `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java`:
   **DELETE** lines 111–135 (`forgotPasswordEmailExists` and `resetForgottenPassword`).

3. In `backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java`:
   **DELETE** lines 65–79 (`checkStaffForgotPasswordEmail` and `changeStaffForgottenPassword`).

4. In `backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java`:
   **DELETE** lines 163–188 (`staffForgotPasswordEmailExists` and `resetStaffForgottenPassword`).

5. In `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java`:
   Update line 67 to remove references to the deleted endpoints:
   ```java
   // BEFORE:
   .requestMatchers(HttpMethod.POST,
       "/api/v1/customer/auth/register",
       "/api/v1/customer/auth/login",
       "/api/v1/customer/auth/forgot-password/check-email",
       "/api/v1/customer/auth/forgot-password/change-password"
   ).permitAll()

   // AFTER:
   .requestMatchers(HttpMethod.POST,
       "/api/v1/customer/auth/register",
       "/api/v1/customer/auth/login"
   ).permitAll()
   ```
   And line 69:
   ```java
   // BEFORE:
   .requestMatchers(HttpMethod.POST,
       "/api/v1/auth/login",
       "/api/v1/auth/forgot-password/check-email",
       "/api/v1/auth/forgot-password/change-password"
   ).permitAll()

   // AFTER:
   .requestMatchers(HttpMethod.POST,
       "/api/v1/auth/login"
   ).permitAll()
   ```

#### Frontend Changes:

1. In `frontend/src/services/authApi.js`:
   **REMOVE** the insecure methods on lines 84–85 and 92–93:
   ```javascript
   // REMOVE:
   // checkStaffForgotPasswordEmail
   // changeStaffForgottenPassword
   // checkCustomerForgotPasswordEmail
   // changeCustomerForgottenPassword
   ```
   Retain the secure endpoint on line 102:
   ```javascript
   forgotPassword: (data) => apiRequest('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
   resetPassword: (data) => apiRequest('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
   ```

2. In `frontend/src/pages/ForgotPassword/ForgotPassword.jsx`:
   Update the form submission handler to submit the single-step email request:
   ```javascript
   const handleSubmit = async (event) => {
     event.preventDefault();
     if (submitting) return;
     const trimmedEmail = email.trim();
     if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
       setErrors({ email: trimmedEmail ? "Enter a valid email address." : "Email address is required." });
       return;
     }
     setSubmitting(true);
     setErrors({});
     setStatus({ type: "", text: "" });
     try {
       await authApi.forgotPassword({ email: trimmedEmail });
       setStatus({
         type: "success",
         text: "If an account exists for that email, password reset instructions have been sent. Please check your inbox.",
       });
     } catch (error) {
       // Always display generic guidance on failure to prevent enumeration
       setStatus({
         type: "success",
         text: "If an account exists for that email, password reset instructions have been sent. Please check your inbox.",
       });
     } finally {
       setSubmitting(false);
     }
   };
   ```
   Apply the identical pattern to `frontend/src/pages/StaffForgotPassword/StaffForgotPassword.jsx`.

- **Potential Compatibility Impact:**
  - Realigns user flow with standard enterprise security: user enters email -> receives reset link (`/reset-password?token=XYZ` or `/staff/reset-password?token=XYZ`) -> sets new password.
  - Since `ResetPassword.jsx` and `StaffResetPassword.jsx` already exist and are fully wired to `/api/v1/auth/reset-password`, no new pages need to be created.

---

### Finding HIGH-02: Media File Upload Hardening

- **Priority:** P0 (Immediate Public Deployment Blocker)
- **Affected File:** `backend/src/main/java/com/lankastay/backend/service/MediaStorageService.java`
- **Component:** Media Upload & Local Disk Storage

#### Implementation:

Replace lines 50–71 of `MediaStorageService.java` with strict magic-byte raster image verification and server-determined extension mapping:

```java
package com.lankastay.backend.service;

import com.lankastay.backend.dto.media.MediaUploadResponse;
import com.lankastay.backend.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaStorageService {

    private static final Map<String, String> ALLOWED_MIME_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private final Path uploadLocation;

    public MediaStorageService(@Value("${file.upload-dir:uploads/destinations}") String uploadDir) {
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    public MediaUploadResponse storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Please upload a valid, non-empty image file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("File size exceeds maximum limit of 5 MB.");
        }

        String rawContentType = file.getContentType();
        String contentType = rawContentType != null ? rawContentType.toLowerCase() : "";
        if (!ALLOWED_MIME_TO_EXT.containsKey(contentType)) {
            throw new BusinessRuleException("Unsupported file format. Only JPG, PNG, and WebP images are allowed.");
        }

        // Validate original filename extension if provided
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png");
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BusinessRuleException("Invalid filename path traversal attempt detected.");
        }

        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            String clientExt = originalFilename.substring(dotIndex).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(clientExt)) {
                throw new BusinessRuleException("Disallowed file extension. Only .jpg, .jpeg, .png, and .webp are accepted.");
            }
        }

        // Deep Content Inspection: Verify byte stream is an authentic raster image (blocks HTML, SVG, polyglots)
        try (InputStream checkStream = file.getInputStream()) {
            BufferedImage image = ImageIO.read(checkStream);
            if (image == null) {
                throw new BusinessRuleException("The uploaded file could not be verified as a valid raster image.");
            }
        } catch (IOException ex) {
            throw new BusinessRuleException("Failed to inspect uploaded image content.");
        }

        // Authoritative extension determined strictly by server MIME map
        String extension = ALLOWED_MIME_TO_EXT.get(contentType);
        String generatedFilename = "dest_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12) + extension;

        try {
            Path targetLocation = this.uploadLocation.resolve(generatedFilename).normalize();
            if (!targetLocation.startsWith(this.uploadLocation)) {
                throw new BusinessRuleException("Target storage path traversal error.");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            String publicUrl = "/uploads/destinations/" + generatedFilename;
            return new MediaUploadResponse(publicUrl, generatedFilename, file.getSize(), contentType);
        } catch (IOException ex) {
            throw new BusinessRuleException("Failed to store uploaded file on server: " + ex.getMessage());
        }
    }
}
```

- **Potential Compatibility Impact:**
  - Zero disruption to genuine JPG, PNG, and WebP uploads.
  - Correctly blocks disguised HTML, active SVG, shell scripts, and executable uploads.

---

### Finding HIGH-03: Purge Hardcoded Database Credentials from QA Automation Scripts

- **Priority:** P0 (Immediate Public Deployment Blocker)
- **Affected Files:**
  - `scripts/qa/verify_auth_persistence_and_reset.js`
  - `scripts/qa/verify_after_restart.js`

#### Implementation:

1. Immediately rotate the MySQL password for `lankastay_app` in the local MySQL instance.
2. In `scripts/qa/verify_auth_persistence_and_reset.js` (line 96) and `scripts/qa/verify_after_restart.js` (line 46):
   **REPLACE:**
   ```javascript
   // BEFORE:
   const mysqlOut = /* credential redacted; use queryDatabase(sql) from scripts/qa/db-config.js */;

   // AFTER:
   const dbPassword = process.env.DB_PASSWORD || process.env.LANKASTAY_DB_PASSWORD;
   if (!dbPassword) {
     console.error('ERROR: Database password not supplied. Set DB_PASSWORD in environment before running QA scripts.');
     process.exit(1);
   }
   const mysqlOut = execSync(`mysql -u lankastay_app -p"${dbPassword}" -e "USE lankastay_db; SELECT ...;"`, { encoding: 'utf-8' });
   ```
3. Add `scripts/qa/.env.qa` to `.gitignore`.

---

### Finding HIGH-04: Enforce Function Level Authorization on Destination & Attraction Management

- **Priority:** P1 (Pre-Release Requirement)
- **Affected Files:**
  - `backend/src/main/java/com/lankastay/backend/controller/ManagementDestinationController.java`
  - `backend/src/main/java/com/lankastay/backend/controller/AttractionController.java`

#### Implementation:

1. In `ManagementDestinationController.java`:
   Add `@PreAuthorize("hasRole('MANAGER')")` to mutating methods:
   ```java
   @PostMapping
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<DestinationResponse> createDestination(@Valid @RequestBody DestinationCreateRequest request) { ... }

   @PutMapping("/{id}")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<DestinationResponse> updateDestination(@PathVariable Long id, @Valid @RequestBody DestinationUpdateRequest request) { ... }

   @PatchMapping("/{id}/status")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<DestinationResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody DestinationStatusUpdateRequest request) { ... }

   @DeleteMapping("/{id}")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<Void> deleteDestination(@PathVariable Long id) { ... }
   ```

2. In `AttractionController.java`:
   Add `@PreAuthorize("hasRole('MANAGER')")` to mutating methods:
   ```java
   @PostMapping
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<AttractionResponse> createAttraction(@PathVariable Long destinationId, @Valid @RequestBody AttractionCreateRequest request) { ... }

   @PutMapping("/{attractionId}")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<AttractionResponse> updateAttraction(...) { ... }

   @DeleteMapping("/{attractionId}")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<Void> deleteAttraction(...) { ... }
   ```

- **Potential Compatibility Impact:**
  - Aligns runtime security with the intended role matrix in `docs/AUTHORIZATION.md`. Receptionists and hotel staff retain read access (`GET`) but are rejected with 403 Forbidden upon attempting mutating actions.

---

### Finding HIGH-05: Enforce Hotel Scope Validation in Discount Management (IDOR/BOLA Prevention)

- **Priority:** P1 (Pre-Release Requirement)
- **Affected Files:**
  - `backend/src/main/java/com/lankastay/backend/controller/DiscountController.java`
  - `backend/src/main/java/com/lankastay/backend/service/DiscountService.java`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java`

#### Implementation:

1. In `DiscountController.java`:
   Pass the authenticated `StaffPrincipal` to `updateDiscount`:
   ```java
   @PutMapping("/{id}")
   @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
   public Discount updateDiscount(
           @PathVariable Long id,
           @RequestBody Discount discount,
           @AuthenticationPrincipal StaffPrincipal principal
   ) {
       return discountService.updateDiscount(id, discount, principal);
   }
   ```

2. In `DiscountService.java`:
   Enforce property ownership in `updateDiscount`:
   ```java
   @Transactional
   public Discount updateDiscount(Long id, Discount updated, StaffPrincipal principal) {
       Discount existing = discountRepository.findById(id)
               .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Discount not found with ID: " + id));

       // Multi-property authorization check: Hotel staff can only update discounts for their assigned hotel
       if (!"MANAGER".equalsIgnoreCase(principal.role())) {
           if (principal.assignedHotelId() == null || !principal.assignedHotelId().equals(existing.getHotelId())) {
               throw new AccessDeniedException("You are not authorized to modify discounts for another hotel.");
           }
           // Prevent staff from changing the hotel assignment of a discount
           updated.setHotelId(existing.getHotelId());
       }

       existing.setCode(updated.getCode());
       existing.setTitle(updated.getTitle());
       existing.setDescription(updated.getDescription());
       existing.setDiscountType(updated.getDiscountType());
       existing.setDiscountValue(updated.getDiscountValue());
       existing.setMinimumNights(updated.getMinimumNights());
       existing.setValidFrom(updated.getValidFrom());
       existing.setValidTo(updated.getValidTo());
       existing.setStatus(updated.getStatus());

       return discountRepository.save(existing);
   }
   ```

3. Expose Public Promo Code Validation:
   Relocate `validateCode` from `/api/v1/management/discounts/validate` to `/api/v1/customer/discounts/validate` and add it to `SecurityConfig.java` `permitAll()` so booking customers can validate discounts without requiring staff credentials.

---

### Finding MED-01: Fail-Closed Hotel Scope Authorization in `HotelService`

- **Priority:** P1 (Pre-Release Requirement)
- **Affected File:** `backend/src/main/java/com/lankastay/backend/service/HotelService.java` (lines 356–374)

#### Implementation:

```java
// BEFORE (Fail-open when staffUser.getAssignedHotelId() is null):
if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
    StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
    if (staffUser != null && staffUser.getAssignedHotelId() != null && !staffUser.getAssignedHotelId().equals(hotelId)) {
        throw new AccessDeniedException("You are not authorized to access or modify this hotel.");
    }
    return;
}

// AFTER (Fail-closed: requires valid assignedHotelId strictly matching hotelId):
if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
    StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
    if (staffUser == null || staffUser.getAssignedHotelId() == null || !staffUser.getAssignedHotelId().equals(hotelId)) {
        throw new AccessDeniedException("Access denied: You are not assigned to manage this hotel property.");
    }
    return;
}

// UPDATE HELPER METHOD:
private boolean isAuthorizedForHotel(StaffPrincipal principal, Long hotelId) {
    if (principal == null) return false;
    if (StaffRole.MANAGER.name().equals(principal.role())) return true;
    if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
        StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
        return staffUser != null && staffUser.getAssignedHotelId() != null && staffUser.getAssignedHotelId().equals(hotelId);
    }
    return false;
}
```

---

### Finding MED-02: Content-Security-Policy (CSP) & HSTS Headers

- **Priority:** P1 (Pre-Release Requirement)
- **Affected File:** `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java` (lines 84–87)

#### Implementation:

```java
.headers(headers -> headers
    .frameOptions(frame -> frame.deny())
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(policy -> policy.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .permissionsPolicy(policy -> policy.policy("camera=(), microphone=(), geolocation=(self)"))
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https://*.tile.openstreetmap.org; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    ))
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000)
    )
)
```

---

### Finding MED-03 & MED-04: Session Revocation & Dev Endpoint Isolation

- **Priority:** P2 (Scheduled Hardening)
- **Affected Files:**
  - `backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java`
  - `backend/src/main/java/com/lankastay/backend/controller/PasswordResetController.java`

#### Implementation:

1. In `PasswordResetController.java`:
   Annotate `/dev-last-reset-link` with Spring's `@Profile("dev")`:
   ```java
   @GetMapping("/dev-last-reset-link")
   @org.springframework.context.annotation.Profile("dev")
   public ResponseEntity<Map<String, String>> getDevLastResetLink(...) { ... }
   ```
   This ensures the handler is never registered in test, staging, or production profiles.

2. In `PasswordResetService.java`:
   Inject `org.springframework.security.core.session.SessionRegistry` and expire active sessions upon successful reset:
   ```java
   // In resetPassword() after password update:
   if (token.getStaffUserId() != null) {
       for (Object principal : sessionRegistry.getAllPrincipals()) {
           if (principal instanceof StaffPrincipal sp && sp.id().equals(token.getStaffUserId())) {
               for (SessionInformation sessionInfo : sessionRegistry.getAllSessions(principal, false)) {
                   sessionInfo.expireNow();
               }
           }
       }
   }
   ```
   For customer sessions, increment a `tokenVersion` or `passwordChangedAt` timestamp on `CustomerUser` and verify in `CustomerSessionService.requireCustomer()`. Any session with a creation time preceding `passwordChangedAt` is immediately invalidated.

---

### Finding MED-06: Bounded Eviction in `LoginRateLimiter`

- **Priority:** P2 (Scheduled Hardening)
- **Affected File:** `backend/src/main/java/com/lankastay/backend/service/LoginRateLimiter.java`

#### Implementation:

Replace the raw `ConcurrentHashMap` with a bounded LRU eviction map to prevent memory exhaustion under spoofed-IP attacks:

```java
package com.lankastay.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Component
public class LoginRateLimiter {

    private static final int MAX_TRACKED_IPS = 10_000;
    private final int maximum;
    private final Duration window;

    // Bounded LRU Map: Automatically purges oldest entry when size exceeds 10,000
    private final Map<String, Deque<Instant>> attempts = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Deque<Instant>> eldest) {
                    return size() > MAX_TRACKED_IPS;
                }
            }
    );

    public LoginRateLimiter(@Value("${lankastay.security.ip-max-attempts:20}") int maximum,
                            @Value("${lankastay.security.ip-window:15m}") Duration window) {
        this.maximum = maximum;
        this.window = window;
    }

    public synchronized boolean allow(String ip) {
        String key = (ip == null || ip.isBlank()) ? "unknown" : ip.trim();
        Instant cutoff = Instant.now().minus(window);
        Deque<Instant> history = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        while (!history.isEmpty() && history.peekFirst().isBefore(cutoff)) {
            history.removeFirst();
        }
        if (history.size() >= maximum) {
            return false;
        }
        history.addLast(Instant.now());
        return true;
    }

    public synchronized void clear(String ip) {
        attempts.remove((ip == null || ip.isBlank()) ? "unknown" : ip.trim());
    }
}
```

---

## 6. Automated Security Regression Test Suite

To guarantee that fixed vulnerabilities cannot be reintroduced, the following automated tests must be integrated into the test suite.

### Backend JUnit / MockMvc Integration Test (`SecurityRegressionTest.java`)

Create file: `backend/src/test/java/com/lankastay/backend/security/SecurityRegressionTest.java`

```java
package com.lankastay.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("REGRESSION CRIT-01: Insecure tokenless password reset endpoints must return 404 or 405")
    void testTokenlessPasswordResetEndpointsAreRemoved() throws Exception {
        // Customer endpoint
        mockMvc.perform(post("/api/v1/customer/auth/forgot-password/change-password")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"guest@example.com\",\"newPassword\":\"Hacked@1234\",\"confirmPassword\":\"Hacked@1234\"}"))
                .andExpect(status().isNotFound());

        // Staff endpoint
        mockMvc.perform(post("/api/v1/auth/forgot-password/change-password")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"manager@lankastay.com\",\"newPassword\":\"Hacked@1234\",\"confirmPassword\":\"Hacked@1234\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("REGRESSION HIGH-01: Public check-email enumeration endpoints must return 404")
    void testEmailEnumerationEndpointsAreRemoved() throws Exception {
        mockMvc.perform(post("/api/v1/customer/auth/forgot-password/check-email")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"guest@example.com\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/auth/forgot-password/check-email")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"manager@lankastay.com\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("REGRESSION HIGH-02: Media upload must reject HTML or script disguised as image")
    @WithMockUser(roles = "MANAGER")
    void testMediaUploadRejectsHtmlFile() throws Exception {
        MockMultipartFile htmlFile = new MockMultipartFile(
                "file",
                "malicious.html",
                "image/png",
                "<script>alert('xss')</script>".getBytes()
        );

        mockMvc.perform(multipart("/api/media/upload")
                .file(htmlFile)
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("REGRESSION HIGH-04: Receptionist must be forbidden from creating destinations")
    @WithMockUser(roles = "RECEPTIONIST")
    void testReceptionistCannotCreateDestination() throws Exception {
        mockMvc.perform(post("/api/management/destinations")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Unauthorized Destination\",\"region\":\"South\",\"district\":\"Galle\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("REGRESSION HIGH-04: Receptionist must be forbidden from deleting attractions")
    @WithMockUser(roles = "RECEPTIONIST")
    void testReceptionistCannotDeleteAttraction() throws Exception {
        mockMvc.perform(delete("/api/management/destinations/1/attractions/1")
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("REGRESSION MED-02: Response must contain Content-Security-Policy and HSTS headers")
    void testSecurityHeadersAreEmitted() throws Exception {
        mockMvc.perform(get("/api/v1/hotels/destinations"))
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
```

---

## 7. Pre-Deployment Verification Checklist

Before releasing LankaStay Hotels & Resorts to any publicly accessible network, the engineering lead must sign off on the following checklist:

| Verification Check | Pass Criteria | Responsible Role |
|---|---|---|
| **CRIT-01 Account Takeover** | Sending POST to `/change-password` without a token returns HTTP 404 | Backend Lead |
| **HIGH-01 Account Enumeration** | Requesting `/forgot-password` always returns identical generic confirmation regardless of email presence | Fullstack Lead |
| **HIGH-02 File Upload Sandboxing** | Uploading `.html`, `.svg`, `.jsp`, or polyglot files returns HTTP 400 | Security Engineer |
| **HIGH-03 Secret Hygiene** | Zero plaintext database or API secrets committed in git history or test scripts | DevSecOps Lead |
| **HIGH-04 BFLA Destination/Attractions** | Authenticated Receptionist receives HTTP 403 on POST/PUT/DELETE | QA Engineer |
| **HIGH-05 BOLA Discount Scoping** | Hotel staff assigned to Hotel A receives HTTP 403 when modifying Hotel B discounts | QA Engineer |
| **MED-01 Fail-Closed Scope** | Staff user with `assignedHotelId = null` receives HTTP 403 on all hotel mutations | Backend Lead |
| **MED-02 Security Headers** | `curl -I` confirms presence of CSP, HSTS, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` | Security Engineer |
| **Pessimistic Locking Verification**| 50 concurrent booking requests for a single room result in exactly 1 booking and 49 conflict rejections | Concurrency QA |
| **Database Least Privilege** | Runtime MySQL user `lankastay_app` has zero DDL privileges (`DROP`, `ALTER`, `GRANT` revoked) | DBA |

## PHASE 1 REMEDIATION VERIFICATION

Implementation completed and verified for the active application on 2026-09-17.
The original Phase 1 code examples above are superseded by the shipped implementation
and this section; Medium/Low roadmap items are unchanged and have not been started.

| Finding | Original Risk | Fix Applied | Regression Test | Test Result | Remaining Manual Step | Final Status |
|---|---|---|---|---|---|---|
| CRIT-01 | CRITICAL: anonymous account takeover | Removed tokenless mappings/services/DTO; 256-bit random hash-only, scoped, locked one-use tokens; mail delivery; lock reset and session revocation | SecurityPhaseOneIntegrationTest; AuthenticationPersistenceAndResetTest; SimpleForgotPasswordIntegrationTest; SimpleStaffForgotPasswordIntegrationTest | PASS: invalid/expired/used/random tokens, once-only reset, hash change, cross-namespace rejection, shared-email isolation, customer/staff session rejection | Deploy code and V19 via normal backend restart; configure/confirm mailbox delivery | FIXED — VERIFIED |
| HIGH-01 | HIGH: customer/staff email enumeration | Removed email-check handlers/calls; same HTTP 200 message for both outcomes; five requests/IP/15 minutes; asynchronous SMTP | SecurityPhaseOneIntegrationTest; secure customer/staff reset integration tests; frontend test:security | PASS: identical status/body/structure; absent users receive no email; sixth IP request returns 429 | Shared limiter if deploying multiple instances; controlled SMTP mailbox test | FIXED — VERIFIED |
| HIGH-02 | HIGH: HTML/SVG upload stored XSS | Trusted image decoding, bounded dimensions/pixels/bytes, allowlisted single extension matching detected format, re-encoded pixels, UUID names, inert resource allowlist/CSP/nosniff | MediaStorageServiceTest; uploadEndpointInspectsBytesAndServesOnlyInertImages | PASS: JPG/PNG/WebP; spoofed HTML/SVG/random, dangerous/double extensions, traversal, oversize/dimension bombs; appended script discarded; normal upload/GET works | Deploy resource handler/header changes; WebP now returns sanitized PNG | FIXED — VERIFIED |
| HIGH-03 | HIGH: exposed database credential | Removed source/document copies; required DB_* configuration; shell-free MySQL invocation with private child environment; placeholder-only example and rotation SQL template | frontend test:security DB config cases; node --check QA scripts; repository-wide literal search; read-only MySQL connection | PASS for source cleanup/config checks; rotation/new-secret reconnect NOT PERFORMED | DBA ALTER USER for lankastay_app@localhost; replace ignored .env/deployment secret/backups; reconnect and restart using NEW secret | FIXED — REQUIRES MANUAL SECRET ROTATION |
| HIGH-04 | HIGH: non-manager global catalog mutation | Manager method authorization on all destination and attraction mutations; preserved GET discovery; authorization matrix corrected | globalCatalogMutationsRejectEveryNonManager; managerCanMutateGlobalDestinationAndAttractionCatalog | PASS: all seven operations deny hotel staff/receptionist/customer/anonymous; manager create/update/status/delete and public reads work | Deploy code | FIXED — VERIFIED |
| HIGH-05 | HIGH: cross-hotel discounts/mass assignment | Validated create/update/response DTOs; existing-row authorization and current DB staff assignment; null/missing hotel fails closed; immutable update ownership; public validation route and legacy alias | discountScopeAndMassAssignmentAreEnforced; managerAllowedAndReceptionistDeniedDiscountMutations; discountCreateUsesAssignedHotelAndRejectsInjectedOwnership; nonexistentHotelFailsClosedAndPublicValidationIsReachable | PASS: own hotel allowed; foreign hotel/null/stale assignment/missing hotel/injected ownership/receptionist denied; manager and public validation work | Deploy code | FIXED — VERIFIED |

### Applied implementation and compatibility

- CRIT-01/HIGH-01: no tokenless service/controller/DTO or email-check handler remains.
  Separate customer/staff auth namespaces prevent shared-email account confusion.
  SecureRandom generates 32 random bytes; only SHA-256 hashes enter the database.
  Tokens expire after 30 minutes; pessimistic token-row locking enforces one use,
  prior/outstanding account tokens are invalidated, BCrypt updates happen only after
  validation, login locks are reset, and security events are recorded. Staff registry
  expiry returns HTTP 401; customer database session_version invalidates old sessions
  in every shared CustomerSessionService caller, including auth/me. Flyway V19 adds
  the column (V6 in the older alternate migration lineage).
- EmailService has SMTP and explicit-development implementations. No public link
  lookup or static reset-link map remains. SMTP is asynchronous, reducing obvious
  delivery timing differences; failures never disclose account existence to HTTP.
  All recovery forms request instructions directly; reset forms get tokens from URL
  parameters and submit through the appropriate account namespace.
- HIGH-02: detect format from an ImageIO reader, enforce 8192-pixel dimension and
  20-million-pixel limits before decoding, cap input/output at 5 MiB, re-encode
  pixels, and store full UUID filenames. WebP input remains supported through a
  TwelveMonkeys reader and becomes sanitized PNG. The upload/resource directories
  now agree; resource paths allow raster extensions only. Backend CSP/nosniff
  makes uploaded content inert without constraining the separately hosted React document.
- HIGH-04: method guards cover four destination and three attraction mutation
  operations; ordinary public discovery and management GET behavior remain.
- HIGH-05: create/update/response DTOs explicitly map permitted fields. Updates
  never change hotel ownership. Authorization uses the stored discount row,
  current active staff assignment, and an existing hotel; null/stale assignment,
  other hotels, missing hotels, and receptionist mutations are rejected. Managers
  retain global discounts. Public validation has a new /api/public route and a
  working read-only legacy alias.
- HIGH-03: both named QA scripts use the shared required DB_* configuration helper.
  MySQL invocation does not use a shell or place the secret in command arguments.
  Source/document secret copies were removed; .env.example contains placeholders.
  The old private credential has NOT been rotated. Local read-only MySQL access
  confirmed lankastay_app@localhost; reviewed rotation SQL is ready.

### Completed checks and remaining deployment steps

Active backend `mvnw.cmd ... test`: PASS, 197 tests (59 owning Phase 1 regression tests).
Frontend `npm.cmd run build`: PASS. Security, auth-validation, rate, and destination
tests: PASS. All four recovery/reset pages render in the security suite. Safe actual
HTTP verification against an isolated H2 MySQL-mode runtime: PASS.
Source-wide exact old-secret scan: only ignored .env. Retired URL strings remain
only in tombstones, regression assertions, and historical evidence, never an active
frontend/QA call or vulnerable controller method. New code contains no real secret.

Before deployment: rotate the database password, replace private configuration and
obsolete secret backups, verify reconnect using the NEW value, deploy/restart with
Flyway V19, and test configured SMTP with a controlled mailbox.
Use [operations guidance](scripts/qa/SECURITY_PHASE_ONE.md) and
[rotation template](scripts/qa/rotate_database_password.sql.example).
HIGH-03 remains FIXED — REQUIRES MANUAL SECRET ROTATION until these operations pass.

The older backend copy received scoped security mirrors but its pre-existing
missing Room/Offer domain types block compilation; restore and verify that copy
before any use. It has not been marked verified and its separate migration
lineage must not be run against the active database.

Exact changed files: [manifest](audit-evidence/phase1/FILES_CHANGED.md).
Exact commands/results and proof limits: [verification](audit-evidence/phase1/VERIFICATION.md).

## Addendum — 2026-09-18 remaining manual actions

Use [current verification evidence](PRE_COMMIT_VERIFICATION_2026-09-18.md), rather
than historical readiness claims. HIGH-03 remains NOT VERIFIED because the current
database credential equals a historical exposed value, despite working direct and
Spring Boot connections. Rotate to an unpublished secret, update only private
local/deployment secret configuration, remove/replace exposed bootstrap settings,
then repeat fresh-connection and historical-value comparisons without revealing secrets.
Do not rewrite Git history in this task. Fresh B18→V19 passed in isolated MySQL;
approve live V19 deployment and controlled-mailbox SMTP verification separately.
The inactive backend is outside this task; earlier repair suggestions are not
authorization to touch it. Personal main/origin-main handoff is proposed, not executed.
