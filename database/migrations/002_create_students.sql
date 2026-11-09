-- 002: Student-specific details (one per student user).
CREATE TABLE students (
    student_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    academic_background    TEXT,
    year_of_study          VARCHAR(50),
    career_interests       TEXT,
    mentorship_preferences JSONB
);