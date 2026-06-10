-- Alter submissions table to add roll_number and student_name
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Alter ai_scores table to add roll_number and student_name
ALTER TABLE ai_scores ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE ai_scores ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Trigger function to automatically populate student info in submissions
CREATE OR REPLACE FUNCTION sync_submission_student_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT student_id, name INTO NEW.roll_number, NEW.student_name
  FROM students
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_submission_student_info ON submissions;
CREATE TRIGGER trg_sync_submission_student_info
BEFORE INSERT OR UPDATE OF student_id ON submissions
FOR EACH ROW
EXECUTE FUNCTION sync_submission_student_info();

-- Trigger function to automatically populate student info in ai_scores
CREATE OR REPLACE FUNCTION sync_ai_score_student_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT roll_number, student_name INTO NEW.roll_number, NEW.student_name
  FROM submissions
  WHERE id = NEW.submission_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ai_score_student_info ON ai_scores;
CREATE TRIGGER trg_sync_ai_score_student_info
BEFORE INSERT OR UPDATE OF submission_id ON ai_scores
FOR EACH ROW
EXECUTE FUNCTION sync_ai_score_student_info();

-- Trigger function to update submissions and ai_scores if a student's name changes
CREATE OR REPLACE FUNCTION sync_updated_student_name()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- Update submissions
    UPDATE submissions
    SET student_name = NEW.name
    WHERE student_id = NEW.id;
    
    -- Update ai_scores
    UPDATE ai_scores
    SET student_name = NEW.name
    WHERE submission_id IN (
      SELECT id FROM submissions WHERE student_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_updated_student_name ON students;
CREATE TRIGGER trg_sync_updated_student_name
AFTER UPDATE OF name ON students
FOR EACH ROW
EXECUTE FUNCTION sync_updated_student_name();

-- Backfill existing data for submissions
UPDATE submissions sub
SET 
  roll_number = st.student_id,
  student_name = st.name
FROM students st
WHERE sub.student_id = st.id;

-- Backfill existing data for ai_scores
UPDATE ai_scores ac
SET 
  roll_number = sub.roll_number,
  student_name = sub.student_name
FROM submissions sub
WHERE ac.submission_id = sub.id;
