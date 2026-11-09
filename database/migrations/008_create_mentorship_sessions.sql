-- 008: Sessions within an accepted mentorship (FR-10).
CREATE TABLE mentorship_sessions (
    session_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id     UUID         NOT NULL REFERENCES mentorship_requests(request_id) ON DELETE CASCADE,
    topic          VARCHAR(200),
    scheduled_date TIMESTAMPTZ  NOT NULL,
    duration       INTEGER      CHECK (duration > 0),
    progress_notes TEXT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_sessions_request ON mentorship_sessions(request_id);