package com.jmontano.orchestration.api;

import com.jmontano.orchestration.domain.Document;
import com.jmontano.orchestration.domain.DocumentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentSnapshot(
        UUID id,
        String title,
        DocumentStatus status,
        String version,
        OffsetDateTime updatedAt
) {
    public static DocumentSnapshot from(Document document) {
        return new DocumentSnapshot(
                document.id(),
                document.title(),
                document.status(),
                Long.toString(document.version()),
                document.updatedAt());
    }
}
