package com.jmontano.orchestration.infrastructure;

import com.jmontano.orchestration.application.DocumentRepository;
import com.jmontano.orchestration.domain.Document;
import com.jmontano.orchestration.domain.DocumentStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcDocumentRepository implements DocumentRepository {
    private final JdbcTemplate jdbc;

    public JdbcDocumentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Document> findById(UUID id) {
        return jdbc.query("""
                        SELECT id, title, status, version, updated_at
                        FROM documents
                        WHERE id = ?
                        """,
                (rs, row) -> new Document(
                        rs.getObject("id", UUID.class),
                        rs.getString("title"),
                        DocumentStatus.valueOf(rs.getString("status")),
                        rs.getLong("version"),
                        rs.getObject("updated_at", java.time.OffsetDateTime.class)),
                id).stream().findFirst();
    }

    @Override
    public int approve(UUID id, long expectedVersion) {
        return jdbc.update("""
                UPDATE documents
                SET status = 'APPROVED', version = version + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'PENDING_APPROVAL' AND version = ?
                """, id, expectedVersion);
    }

    @Override
    public int invalidate(UUID id) {
        return jdbc.update("""
                UPDATE documents
                SET status = 'INVALIDATED', version = version + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND status IN ('PENDING_APPROVAL', 'APPROVED')
                """, id);
    }

    @Override
    public int reset(UUID id) {
        return jdbc.update("""
                UPDATE documents
                SET status = 'PENDING_APPROVAL', version = 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, id);
    }
}
