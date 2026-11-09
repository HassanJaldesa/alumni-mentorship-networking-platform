-- 003: Alumni mentor details (one per mentor user). max_mentees supports the capacity check in FR-06.
CREATE TABLE alumni_mentors (
    mentor_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID         NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    industry             VARCHAR(150),
    years_of_experience  INTEGER      CHECK (years_of_experience >= 0),
    skills               TEXT,
    mentorship_interests TEXT,
    availability         VARCHAR(255),
    max_mentees          INTEGER      NOT NULL DEFAULT 3 CHECK (max_mentees >= 1),
    profile_bio          TEXT
);

CREATE INDEX idx_alumni_mentors_industry ON alumni_mentors(industry);
