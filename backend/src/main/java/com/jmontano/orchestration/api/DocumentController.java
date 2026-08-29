package com.jmontano.orchestration.api;

import com.jmontano.orchestration.application.DocumentService;
import com.jmontano.orchestration.domain.Document;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public final class DocumentController {
    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentSnapshot> get(@PathVariable UUID id) {
        return success(service.get(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<DocumentSnapshot> approve(
            @PathVariable UUID id,
            @RequestHeader(name = "If-Match", required = false) String ifMatch,
            @RequestHeader(name = "X-Request-Id", required = false) String requestId) {
        long expectedVersion = ETagParser.parseRequired(ifMatch);
        RequestIdParser.parseRequired(requestId);
        return success(service.approve(id, expectedVersion));
    }

    private ResponseEntity<DocumentSnapshot> success(Document document) {
        return ResponseEntity.ok()
                .eTag(ETagParser.fromVersion(document.version()))
                .cacheControl(CacheControl.noStore())
                .header("X-Thread-Virtual", Boolean.toString(Thread.currentThread().isVirtual()))
                .body(DocumentSnapshot.from(document));
    }
}
