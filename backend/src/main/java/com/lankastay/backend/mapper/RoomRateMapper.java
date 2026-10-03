package com.lankastay.backend.mapper;

import com.lankastay.backend.dto.rate.RoomRateCreateRequest;
import com.lankastay.backend.dto.rate.RoomRateResponse;
import com.lankastay.backend.dto.rate.RoomRateUpdateRequest;
import com.lankastay.backend.entity.RoomRate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RoomRateMapper {

    public RoomRate toEntity(RoomRateCreateRequest dto) {
        if (dto == null) return null;
        RoomRate rate = new RoomRate();
        rate.setHotelId(dto.getHotelId());
        rate.setRoomId(dto.getRoomId());
        rate.setRatePlanName(dto.getRatePlanName());
        rate.setRatePlanCode(dto.getRatePlanCode());
        rate.setBaseNightlyRate(toBigDecimal(dto.getBaseNightlyRate()));
        rate.setWeekendNightlyRate(toBigDecimal(dto.getWeekendNightlyRate()));
        if (dto.getMealPlan() != null) rate.setMealPlan(dto.getMealPlan());
        if (dto.getCancellationPolicy() != null) rate.setCancellationPolicy(dto.getCancellationPolicy());
        if (dto.getDepositRequired() != null) rate.setDepositRequired(dto.getDepositRequired());
        if (dto.getDepositPercentage() != null) rate.setDepositPercentage(toBigDecimal(dto.getDepositPercentage()));
        if (dto.getStatus() != null) rate.setStatus(dto.getStatus());
        return rate;
    }

    public void updateEntity(RoomRate rate, RoomRateUpdateRequest dto) {
        if (dto == null || rate == null) return;
        if (dto.getRatePlanName() != null) rate.setRatePlanName(dto.getRatePlanName());
        if (dto.getRatePlanCode() != null) rate.setRatePlanCode(dto.getRatePlanCode());
        if (dto.getBaseNightlyRate() != null) rate.setBaseNightlyRate(toBigDecimal(dto.getBaseNightlyRate()));
        if (dto.getWeekendNightlyRate() != null) rate.setWeekendNightlyRate(toBigDecimal(dto.getWeekendNightlyRate()));
        if (dto.getMealPlan() != null) rate.setMealPlan(dto.getMealPlan());
        if (dto.getCancellationPolicy() != null) rate.setCancellationPolicy(dto.getCancellationPolicy());
        if (dto.getDepositRequired() != null) rate.setDepositRequired(dto.getDepositRequired());
        if (dto.getDepositPercentage() != null) rate.setDepositPercentage(toBigDecimal(dto.getDepositPercentage()));
        if (dto.getStatus() != null) rate.setStatus(dto.getStatus());
    }

    public RoomRateResponse toResponse(RoomRate entity) {
        if (entity == null) return null;
        RoomRateResponse dto = new RoomRateResponse();
        dto.setId(entity.getId());
        dto.setHotelId(entity.getHotelId());
        dto.setRoomId(entity.getRoomId());
        dto.setRatePlanName(entity.getRatePlanName());
        dto.setRatePlanCode(entity.getRatePlanCode());
        dto.setBaseNightlyRate(toDouble(entity.getBaseNightlyRate()));
        dto.setWeekendNightlyRate(toDouble(entity.getWeekendNightlyRate()));
        dto.setMealPlan(entity.getMealPlan());
        dto.setCancellationPolicy(entity.getCancellationPolicy());
        dto.setDepositRequired(entity.getDepositRequired());
        dto.setDepositPercentage(toDouble(entity.getDepositPercentage()));
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public List<RoomRateResponse> toResponseList(List<RoomRate> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    private Double toDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }
}
