package com.jmontano.orchestration.api;

import com.jmontano.orchestration.domain.Document;

import java.util.UUID;

public final class ApiException extends RuntimeException {
    private final int status;
    private final String code;
    private final Document currentDocument;

    private ApiException(int status, String code, String message, Document currentDocument) {
        super(message);
        this.status = status;
        this.code = code;
        this.currentDocument = currentDocument;
    }

    public static ApiException badRequest(String code, String message) {
        return new ApiException(400, code, message, null);
    }

    public static ApiException notFound(UUID id) {
        return new ApiException(404, "DOCUMENT_NOT_FOUND", "No existe el documento " + id, null);
    }

    public static ApiException stale(Document current) {
        return new ApiException(412, "STALE_VERSION", "La versión observada ya no es vigente", current);
    }

    public static ApiException transitionConflict(Document current, String message) {
        return new ApiException(409, "TRANSITION_CONFLICT", message, current);
    }

    public static ApiException preconditionRequired() {
        return new ApiException(428, "PRECONDITION_REQUIRED", "If-Match es obligatorio", null);
    }

    public static ApiException raceInfrastructure(String message) {
        return new ApiException(500, "RACE_HARNESS_FAILURE", message, null);
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public Document currentDocument() {
        return currentDocument;
    }
}
