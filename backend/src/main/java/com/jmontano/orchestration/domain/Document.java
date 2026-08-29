package com.jmontano.orchestration.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Document(
        UUID id,
        String title,
        DocumentStatus status,
        long version,
        OffsetDateTime updatedAt
) {
}
