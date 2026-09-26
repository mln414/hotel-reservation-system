# Exact proposed commit manifest — 2026-09-18

Proposal only. SAFE TO COMMIT remains NO until the dated evidence blockers are resolved.
No staging, commits, push or branch handoff have been executed.

This allowlist contains every currently pending nonignored file, including preserved
pre-existing application edits and staged alternate migration deletions. It is not
a claim that every pending source file was newly edited during this continuation.
The 17 blocker-resolution files were reviewed separately in the dated evidence.
Recompute this manifest after any further edits or origin fetch/integration.

A = add previously untracked file; M = modify tracked file; D = delete tracked file.
Documentation moves are represented as old-path D plus new-path A; Git may detect
renames when explicitly staged. Do not use a blanket git add . or copy ignored files.

## Commit 1: fix(app): finalize active full-stack security and migration readiness

491 exact paths:

```text
M .env.example
M .gitignore
M backend/pom.xml
M backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java
M backend/src/main/java/com/lankastay/backend/config/SeedDataInitializer.java
M backend/src/main/java/com/lankastay/backend/config/WebConfig.java
M backend/src/main/java/com/lankastay/backend/controller/AttractionController.java
M backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java
M backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java
M backend/src/main/java/com/lankastay/backend/controller/DiscountController.java
M backend/src/main/java/com/lankastay/backend/controller/ManagementDestinationController.java
M backend/src/main/java/com/lankastay/backend/controller/PasswordResetController.java
A backend/src/main/java/com/lankastay/backend/controller/PublicDiscountController.java
D backend/src/main/java/com/lankastay/backend/dto/auth/SimpleForgotPasswordRequest.java
A backend/src/main/java/com/lankastay/backend/dto/discount/CreateDiscountRequest.java
A backend/src/main/java/com/lankastay/backend/dto/discount/DiscountResponse.java
A backend/src/main/java/com/lankastay/backend/dto/discount/UpdateDiscountRequest.java
M backend/src/main/java/com/lankastay/backend/entity/CustomerUser.java
M backend/src/main/java/com/lankastay/backend/entity/PasswordResetToken.java
M backend/src/main/java/com/lankastay/backend/exception/GlobalExceptionHandler.java
M backend/src/main/java/com/lankastay/backend/mapper/RoomRateMapper.java
M backend/src/main/java/com/lankastay/backend/repository/PasswordResetTokenRepository.java
A backend/src/main/java/com/lankastay/backend/security/RetiredPasswordResetFilter.java
M backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java
M backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java
M backend/src/main/java/com/lankastay/backend/service/CustomerSessionService.java
A backend/src/main/java/com/lankastay/backend/service/DevelopmentEmailService.java
M backend/src/main/java/com/lankastay/backend/service/DiscountService.java
A backend/src/main/java/com/lankastay/backend/service/EmailService.java
M backend/src/main/java/com/lankastay/backend/service/MediaStorageService.java
M backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java
A backend/src/main/java/com/lankastay/backend/service/ResetRequestRateLimiter.java
M backend/src/main/java/com/lankastay/backend/service/ReviewService.java
A backend/src/main/java/com/lankastay/backend/service/SmtpEmailService.java
M backend/src/main/resources/application.properties
A backend/src/main/resources/db/migration/B18__fresh_install_schema.sql
A backend/src/main/resources/db/migration/V16__restore_discount_table.sql
A backend/src/main/resources/db/migration/V17__align_discount_value_type.sql
A backend/src/main/resources/db/migration/V18__destination_management.sql
A backend/src/main/resources/db/migration/V19__customer_session_version.sql
D backend/src/main/resources/db/migration/V4__destination_management.sql
D backend/src/main/resources/db/migration/V5__room_rates_and_discounts.sql
M backend/src/test/java/com/lankastay/backend/AuthenticationPersistenceAndResetTest.java
M backend/src/test/java/com/lankastay/backend/DiscountServiceTest.java
M backend/src/test/java/com/lankastay/backend/ManagementRateServiceTest.java
M backend/src/test/java/com/lankastay/backend/MediaStorageServiceTest.java
A backend/src/test/java/com/lankastay/backend/MySqlMigrationIT.java
M backend/src/test/java/com/lankastay/backend/ReviewManagementIntegrationTest.java
A backend/src/test/java/com/lankastay/backend/SecurityPhaseOneIntegrationTest.java
A backend/src/test/java/com/lankastay/backend/SeedDataInitializerTest.java
M backend/src/test/java/com/lankastay/backend/SimpleForgotPasswordIntegrationTest.java
M backend/src/test/java/com/lankastay/backend/SimpleStaffForgotPasswordIntegrationTest.java
A frontend/.gitignore
A frontend/.oxlintrc.json
A frontend/index.html
A frontend/package.json
A frontend/package-lock.json
A frontend/public/favicon.svg
A frontend/public/icons.svg
A frontend/README.md
A frontend/scripts/authValidation.test.mjs
A frontend/scripts/contentDomain.test.mjs
A frontend/scripts/customerOfferIntegration.test.mjs
A frontend/scripts/customerReservationIntegration.test.mjs
A frontend/scripts/destinationCardVisual.test.mjs
A frontend/scripts/destinationDiscovery.test.mjs
A frontend/scripts/destinationDomain.test.mjs
A frontend/scripts/hotelDiscovery.test.mjs
A frontend/scripts/hotelDomain.test.mjs
A frontend/scripts/liveHotelAccommodation.test.mjs
A frontend/scripts/offerDomain.test.mjs
A frontend/scripts/offerRuntimeVisibility.test.mjs
A frontend/scripts/rateDomain.test.mjs
A frontend/scripts/reservationDomain.test.mjs
A frontend/scripts/reservationMedia.test.mjs
A frontend/scripts/reservationMediaCases.jsx
A frontend/scripts/reviewDomain.test.mjs
A frontend/scripts/reviewEditor.test.mjs
A frontend/scripts/reviewEditorCases.jsx
A frontend/scripts/roomDomain.test.mjs
A frontend/scripts/runtimeSmoke.mjs
A frontend/scripts/RuntimeSmokeApp.jsx
A frontend/scripts/securityPhaseOne.test.mjs
A frontend/scripts/staffDomain.test.mjs
A frontend/src/App.css
A frontend/src/App.jsx
A frontend/src/assets/beaches-and-water.png
A frontend/src/assets/cultural-tours.png
A frontend/src/assets/hero.png
A frontend/src/assets/hidden-gems-sri-lanka.png
A frontend/src/assets/images/.gitkeep
A frontend/src/assets/images/colombo.png
A frontend/src/assets/images/galle.png
A frontend/src/assets/images/home/beach-escape.png
A frontend/src/assets/images/home/city-grand..png
A frontend/src/assets/images/home/collections/city-breaks.png
A frontend/src/assets/images/home/collections/coastal-getaways.png
A frontend/src/assets/images/home/collections/family-holidays.png
A frontend/src/assets/images/home/collections/heritage-stays.png
A frontend/src/assets/images/home/collections/luxury-escapes.png
A frontend/src/assets/images/home/collections/villas-and-nature.png
A frontend/src/assets/images/home/discover/beaches-and-water.png
A frontend/src/assets/images/home/discover/cultural-tours.png
A frontend/src/assets/images/home/discover/hidden-gems-sri-lanka.png
A frontend/src/assets/images/home/discover/sri-lanka-travel-guide.png
A frontend/src/assets/images/home/discover/three-days-in-galle.png
A frontend/src/assets/images/home/discover/wellness-retreat.png
A frontend/src/assets/images/home/discover/wildlife-safari.png
A frontend/src/assets/images/home/early-bird-offer.png
A frontend/src/assets/images/home/family-holiday.png
A frontend/src/assets/images/home/heritage-fort.png
A frontend/src/assets/images/home/hero/galle-ocean-resort.png
A frontend/src/assets/images/home/hero/kandy-lake-resort.png
A frontend/src/assets/images/home/hero/nuwara-eliya-hill-resort.png
A frontend/src/assets/images/home/hero/sigiriya-rock-resort.png
A frontend/src/assets/images/home/hero/yala-safari-resort.png
A frontend/src/assets/images/home/highland-mist.png
A frontend/src/assets/images/home/lagoon-resort.png
A frontend/src/assets/images/home/long-stay-offer.png
A frontend/src/assets/images/home/ocean - bay/bathroom.png
A frontend/src/assets/images/home/ocean - bay/beach.png
A frontend/src/assets/images/home/ocean - bay/deluxe-ocean-view-room.png
A frontend/src/assets/images/home/ocean - bay/early-bird-escape.png
A frontend/src/assets/images/home/ocean - bay/family-ocean-room.png
A frontend/src/assets/images/home/ocean - bay/galle-heritage-tour.png
A frontend/src/assets/images/home/ocean - bay/long-stay-saver.png
A frontend/src/assets/images/home/ocean - bay/ocean-bay-tour.mp4.mp4
A frontend/src/assets/images/home/ocean - bay/ocean-kayaking-adventure.png
A frontend/src/assets/images/home/ocean - bay/ocean-terrace-restaurant.png
A frontend/src/assets/images/home/ocean - bay/pool.png
A frontend/src/assets/images/home/ocean - bay/poolside-dining.png
A frontend/src/assets/images/home/ocean - bay/premium-ocean-suite.png
A frontend/src/assets/images/home/ocean - bay/restaurant.png
A frontend/src/assets/images/home/ocean - bay/romantic-coastal-getaway.png
A frontend/src/assets/images/home/ocean - bay/room.png
A frontend/src/assets/images/home/ocean - bay/sunset-bar-lounge.png
A frontend/src/assets/images/home/ocean - bay/sunset-beach-walk.png
A frontend/src/assets/images/home/ocean-bay.png
A frontend/src/assets/images/home/ocean-view-colombo.png
A frontend/src/assets/images/home/romantic-getaway.png
A frontend/src/assets/images/home/safari-lodge.png
A frontend/src/assets/images/home/sigiriya-retreat.png
A frontend/src/assets/images/home/tea-garden.png
A frontend/src/assets/images/lankastay-heritage-fort.png
A frontend/src/assets/images/lankastay-highland-mist.png
A frontend/src/assets/images/lankastay-logo.png
A frontend/src/assets/images/lankastay-ocean-bay.png
A frontend/src/assets/images/lankastay-sigiriya-retreat.png
A frontend/src/assets/images/negombo.png
A frontend/src/assets/images/nuwara-eliya.png
A frontend/src/assets/images/sigiriya.png
A frontend/src/assets/images/yala.png
A frontend/src/assets/react.svg
A frontend/src/assets/sri-lanka-travel-guide.png
A frontend/src/assets/three-days-in-galle.png
A frontend/src/assets/vite.svg
A frontend/src/assets/wellness-retreat.png
A frontend/src/assets/wildlife-safari.png
A frontend/src/components/AppErrorBoundary/AppErrorBoundary.css
A frontend/src/components/AppErrorBoundary/AppErrorBoundary.jsx
A frontend/src/components/AttractionEditor/AttractionEditor.css
A frontend/src/components/AttractionEditor/AttractionEditor.jsx
A frontend/src/components/AuthLayout/AuthLayout.css
A frontend/src/components/AuthLayout/AuthLayout.jsx
A frontend/src/components/CancelReservationModal/CancelReservationModal.css
A frontend/src/components/CancelReservationModal/CancelReservationModal.jsx
A frontend/src/components/CustomerSelect/CustomerSelect.css
A frontend/src/components/CustomerSelect/CustomerSelect.jsx
A frontend/src/components/DestinationCard/DestinationCard.css
A frontend/src/components/DestinationCard/DestinationCard.jsx
A frontend/src/components/DestinationMap/DestinationMap.css
A frontend/src/components/DestinationMap/DestinationMap.jsx
A frontend/src/components/DestinationMap/LeafletDestinationMap.jsx
A frontend/src/components/DestinationStatusModal/DestinationStatusModal.css
A frontend/src/components/DestinationStatusModal/DestinationStatusModal.jsx
A frontend/src/components/Footer/Footer.css
A frontend/src/components/Footer/Footer.jsx
A frontend/src/components/HotelAccommodation/HotelAccommodation.css
A frontend/src/components/HotelAccommodation/HotelAccommodation.jsx
A frontend/src/components/HotelAccommodation/HotelAccommodationEnhancements.css
A frontend/src/components/HotelAvailability/HotelAvailability.css
A frontend/src/components/HotelAvailability/HotelAvailability.jsx
A frontend/src/components/HotelCard/HotelCard.css
A frontend/src/components/HotelCard/HotelCard.jsx
A frontend/src/components/HotelDining/HotelDining.css
A frontend/src/components/HotelDining/HotelDining.jsx
A frontend/src/components/HotelExperiences/HotelExperiences.css
A frontend/src/components/HotelExperiences/HotelExperiences.jsx
A frontend/src/components/HotelFacilities/HotelFacilities.css
A frontend/src/components/HotelFacilities/HotelFacilities.jsx
A frontend/src/components/HotelFilters/HotelFilters.css
A frontend/src/components/HotelFilters/HotelFilters.jsx
A frontend/src/components/HotelGallery/HotelGallery.css
A frontend/src/components/HotelGallery/HotelGallery.jsx
A frontend/src/components/HotelLocation/HotelLocation.css
A frontend/src/components/HotelLocation/HotelLocation.jsx
A frontend/src/components/HotelLocation/HotelLocationVisualRefinement.css
A frontend/src/components/HotelLocation/HotelMap.jsx
A frontend/src/components/HotelOffers/HotelOffers.css
A frontend/src/components/HotelOffers/HotelOffers.jsx
A frontend/src/components/HotelPagination/HotelPagination.css
A frontend/src/components/HotelPagination/HotelPagination.jsx
A frontend/src/components/HotelPolicies/HotelPolicies.css
A frontend/src/components/HotelPolicies/HotelPolicies.jsx
A frontend/src/components/HotelResultsHeader/HotelResultsHeader.css
A frontend/src/components/HotelResultsHeader/HotelResultsHeader.jsx
A frontend/src/components/HotelReviews/HotelReviews.css
A frontend/src/components/HotelReviews/HotelReviews.jsx
A frontend/src/components/ManagementDialog/ManagementDialog.css
A frontend/src/components/ManagementDialog/ManagementDialog.jsx
A frontend/src/components/ManagementProtectedRoute/ManagementProtectedRoute.jsx
A frontend/src/components/ManagementSelect/ManagementSelect.css
A frontend/src/components/ManagementSelect/ManagementSelect.jsx
A frontend/src/components/ManagementSidebar/ManagementSidebar.css
A frontend/src/components/ManagementSidebar/ManagementSidebar.jsx
A frontend/src/components/ManagementTopbar/ManagementTopbar.css
A frontend/src/components/ManagementTopbar/ManagementTopbar.jsx
A frontend/src/components/MapLocationPicker/LeafletLocationPicker.jsx
A frontend/src/components/MapLocationPicker/MapLocationPicker.css
A frontend/src/components/MapLocationPicker/MapLocationPicker.jsx
A frontend/src/components/MapLocationPicker/MapLocationPickerFallback.css
A frontend/src/components/MediaManager/RoomMediaEditor.css
A frontend/src/components/MediaManager/RoomMediaEditor.jsx
A frontend/src/components/Navbar/Navbar.css
A frontend/src/components/Navbar/Navbar.jsx
A frontend/src/components/OfferCard/OfferCard.css
A frontend/src/components/OfferCard/OfferCard.jsx
A frontend/src/components/ProtectedRoute/ProtectedRoute.jsx
A frontend/src/components/ReservationCard/ReservationCard.css
A frontend/src/components/ReservationCard/ReservationCard.jsx
A frontend/src/components/ReviewCard/ReviewCard.css
A frontend/src/components/ReviewCard/ReviewCard.jsx
A frontend/src/components/ReviewStars/ReviewStars.css
A frontend/src/components/ReviewStars/ReviewStars.jsx
A frontend/src/components/RoomAvailability/RoomAvailability.css
A frontend/src/components/RoomAvailability/RoomAvailability.jsx
A frontend/src/components/RoomAvailability/RoomAvailabilityEnhancements.css
A frontend/src/components/RoomCard/RoomCard.jsx
A frontend/src/components/SearchBar/CalendarPicker.css
A frontend/src/components/SearchBar/CalendarPicker.jsx
A frontend/src/components/SearchBar/DestinationAutocomplete.jsx
A frontend/src/components/SearchBar/GuestSelect.jsx
A frontend/src/components/SearchBar/SearchBar.css
A frontend/src/components/SearchBar/SearchBar.jsx
A frontend/src/components/StaffAuthShell/StaffAuthShell.css
A frontend/src/components/StaffAuthShell/StaffAuthShell.jsx
A frontend/src/components/StaffPasswordFields/StaffPasswordFields.jsx
A frontend/src/components/StayCollectionSelector/StayCollectionSelector.css
A frontend/src/components/StayCollectionSelector/StayCollectionSelector.jsx
A frontend/src/components/TravelStoryModal/TravelStoryModal.css
A frontend/src/components/TravelStoryModal/TravelStoryModal.jsx
A frontend/src/config/development.js
A frontend/src/config/managementNavigation.js
A frontend/src/constants/hotelManagement.js
A frontend/src/constants/roles.js
A frontend/src/constants/staffAccess.js
A frontend/src/context/authContext.js
A frontend/src/context/AuthContext.jsx
A frontend/src/context/customerContext.js
A frontend/src/context/CustomerContext.jsx
A frontend/src/context/destinationsContext.js
A frontend/src/context/DestinationsContext.jsx
A frontend/src/context/hotelDraftContext.js
A frontend/src/context/HotelDraftContext.jsx
A frontend/src/context/hotelsContext.js
A frontend/src/context/HotelsContext.jsx
A frontend/src/context/ManagementFeedback.css
A frontend/src/context/managementFeedbackContext.js
A frontend/src/context/ManagementFeedbackContext.jsx
A frontend/src/context/propertyContentContext.js
A frontend/src/context/PropertyContentContext.jsx
A frontend/src/context/ratesContext.js
A frontend/src/context/RatesContext.jsx
A frontend/src/context/reservationsContext.js
A frontend/src/context/ReservationsContext.jsx
A frontend/src/context/reviewsContext.js
A frontend/src/context/ReviewsContext.jsx
A frontend/src/context/roomsContext.js
A frontend/src/context/RoomsContext.jsx
A frontend/src/context/savedHotelsContext.js
A frontend/src/context/SavedHotelsContext.jsx
A frontend/src/context/staffContext.js
A frontend/src/context/StaffContext.jsx
A frontend/src/context/stayCollectionsContext.js
A frontend/src/context/StayCollectionsContext.jsx
A frontend/src/context/useAuth.js
A frontend/src/context/useCustomer.js
A frontend/src/context/useDestinations.js
A frontend/src/context/useHotelDraft.js
A frontend/src/context/useHotels.js
A frontend/src/context/useManagementFeedback.js
A frontend/src/context/usePropertyContent.js
A frontend/src/context/useRates.js
A frontend/src/context/useReservations.js
A frontend/src/context/useReviews.js
A frontend/src/context/useRooms.js
A frontend/src/context/useSavedHotels.js
A frontend/src/context/useStaff.js
A frontend/src/context/useStayCollections.js
A frontend/src/context/useWebsiteContent.js
A frontend/src/context/websiteContentContext.js
A frontend/src/context/WebsiteContentContext.jsx
A frontend/src/data/customer.js
A frontend/src/data/destinations.js
A frontend/src/data/dining.js
A frontend/src/data/experiences.js
A frontend/src/data/hotelFacilities.js
A frontend/src/data/hotels.js
A frontend/src/data/offers.js
A frontend/src/data/physicalRooms.js
A frontend/src/data/reservations.js
A frontend/src/data/reviews.js
A frontend/src/data/roomAmenities.js
A frontend/src/data/rooms.js
A frontend/src/data/savedHotels.js
A frontend/src/data/staff.js
A frontend/src/data/stayCollections.js
A frontend/src/data/travelStories.js
A frontend/src/hooks/useAuthoritativeAvailability.js
A frontend/src/hooks/useHotelDiscovery.js
A frontend/src/index.css
A frontend/src/layouts/ManagementLayout/ManagementLayout.css
A frontend/src/layouts/ManagementLayout/ManagementLayout.jsx
A frontend/src/main.jsx
A frontend/src/pages/AdminDashboard/AdminDashboard.jsx
A frontend/src/pages/Booking/Booking.css
A frontend/src/pages/Booking/Booking.jsx
A frontend/src/pages/Booking/BookingEnhancements.css
A frontend/src/pages/BookingConfirmation/BookingConfirmation.css
A frontend/src/pages/BookingConfirmation/BookingConfirmation.jsx
A frontend/src/pages/BookingConfirmation/BookingConfirmationEnhancements.css
A frontend/src/pages/CreateHotel/CreateHotel.css
A frontend/src/pages/CreateHotel/CreateHotel.jsx
A frontend/src/pages/DestinationDetails/DestinationAttractions.css
A frontend/src/pages/DestinationDetails/DestinationDetails.css
A frontend/src/pages/DestinationDetails/DestinationDetails.jsx
A frontend/src/pages/DestinationDetailsManagement/DestinationDetailsManagement.css
A frontend/src/pages/DestinationDetailsManagement/DestinationDetailsManagement.jsx
A frontend/src/pages/DestinationForm/AttractionRefinement.css
A frontend/src/pages/DestinationForm/DestinationForm.css
A frontend/src/pages/DestinationForm/DestinationForm.jsx
A frontend/src/pages/DestinationForm/DestinationFormFeedback.css
A frontend/src/pages/DestinationManagement/DestinationManagement.jsx
A frontend/src/pages/Destinations/Destinations.css
A frontend/src/pages/Destinations/Destinations.jsx
A frontend/src/pages/ExperienceDetails/ExperienceDetails.css
A frontend/src/pages/ExperienceDetails/ExperienceDetails.jsx
A frontend/src/pages/Experiences/Experiences.css
A frontend/src/pages/Experiences/Experiences.jsx
A frontend/src/pages/ForgotPassword/ForgotPassword.css
A frontend/src/pages/ForgotPassword/ForgotPassword.jsx
A frontend/src/pages/Home/Home.css
A frontend/src/pages/Home/Home.jsx
A frontend/src/pages/HotelDetails/HotelDetails.css
A frontend/src/pages/HotelDetails/HotelDetails.jsx
A frontend/src/pages/HotelDetails/HotelDetailsVisualRefinement.css
A frontend/src/pages/HotelManagement/HotelManagement.jsx
A frontend/src/pages/HotelManagementPreview/HotelManagementPreview.css
A frontend/src/pages/HotelManagementPreview/HotelManagementPreview.jsx
A frontend/src/pages/Hotels/Hotels.css
A frontend/src/pages/Hotels/Hotels.jsx
A frontend/src/pages/HotelSetup/HotelBasicInformation.css
A frontend/src/pages/HotelSetup/HotelBasicInformation.jsx
A frontend/src/pages/HotelSetup/HotelContentManager.jsx
A frontend/src/pages/HotelSetup/HotelFacilitiesManager.css
A frontend/src/pages/HotelSetup/HotelFacilitiesManager.jsx
A frontend/src/pages/HotelSetup/HotelMediaManager.jsx
A frontend/src/pages/HotelSetup/HotelPoliciesManager.css
A frontend/src/pages/HotelSetup/HotelPoliciesManager.jsx
A frontend/src/pages/HotelSetup/HotelSetup.css
A frontend/src/pages/HotelSetup/HotelSetup.jsx
A frontend/src/pages/HotelSetup/HotelSetupVideo.css
A frontend/src/pages/HotelSetup/PropertyEditors.css
A frontend/src/pages/Login/Login.css
A frontend/src/pages/Login/Login.jsx
A frontend/src/pages/ManageDestinations/ManageDestinations.css
A frontend/src/pages/ManageDestinations/ManageDestinations.jsx
A frontend/src/pages/ManageHotels/ManageHotels.css
A frontend/src/pages/ManageHotels/ManageHotels.jsx
A frontend/src/pages/ManagementAccountSecurity/ManagementAccountSecurity.css
A frontend/src/pages/ManagementAccountSecurity/ManagementAccountSecurity.jsx
A frontend/src/pages/ManagementDashboard/ManagementDashboard.css
A frontend/src/pages/ManagementDashboard/ManagementDashboard.jsx
A frontend/src/pages/ManagementHotelSelectorModule/ManagementHotelSelectorModule.css
A frontend/src/pages/ManagementHotelSelectorModule/ManagementHotelSelectorModule.jsx
A frontend/src/pages/ManagementModule/ManagementModule.css
A frontend/src/pages/ManagementModule/ManagementModule.jsx
A frontend/src/pages/ManageOffers/ManageOffers.css
A frontend/src/pages/ManageOffers/ManageOffers.jsx
A frontend/src/pages/ManageOffers/OffersStabilization.css
A frontend/src/pages/ManageRates/ManageRates.css
A frontend/src/pages/ManageRates/ManageRates.jsx
A frontend/src/pages/ManageReviews/ManageReviews.css
A frontend/src/pages/ManageReviews/ManageReviews.jsx
A frontend/src/pages/ManageRooms/ManageRooms.jsx
A frontend/src/pages/ManageRooms/RoomInventory.jsx
A frontend/src/pages/ManageRooms/RoomManagement.css
A frontend/src/pages/ManageRooms/RoomTypeDetailsManagement.jsx
A frontend/src/pages/ManageRooms/RoomTypeForm.jsx
A frontend/src/pages/ModifyReservation/ModifyReservation.css
A frontend/src/pages/ModifyReservation/ModifyReservation.jsx
A frontend/src/pages/MyReservations/MyReservations.css
A frontend/src/pages/MyReservations/MyReservations.jsx
A frontend/src/pages/OfferDetails/OfferDetails.css
A frontend/src/pages/OfferDetails/OfferDetails.jsx
A frontend/src/pages/Offers/Offers.css
A frontend/src/pages/Offers/Offers.jsx
A frontend/src/pages/Profile/Profile.css
A frontend/src/pages/Profile/Profile.jsx
A frontend/src/pages/RateDiscountManagement/RateDiscountManagement.jsx
A frontend/src/pages/Register/Register.css
A frontend/src/pages/Register/Register.jsx
A frontend/src/pages/ReservationDetails/ReservationDetails.css
A frontend/src/pages/ReservationDetails/ReservationDetails.jsx
A frontend/src/pages/ReservationManagement/ReservationManagement.css
A frontend/src/pages/ReservationManagement/ReservationManagement.jsx
A frontend/src/pages/ResetPassword/ResetPassword.css
A frontend/src/pages/ResetPassword/ResetPassword.jsx
A frontend/src/pages/ReviewEditor/ReviewEditor.css
A frontend/src/pages/ReviewEditor/ReviewEditor.jsx
A frontend/src/pages/Reviews/Reviews.css
A frontend/src/pages/Reviews/Reviews.jsx
A frontend/src/pages/RoomAmenityManagement/RoomAmenityManagement.jsx
A frontend/src/pages/RoomDetails/RoomDetails.css
A frontend/src/pages/RoomDetails/RoomDetails.jsx
A frontend/src/pages/RoomDetails/RoomDetailsEnhancements.css
A frontend/src/pages/RoomSearch/RoomSearch.jsx
A frontend/src/pages/StaffChangePassword/StaffChangePassword.jsx
A frontend/src/pages/StaffForgotPassword/StaffForgotPassword.jsx
A frontend/src/pages/StaffLogin/StaffLogin.css
A frontend/src/pages/StaffLogin/StaffLogin.jsx
A frontend/src/pages/StaffManagement/StaffManagement.css
A frontend/src/pages/StaffManagement/StaffManagement.jsx
A frontend/src/pages/StaffProfile/StaffProfile.css
A frontend/src/pages/StaffProfile/StaffProfile.jsx
A frontend/src/pages/StaffResetPassword/StaffResetPassword.jsx
A frontend/src/pages/WebsiteContentManagement/WebsiteContentDialogs.css
A frontend/src/pages/WebsiteContentManagement/WebsiteContentManagement.css
A frontend/src/pages/WebsiteContentManagement/WebsiteContentManagement.jsx
A frontend/src/routes/AppRoutes.jsx
A frontend/src/services/authApi.js
A frontend/src/services/catalogApi.js
A frontend/src/services/dashboardApi.js
A frontend/src/services/hotelApi.js
A frontend/src/services/nearbyPlacesService.js
A frontend/src/services/offerApi.js
A frontend/src/services/rateApi.js
A frontend/src/services/reservationApi.js
A frontend/src/services/reviewApi.js
A frontend/src/services/roomApi.js
A frontend/src/utils/authValidation.js
A frontend/src/utils/collectionIcons.jsx
A frontend/src/utils/contentDomain.js
A frontend/src/utils/customerOffers.js
A frontend/src/utils/destinationDiscovery.js
A frontend/src/utils/destinationDomain.js
A frontend/src/utils/destinationIcons.jsx
A frontend/src/utils/facilityIcons.js
A frontend/src/utils/hotelDiscovery.js
A frontend/src/utils/hotelManagement.js
A frontend/src/utils/hotelMedia.js
A frontend/src/utils/hotelPolicies.js
A frontend/src/utils/offerEligibility.js
A frontend/src/utils/offerFormatting.js
A frontend/src/utils/offerManagement.js
A frontend/src/utils/rateFormatting.js
A frontend/src/utils/reservationDomain.js
A frontend/src/utils/reservationFormatting.js
A frontend/src/utils/reservationMedia.js
A frontend/src/utils/reviewDomain.js
A frontend/src/utils/roomAmenityIcons.jsx
A frontend/src/utils/roomAmenityOptions.js
A frontend/src/utils/roomDomain.js
A frontend/src/utils/roomMedia.js
A frontend/src/utils/sriLankaAdministrative.js
A frontend/src/utils/staffManagement.js
A frontend/src/utils/staffPasswordValidation.js
A frontend/src/utils/stayCollectionDomain.js
A frontend/vite.config.js
A scripts/qa/CheckBootstrapExposure.java
A scripts/qa/db-config.js
A scripts/qa/rotate_database_password.sql.example
A scripts/qa/verify_after_restart.js
A scripts/qa/verify_auth_persistence_and_reset.js
A scripts/qa/verify_mysql_migrations.ps1
A scripts/qa/verify_phase_one_runtime.mjs
A start-backend.ps1
A start-frontend.ps1
A uploads/.gitkeep
A uploads/destinations/.gitkeep
A uploads/hotels/.gitkeep
```

