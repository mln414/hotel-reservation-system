package com.lankastay.backend.dto.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record ContentEntryRequest(
        @NotBlank @Size(max = 160) String key,
        @NotNull Map<String, Object> content
) {}
