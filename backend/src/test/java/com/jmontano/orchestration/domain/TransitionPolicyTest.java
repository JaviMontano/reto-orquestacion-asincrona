package com.jmontano.orchestration.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TransitionPolicyTest {
    private final TransitionPolicy policy = new TransitionPolicy();

    @Test
    void onlyPendingDocumentsCanBeApproved() {
        assertThat(policy.canApprove(DocumentStatus.PENDING_APPROVAL)).isTrue();
        assertThat(policy.canApprove(DocumentStatus.APPROVED)).isFalse();
        assertThat(policy.canApprove(DocumentStatus.INVALIDATED)).isFalse();
    }

    @Test
    void strongCurricularPriorityCanInvalidatePendingOrApproved() {
        assertThat(policy.canInvalidate(DocumentStatus.PENDING_APPROVAL)).isTrue();
        assertThat(policy.canInvalidate(DocumentStatus.APPROVED)).isTrue();
        assertThat(policy.canInvalidate(DocumentStatus.INVALIDATED)).isFalse();
    }
}
