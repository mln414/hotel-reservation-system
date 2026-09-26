package com.lankastay.backend.controller;

import com.lankastay.backend.dto.offer.PublicOfferResponse;
import com.lankastay.backend.entity.Offer;
import com.lankastay.backend.repository.OfferRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/public/offers")
public class PublicOfferController {

    private final OfferRepository offerRepository;

    public PublicOfferController(OfferRepository offerRepository) {
        this.offerRepository = offerRepository;
    }

    @GetMapping
    public List<PublicOfferResponse> getPublicOffers(@RequestParam(required = false) Long hotelId) {
        List<Offer> activeOffers = offerRepository.findByStatusOrderByDisplayOrderAscCreatedAtDesc("ACTIVE");
        LocalDate today = LocalDate.now();

        return activeOffers.stream()
                .filter(offer -> !offer.getStayEndDate().isBefore(today))
                .filter(offer -> offer.getBookingEndDate() == null || !offer.getBookingEndDate().isBefore(today))
                .filter(offer -> hotelId == null || offer.getTargetHotelIds().isEmpty() || offer.getTargetHotelIds().contains(hotelId))
                .map(PublicOfferResponse::from)
                .toList();
    }
}
