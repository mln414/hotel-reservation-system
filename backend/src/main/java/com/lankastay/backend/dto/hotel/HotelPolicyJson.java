package com.lankastay.backend.dto.hotel;

import tools.jackson.databind.json.JsonMapper;

import java.util.Arrays;
import java.util.List;

public final class HotelPolicyJson {
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private HotelPolicyJson() {}

    public static List<HotelPolicyRecord> read(String value) {
        if (value == null || value.isBlank()) return List.of();
        try {
            HotelPolicyRecord[] records = JSON.readValue(value, HotelPolicyRecord[].class);
            return records == null ? List.of() : Arrays.asList(records);
        } catch (Exception ignored) {
            return List.of();
        }
    }

    public static String write(List<HotelPolicyRecord> records) {
        try {
            return JSON.writeValueAsString(records == null ? List.of() : records);
        } catch (Exception error) {
            throw new IllegalArgumentException("Hotel policies could not be saved.", error);
        }
    }
}
