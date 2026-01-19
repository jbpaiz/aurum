-- 20260119000001_add_height_age_to_user_stats.sql
-- Add height_cm and age to health_user_stats to store BMI profile data

ALTER TABLE health_user_stats
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN health_user_stats.height_cm IS 'User height in centimeters for BMI calculations';
COMMENT ON COLUMN health_user_stats.birth_date IS 'User birth date for age-based insights';
