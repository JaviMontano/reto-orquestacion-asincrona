package com.jmontano.orchestration.application;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("!local")
public final class NoopApprovalRaceHook implements ApprovalRaceHook {
    @Override
    public void beforeApprovalWrite(UUID documentId) {
        // Production has no test orchestration seam.
    }
}
