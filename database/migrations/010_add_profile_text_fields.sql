-- 010: Keep the two free-text answers separately so users can edit them (FR-02).
-- bio_text remains the combined text that the profile vector pipeline embeds.
-- career_goals holds a student's career goals or a mentor's mentoring focus.
ALTER TABLE profiles
    ADD COLUMN biography    TEXT,
    ADD COLUMN career_goals TEXT;