-- Drop old status check constraint if it exists
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add new status check constraint that includes 'draft'
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('draft', 'pending', 'evaluating', 'completed', 'failed'));

-- Set default status to 'draft'
ALTER TABLE submissions ALTER COLUMN status SET DEFAULT 'draft';

-- Add unique constraint on student_id and exam_id to prevent duplicates
ALTER TABLE submissions ADD CONSTRAINT submissions_student_exam_unique UNIQUE (student_id, exam_id);
