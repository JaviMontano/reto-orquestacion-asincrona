package com.jmontano.orchestration.application;

import com.jmontano.orchestration.api.ApiException;
import com.jmontano.orchestration.domain.Document;
import com.jmontano.orchestration.domain.DocumentStatus;
import com.jmontano.orchestration.domain.TransitionPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DocumentService {
    private final DocumentRepository repository;
    private final TransitionPolicy policy;
    private final ApprovalRaceHook raceHook;

    public DocumentService(DocumentRepository repository, TransitionPolicy policy, ApprovalRaceHook raceHook) {
        this.repository = repository;
        this.policy = policy;
        this.raceHook = raceHook;
    }

    @Transactional(readOnly = true)
    public Document get(UUID id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound(id));
    }

    @Transactional
    public Document approve(UUID id, long expectedVersion) {
        Document observed = get(id);
        if (observed.version() != expectedVersion) {
            throw ApiException.stale(observed);
        }
        if (!policy.canApprove(observed.status())) {
            throw ApiException.transitionConflict(observed, "El documento ya no admite aprobación");
        }

        raceHook.beforeApprovalWrite(id);

        // This conditional write is the linearization point. A prior read never reserves the right to write.
        if (repository.approve(id, expectedVersion) == 1) {
            return get(id);
        }
        return classifyRejectedApproval(id, expectedVersion);
    }

    @Transactional
    public Document invalidate(UUID id) {
        Document observed = get(id);
        if (observed.status() == DocumentStatus.INVALIDATED) {
            return observed;
        }
        if (!policy.canInvalidate(observed.status())) {
            throw ApiException.transitionConflict(observed, "El documento no admite invalidación");
        }

        // Strong curricular priority: the predicate is reevaluated after any row-lock wait.
        if (repository.invalidate(id) == 1) {
            return get(id);
        }
        Document current = get(id);
        if (current.status() == DocumentStatus.INVALIDATED) {
            return current;
        }
        throw ApiException.transitionConflict(current, "La invalidación no pudo aplicarse");
    }

    @Transactional
    public Document reset(UUID id) {
        if (repository.reset(id) == 0) {
            throw ApiException.notFound(id);
        }
        return get(id);
    }

    private Document classifyRejectedApproval(UUID id, long expectedVersion) {
        Document current = get(id);
        if (current.version() != expectedVersion) {
            throw ApiException.stale(current);
        }
        throw ApiException.transitionConflict(current, "La transición dejó de estar permitida");
    }
}
