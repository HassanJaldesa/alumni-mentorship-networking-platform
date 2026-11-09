-- 004: Profile used as input to the recommendation pipeline.
CREATE TABLE profiles (
    profile_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    structured_features JSONB,
    bio_text            TEXT,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT now()
);