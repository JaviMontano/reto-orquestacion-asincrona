package com.jmontano.orchestration.local;

import com.jmontano.orchestration.api.ApiException;
import com.jmontano.orchestration.application.ApprovalRaceHook;
import com.jmontano.orchestration.application.DocumentService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;

@Component
@Profile("local")
public final class LocalRaceCoordinator implements ApprovalRaceHook {
    private final ObjectProvider<DocumentService> serviceProvider;
    private final AtomicReference<UUID> armedDocument = new AtomicReference<>();

    public LocalRaceCoordinator(ObjectProvider<DocumentService> serviceProvider) {
        this.serviceProvider = serviceProvider;
    }

    public void armInvalidationFirst(UUID documentId) {
        if (!armedDocument.compareAndSet(null, documentId)) {
            throw ApiException.badRequest("RACE_ALREADY_ARMED", "Ya existe una carrera armada");
        }
    }

    @Override
    public void beforeApprovalWrite(UUID documentId) {
        UUID armed = armedDocument.get();
        if (!documentId.equals(armed) || !armedDocument.compareAndSet(armed, null)) {
            return;
        }

        CompletableFuture<Void> committed = new CompletableFuture<>();
        Thread.startVirtualThread(() -> {
            try {
                // Returning through the transactional proxy is the commit-aware signal.
                serviceProvider.getObject().invalidate(documentId);
                committed.complete(null);
            } catch (Throwable error) {
                committed.completeExceptionally(error);
            }
        });

        try {
            committed.get(Duration.ofSeconds(5).toMillis(), TimeUnit.MILLISECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw ApiException.raceInfrastructure("La espera de invalidación fue interrumpida");
        } catch (ExecutionException | TimeoutException exception) {
            throw ApiException.raceInfrastructure("La invalidación coordinada no confirmó commit");
        }
    }
}
