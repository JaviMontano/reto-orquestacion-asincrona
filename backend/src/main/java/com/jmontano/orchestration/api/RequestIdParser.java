package com.jmontano.orchestration.api;

import java.util.UUID;

public final class RequestIdParser {
    private RequestIdParser() {
    }

    public static UUID parseRequired(String value) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest("INVALID_REQUEST_ID", "X-Request-Id es obligatorio");
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw ApiException.badRequest("INVALID_REQUEST_ID", "X-Request-Id debe ser UUID");
        }
    }
}
