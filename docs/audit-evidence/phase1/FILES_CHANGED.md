# Exact Phase 1 changed-file manifest

Generated build outputs, Maven cache files, and temporary runtime uploads are excluded.
The pre-existing changes to SeedDataInitializer, RoomRateMapper, ReviewService,
ManagementRateServiceTest, ReviewManagementIntegrationTest, and migrations V4/V5/V16/V17/V18
are user changes and were preserved.
The removed SimpleForgotPasswordRequest DTO is explicitly listed as a deletion.

## Active application, tooling, and documentation

- `.env.example`
- `.gitignore`
- `backend/pom.xml`
- `docs/AUTHORIZATION.md`
- `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java`
- `backend/src/main/java/com/lankastay/backend/config/WebConfig.java`
- `backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java`
- `backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java`
- `backend/src/main/java/com/lankastay/backend/controller/PasswordResetController.java`
- `backend/src/main/java/com/lankastay/backend/controller/ManagementDestinationController.java`
- `backend/src/main/java/com/lankastay/backend/controller/AttractionController.java`
- `backend/src/main/java/com/lankastay/backend/controller/DiscountController.java`
- `backend/src/main/java/com/lankastay/backend/controller/PublicDiscountController.java`
- `backend/src/main/java/com/lankastay/backend/dto/auth/SimpleForgotPasswordRequest.java` — DELETED
- `backend/src/main/java/com/lankastay/backend/dto/discount/CreateDiscountRequest.java`
- `backend/src/main/java/com/lankastay/backend/dto/discount/UpdateDiscountRequest.java`
- `backend/src/main/java/com/lankastay/backend/dto/discount/DiscountResponse.java`
- `backend/src/main/java/com/lankastay/backend/entity/CustomerUser.java`
- `backend/src/main/java/com/lankastay/backend/entity/PasswordResetToken.java`
- `backend/src/main/java/com/lankastay/backend/repository/PasswordResetTokenRepository.java`
- `backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java`
- `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java`
- `backend/src/main/java/com/lankastay/backend/service/CustomerSessionService.java`
- `backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java`
- `backend/src/main/java/com/lankastay/backend/service/DiscountService.java`
- `backend/src/main/java/com/lankastay/backend/service/MediaStorageService.java`
- `backend/src/main/java/com/lankastay/backend/service/EmailService.java`
- `backend/src/main/java/com/lankastay/backend/service/DevelopmentEmailService.java`
- `backend/src/main/java/com/lankastay/backend/service/SmtpEmailService.java`
- `backend/src/main/java/com/lankastay/backend/service/ResetRequestRateLimiter.java`
- `backend/src/main/java/com/lankastay/backend/security/RetiredPasswordResetFilter.java`
- `backend/src/main/java/com/lankastay/backend/exception/GlobalExceptionHandler.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/db/migration/V19__customer_session_version.sql`
- `backend/src/test/java/com/lankastay/backend/AuthenticationPersistenceAndResetTest.java`
- `backend/src/test/java/com/lankastay/backend/DiscountServiceTest.java`
- `backend/src/test/java/com/lankastay/backend/MediaStorageServiceTest.java`
- `backend/src/test/java/com/lankastay/backend/SecurityPhaseOneIntegrationTest.java`
- `backend/src/test/java/com/lankastay/backend/SimpleForgotPasswordIntegrationTest.java`
- `backend/src/test/java/com/lankastay/backend/SimpleStaffForgotPasswordIntegrationTest.java`
- `frontend/src/services/authApi.js`
- `frontend/src/pages/ForgotPassword/ForgotPassword.jsx`
- `frontend/src/pages/StaffForgotPassword/StaffForgotPassword.jsx`
- `frontend/src/pages/ResetPassword/ResetPassword.jsx`
- `frontend/src/pages/StaffResetPassword/StaffResetPassword.jsx`
- `frontend/package.json`
- `frontend/scripts/securityPhaseOne.test.mjs`
- `scripts/qa/db-config.js`
- `scripts/qa/verify_auth_persistence_and_reset.js`
- `scripts/qa/verify_after_restart.js`
- `scripts/qa/rotate_database_password.sql.example`
- `scripts/qa/SECURITY_PHASE_ONE.md`
- `scripts/qa/verify_phase_one_runtime.mjs`
- `SECURITY_AUDIT_REPORT.md`
- `SECURITY_REMEDIATION_PLAN.md`
- `audit-evidence/phase1/FILES_CHANGED.md`
- `audit-evidence/phase1/VERIFICATION.md`

## Older incomplete backend: scoped mirrors (runtime verification blocked)

- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/PasswordResetController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/ManagementDestinationController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/AttractionController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/DiscountController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/controller/PublicDiscountController.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/MediaStorageService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/DiscountService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/CustomerSessionService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/EmailService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/SmtpEmailService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/DevelopmentEmailService.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/service/ResetRequestRateLimiter.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/entity/PasswordResetToken.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/entity/CustomerUser.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/repository/PasswordResetTokenRepository.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/config/WebConfig.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/security/RetiredPasswordResetFilter.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/dto/discount/CreateDiscountRequest.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/dto/discount/UpdateDiscountRequest.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/dto/discount/DiscountResponse.java`
- `hotel-reservation-system/backend/src/test/java/com/lankastay/backend/AuthenticationPersistenceAndResetTest.java`
- `hotel-reservation-system/backend/src/test/java/com/lankastay/backend/DiscountServiceTest.java`
- `hotel-reservation-system/backend/src/test/java/com/lankastay/backend/MediaStorageServiceTest.java`
- `hotel-reservation-system/backend/src/test/java/com/lankastay/backend/SecurityPhaseOneIntegrationTest.java`
- `hotel-reservation-system/backend/pom.xml`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java`
- `hotel-reservation-system/backend/src/main/java/com/lankastay/backend/exception/GlobalExceptionHandler.java`
- `hotel-reservation-system/backend/src/main/resources/application.properties`
- `hotel-reservation-system/backend/src/main/resources/db/migration/V6__customer_session_version.sql`

The older copy already lacks Room/Offer entities and repositories needed by its
CustomerReservationService. Its compile failure is documented in VERIFICATION.md;
no success is claimed for that copy, and no unrelated domain reconstruction was attempted.
