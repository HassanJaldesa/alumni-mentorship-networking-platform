-- 006: Stored recommendations (FR-06, FR-07); viewed supports the click-through rate in FR-13.
CREATE TABLE mentor_recommendations (
    recommendation_id UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID             NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    mentor_id         UUID             NOT NULL REFERENCES alumni_mentors(mentor_id) ON DELETE CASCADE,
    similarity_score  DOUBLE PRECISION NOT NULL CHECK (similarity_score BETWEEN -1 AND 1),
    rank              INTEGER          NOT NULL CHECK (rank >= 1),
    viewed            BOOLEAN          NOT NULL DEFAULT FALSE,
    generated_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
    UNIQUE (student_id, mentor_id)
);

CREATE INDEX idx_recommendations_student ON mentor_recommendations(student_id);