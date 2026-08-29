CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'INVALIDATED')),
    version BIGINT NOT NULL CHECK (version >= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO documents (id, title, status, version)
VALUES ('00000000-0000-0000-0000-000000000001',
        'Plan curricular de ciencias',
        'PENDING_APPROVAL',
        1);
