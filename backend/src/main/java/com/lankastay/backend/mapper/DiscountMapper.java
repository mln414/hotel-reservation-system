package com.lankastay.backend.mapper;

import com.lankastay.backend.dto.discount.DiscountCreateRequest;
import com.lankastay.backend.dto.discount.DiscountResponse;
import com.lankastay.backend.dto.discount.DiscountUpdateRequest;
import com.lankastay.backend.entity.Discount;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DiscountMapper {

    public Discount toEntity(DiscountCreateRequest dto) {
        if (dto == null) return null;
        Discount discount = new Discount();
        discount.setHotelId(dto.getHotelId());
        discount.setCode(dto.getCode());
        discount.setTitle(dto.getTitle());
        discount.setDescription(dto.getDescription());
        if (dto.getDiscountType() != null) discount.setDiscountType(dto.getDiscountType());
        discount.setDiscountValue(dto.getDiscountValue());
        if (dto.getMinimumNights() != null) discount.setMinimumNights(dto.getMinimumNights());
        discount.setValidFrom(dto.getValidFrom());
        discount.setValidTo(dto.getValidTo());
        if (dto.getStatus() != null) discount.setStatus(dto.getStatus());
        return discount;
    }

    public void updateEntity(Discount discount, DiscountUpdateRequest dto) {
        if (dto == null || discount == null) return;
        if (dto.getHotelId() != null) discount.setHotelId(dto.getHotelId());
        if (dto.getCode() != null) discount.setCode(dto.getCode());
        if (dto.getTitle() != null) discount.setTitle(dto.getTitle());
        if (dto.getDescription() != null) discount.setDescription(dto.getDescription());
        if (dto.getDiscountType() != null) discount.setDiscountType(dto.getDiscountType());
        if (dto.getDiscountValue() != null) discount.setDiscountValue(dto.getDiscountValue());
        if (dto.getMinimumNights() != null) discount.setMinimumNights(dto.getMinimumNights());
        if (dto.getValidFrom() != null) discount.setValidFrom(dto.getValidFrom());
        if (dto.getValidTo() != null) discount.setValidTo(dto.getValidTo());
        if (dto.getStatus() != null) discount.setStatus(dto.getStatus());
    }

    public DiscountResponse toResponse(Discount entity) {
        if (entity == null) return null;
        DiscountResponse dto = new DiscountResponse();
        dto.setId(entity.getId());
        dto.setHotelId(entity.getHotelId());
        dto.setCode(entity.getCode());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setDiscountType(entity.getDiscountType());
        dto.setDiscountValue(entity.getDiscountValue());
        dto.setMinimumNights(entity.getMinimumNights());
        dto.setValidFrom(entity.getValidFrom());
        dto.setValidTo(entity.getValidTo());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public List<DiscountResponse> toResponseList(List<Discount> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
