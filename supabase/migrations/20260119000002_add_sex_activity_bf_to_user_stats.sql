-- 20260119000002_add_sex_activity_bf_to_user_stats.sql
-- Add sex, activity_level, and body_fat_percentage to health_user_stats for more accurate BMR/TDEE

ALTER TABLE health_user_stats
  ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC(5,2);

COMMENT ON COLUMN health_user_stats.sex IS 'Biological sex used in BMR formulas (male, female, other)';
COMMENT ON COLUMN health_user_stats.activity_level IS 'Activity factor for TDEE (sedentary, light, moderate, active, athlete)';
COMMENT ON COLUMN health_user_stats.body_fat_percentage IS 'Optional body fat percentage to enable Katch-McArdle BMR';
