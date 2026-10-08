package com.lankastay.backend.dto.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ContentSeedRequest(
        @NotNull @Size(max = 500) List<@Valid ContentEntryRequest> entries
) {}
