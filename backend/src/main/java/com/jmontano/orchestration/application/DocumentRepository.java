package com.jmontano.orchestration.application;

import com.jmontano.orchestration.domain.Document;

import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository {
    Optional<Document> findById(UUID id);

    int approve(UUID id, long expectedVersion);

    int invalidate(UUID id);

    int reset(UUID id);
}
