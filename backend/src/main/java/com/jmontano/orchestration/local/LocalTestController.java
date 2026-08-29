package com.jmontano.orchestration.local;

import com.jmontano.orchestration.api.DocumentSnapshot;
import com.jmontano.orchestration.api.ETagParser;
import com.jmontano.orchestration.api.RequestIdParser;
import com.jmontano.orchestration.application.DocumentService;
import com.jmontano.orchestration.domain.Document;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
@Profile("local")
public final class LocalTestController {
    private final DocumentService service;
    private final LocalRaceCoordinator coordinator;

    public LocalTestController(DocumentService service, LocalRaceCoordinator coordinator) {
        this.service = service;
        this.coordinator = coordinator;
    }

    @PostMapping("/scenarios/{id}/arm-invalidation-first")
    public Map<String, String> arm(@PathVariable UUID id) {
        service.get(id);
        coordinator.armInvalidationFirst(id);
        return Map.of("scenario", "INVALIDATION_FIRST", "status", "ARMED");
    }

    @PostMapping("/documents/{id}/curricular-update")
    public ResponseEntity<DocumentSnapshot> invalidate(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Request-Id", required = false) String requestId) {
        RequestIdParser.parseRequired(requestId);
        return success(service.invalidate(id));
    }

    @PostMapping("/documents/{id}/reset")
    public ResponseEntity<DocumentSnapshot> reset(@PathVariable UUID id) {
        return success(service.reset(id));
    }

    private ResponseEntity<DocumentSnapshot> success(Document document) {
        return ResponseEntity.ok()
                .eTag(ETagParser.fromVersion(document.version()))
                .cacheControl(CacheControl.noStore())
                .header("X-Thread-Virtual", Boolean.toString(Thread.currentThread().isVirtual()))
                .body(DocumentSnapshot.from(document));
    }
}