## Commit 2: docs: organize project guidance and dated audit evidence

20 exact paths:

```text
A CONTRIBUTING.md
A docs/api/API_OVERVIEW.md
A docs/architecture/ARCHITECTURE.md
A docs/architecture/AUTHENTICATION.md
A docs/architecture/AUTHORIZATION.md
A docs/architecture/HELP.md
A docs/audit-evidence/phase1/FILES_CHANGED.md
A docs/audit-evidence/phase1/VERIFICATION.md
A docs/audit-evidence/PRE_COMMIT_COMMIT_MANIFEST_2026-09-18.md
A docs/audit-evidence/PRE_COMMIT_VERIFICATION_2026-09-18.md
A docs/audit-evidence/SECURITY_AUDIT_REPORT.md
A docs/audit-evidence/SECURITY_REMEDIATION_PLAN.md
A docs/audit-evidence/UNIT_TESTING_GAP_CLOSURE_REPORT.md
D docs/AUTHENTICATION.md
D docs/AUTHORIZATION.md
A docs/database/SCHEMA.md
D docs/HELP.md
M README.md
A scripts/qa/SECURITY_PHASE_ONE.md
A SECURITY.md
```

## Commit 3: ci: validate backend and frontend workflows

6 exact paths:

```text
A .github/ISSUE_TEMPLATE/bug_report.md
A .github/ISSUE_TEMPLATE/feature_request.md
A .github/PULL_REQUEST_TEMPLATE.md
A .github/workflows/backend-ci.yml
A .github/workflows/frontend-ci.yml
A scripts/qa/ValidateWorkflows.java
```

## Files that must remain excluded

Private .env and .env.* except .env.example; scripts/qa/.env.qa; backend/target/
(including isolated MySQL data/logs); backend/.m2/ and all Maven cache directories;
frontend/node_modules/; frontend/dist/; frontend/tmp/; runtime uploads other than
uploads/.gitkeep, uploads/destinations/.gitkeep and uploads/hotels/.gitkeep;
backend/uploads/; *.log, *.err.log, *.cookies, crash dumps, tmp/, scratch/,
*.tmp, *.zip, browser profiles, IDE files, hotel-reservation-system/,
.rollback-worktree/ and .target-repo/. Never force-add an excluded secret/artifact.

Browser profiles must remain inside ignored scratch/temp locations or receive an
explicit exclusion before staging; there is no blanket browser-profile ignore rule.

