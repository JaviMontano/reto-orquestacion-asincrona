package com.jmontano.orchestration.api;

import java.util.UUID;

public record ProblemResponse(
        String type,
        String title,
        int status,
        String detail,
        String code,
        UUID requestId,
        DocumentSnapshot currentDocument
) {
}
