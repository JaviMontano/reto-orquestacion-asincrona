package com.jmontano.orchestration.domain;

import org.springframework.stereotype.Component;

@Component
public final class TransitionPolicy {
    public boolean canApprove(DocumentStatus status) {
        return status == DocumentStatus.PENDING_APPROVAL;
    }

    public boolean canInvalidate(DocumentStatus status) {
        return status == DocumentStatus.PENDING_APPROVAL || status == DocumentStatus.APPROVED;
    }
}
