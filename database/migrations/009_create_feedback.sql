-- 009: Feedback on completed sessions (FR-11); one record per participant per session.
CREATE TABLE feedback (
    feedback_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id         UUID        NOT NULL REFERENCES mentorship_sessions(session_id) ON DELETE CASCADE,
    user_id            UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    relevance_rating   INTEGER     NOT NULL CHECK (relevance_rating BETWEEN 1 AND 5),
    satisfaction_score INTEGER     NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 5),
    comments           TEXT,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, user_id)
);