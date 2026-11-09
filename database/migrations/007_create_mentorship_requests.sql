-- 007: Mentorship requests (FR-08, FR-09).
CREATE TABLE mentorship_requests (
    request_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID        NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    mentor_id         UUID        NOT NULL REFERENCES alumni_mentors(mentor_id) ON DELETE CASCADE,
    recommendation_id UUID        UNIQUE REFERENCES mentor_recommendations(recommendation_id) ON DELETE SET NULL,
    message           TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    request_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_date     TIMESTAMPTZ
);

CREATE INDEX idx_requests_student ON mentorship_requests(student_id);
CREATE INDEX idx_requests_mentor  ON mentorship_requests(mentor_id);

-- A student may have only one PENDING request to the same mentor at a time.
CREATE UNIQUE INDEX uq_one_pending_request
    ON mentorship_requests(student_id, mentor_id)
    WHERE status = 'PENDING';