-- 005: Vectors generated from a profile (DR-03). Requires the pgvector extension.
CREATE TABLE profile_vectors (
    vector_id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id        UUID         NOT NULL UNIQUE REFERENCES profiles(profile_id) ON DELETE CASCADE,
    embedding_vector  VECTOR(384),
    structured_vector VECTOR,
    unified_vector    VECTOR,
    model_name        VARCHAR(100),
    generated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);