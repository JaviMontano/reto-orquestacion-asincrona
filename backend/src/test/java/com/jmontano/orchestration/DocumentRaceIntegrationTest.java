package com.jmontano.orchestration;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import com.jmontano.orchestration.application.DocumentService;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local")
class DocumentRaceIntegrationTest {
    private static final UUID DOCUMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Value("${local.server.port}")
    private int port;

    private final DocumentService service;
    private final TransactionTemplate transactions;

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    @Autowired
    DocumentRaceIntegrationTest(DocumentService service, TransactionTemplate transactions) {
        this.service = service;
        this.transactions = transactions;
    }

    @BeforeEach
    void resetDocument() throws Exception {
        HttpResponse<String> response = post("/api/test/documents/" + DOCUMENT_ID + "/reset", null, null);
        assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    void s1InvalidationCommitsBeforeApprovalAndProducesExplicitStaleOutcome() throws Exception {
        assertThat(post("/api/test/scenarios/" + DOCUMENT_ID + "/arm-invalidation-first", null, null).statusCode())
                .isEqualTo(200);

        HttpResponse<String> approval = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                UUID.randomUUID().toString());

        assertThat(approval.statusCode()).isEqualTo(412);
        assertThat(approval.headers().firstValue("X-Thread-Virtual")).contains("true");
        JsonNode problem = json.readTree(approval.body());
        assertThat(problem.path("code").asText()).isEqualTo("STALE_VERSION");
        assertThat(problem.path("currentDocument").path("status").asText()).isEqualTo("INVALIDATED");
        assertThat(problem.path("currentDocument").path("version").asText()).isEqualTo("2");
    }

    @Test
    void s2ApprovalThenCurricularUpdateAreTwoValidSequentialTransitions() throws Exception {
        HttpResponse<String> approval = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                UUID.randomUUID().toString());
        assertThat(approval.statusCode()).isEqualTo(200);
        assertDocument(approval.body(), "APPROVED", "2");

        HttpResponse<String> invalidation = post(
                "/api/test/documents/" + DOCUMENT_ID + "/curricular-update",
                null,
                UUID.randomUUID().toString());
        assertThat(invalidation.statusCode()).isEqualTo(200);
        assertThat(invalidation.headers().firstValue("X-Thread-Virtual")).contains("true");
        assertDocument(invalidation.body(), "INVALIDATED", "3");
    }

    @Test
    void repeatedInvalidationIsIdempotentAndDoesNotIncreaseVersion() throws Exception {
        post("/api/test/documents/" + DOCUMENT_ID + "/curricular-update", null, UUID.randomUUID().toString());
        HttpResponse<String> repeated = post(
                "/api/test/documents/" + DOCUMENT_ID + "/curricular-update",
                null,
                UUID.randomUUID().toString());

        assertThat(repeated.statusCode()).isEqualTo(200);
        assertDocument(repeated.body(), "INVALIDATED", "2");
    }

    @Test
    void rejectsMissingPreconditionBeforeWriting() throws Exception {
        HttpResponse<String> response = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                null,
                UUID.randomUUID().toString());
        assertThat(response.statusCode()).isEqualTo(428);

        HttpResponse<String> current = get("/api/documents/" + DOCUMENT_ID);
        assertDocument(current.body(), "PENDING_APPROVAL", "1");
    }

    @Test
    void secondApprovalWithTheOldVersionIsRejectedAsStale() throws Exception {
        assertThat(post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                UUID.randomUUID().toString()).statusCode()).isEqualTo(200);

        HttpResponse<String> second = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                UUID.randomUUID().toString());

        assertThat(second.statusCode()).isEqualTo(412);
        assertDocument(json.readTree(second.body()).path("currentDocument").toString(), "APPROVED", "2");
    }

    @Test
    void matchingVersionCannotApproveAStateThatIsAlreadyInvalidated() throws Exception {
        post("/api/test/documents/" + DOCUMENT_ID + "/curricular-update", null, UUID.randomUUID().toString());

        HttpResponse<String> response = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v2\"",
                UUID.randomUUID().toString());

        assertThat(response.statusCode()).isEqualTo(409);
        assertThat(json.readTree(response.body()).path("code").asText()).isEqualTo("TRANSITION_CONFLICT");
    }

    @Test
    void reportsMissingDocumentAndMalformedRequestId() throws Exception {
        UUID missing = UUID.fromString("00000000-0000-0000-0000-000000000099");
        assertThat(get("/api/documents/" + missing).statusCode()).isEqualTo(404);

        HttpResponse<String> malformed = post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                "not-a-uuid");
        assertThat(malformed.statusCode()).isEqualTo(400);
        assertThat(json.readTree(malformed.body()).path("code").asText()).isEqualTo("INVALID_REQUEST_ID");

        HttpResponse<String> invalidPath = get("/api/documents/not-a-uuid");
        assertThat(invalidPath.statusCode()).isEqualTo(400);
        assertThat(invalidPath.headers().firstValue("Content-Type").orElse(""))
                .startsWith("application/problem+json");
        assertThat(json.readTree(invalidPath.body()).path("code").asText()).isEqualTo("INVALID_PATH_PARAMETER");
    }

    @Test
    void twoConcurrentApprovalsProduceOneCommitAndOneExplicitStaleOutcome() throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(() -> concurrentApproval(ready, start));
            var second = executor.submit(() -> concurrentApproval(ready, start));
            assertThat(ready.await(2, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            assertThat(Stream.of(first.get().statusCode(), second.get().statusCode()).sorted().toList())
                    .containsExactly(200, 412);
        }
        assertDocument(get("/api/documents/" + DOCUMENT_ID).body(), "APPROVED", "2");
    }

    @Test
    void rollsBackAServiceTransitionWhenTheOwningTransactionFails() throws Exception {
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> {
            service.invalidate(DOCUMENT_ID);
            throw new IllegalStateException("simulated downstream failure");
        })).isInstanceOf(IllegalStateException.class);

        assertDocument(get("/api/documents/" + DOCUMENT_ID).body(), "PENDING_APPROVAL", "1");
    }

    private void assertDocument(String body, String status, String version) throws Exception {
        JsonNode document = json.readTree(body);
        assertThat(document.path("status").asText()).isEqualTo(status);
        assertThat(document.path("version").asText()).isEqualTo(version);
    }

    private HttpResponse<String> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(uri(path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String etag, String requestId) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .POST(HttpRequest.BodyPublishers.noBody());
        if (etag != null) request.header("If-Match", etag);
        if (requestId != null) request.header("X-Request-Id", requestId);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> concurrentApproval(CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        if (!start.await(2, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Concurrent approval start gate timed out");
        }
        return post(
                "/api/documents/" + DOCUMENT_ID + "/approve",
                "\"v1\"",
                UUID.randomUUID().toString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
