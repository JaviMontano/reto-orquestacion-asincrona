package com.jmontano.orchestration.api;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;

@RestControllerAdvice
public final class ApiExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemResponse> handle(ApiException exception, HttpServletRequest request) {
        return response(
                exception.status(),
                exception.code(),
                exception.getMessage(),
                request,
                exception.currentDocument() == null ? null : DocumentSnapshot.from(exception.currentDocument()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemResponse> handlePathMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {
        return response(400, "INVALID_PATH_PARAMETER", "El identificador de documento debe ser UUID", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        LOGGER.error("Unhandled API failure for {}", request.getRequestURI(), exception);
        return response(500, "INTERNAL_ERROR", "La operación no pudo completarse", request, null);
    }

    private ResponseEntity<ProblemResponse> response(
            int status,
            String code,
            String detail,
            HttpServletRequest request,
            DocumentSnapshot currentDocument) {
        UUID requestId = parseRequestId(request.getHeader("X-Request-Id"));
        ProblemResponse problem = new ProblemResponse(
                "urn:problem:orchestration:" + code.toLowerCase(),
                code.replace('_', ' '),
                status,
                detail,
                code,
                requestId,
                currentDocument);

        ResponseEntity.BodyBuilder response = ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .header("X-Thread-Virtual", Boolean.toString(Thread.currentThread().isVirtual()));
        if (currentDocument != null) {
            response.eTag(ETagParser.fromVersion(Long.parseLong(currentDocument.version())));
        }
        return response.body(problem);
    }

    private UUID parseRequestId(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
