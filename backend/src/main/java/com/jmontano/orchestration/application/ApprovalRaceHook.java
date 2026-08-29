package com.jmontano.orchestration.application;

import java.util.UUID;

public interface ApprovalRaceHook {
    void beforeApprovalWrite(UUID documentId);
}
