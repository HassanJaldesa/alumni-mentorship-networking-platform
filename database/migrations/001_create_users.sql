-- 001: Users (all roles). Implements the users entity in Figure 4.3.
CREATE TABLE users (
    user_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    role             VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT', 'ALUMNI_MENTOR', 'ADMIN')),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    consent_given_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);