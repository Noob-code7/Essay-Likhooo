-- Create a view for submissions that includes student name and roll number
CREATE OR REPLACE VIEW submissions_view AS
SELECT
  sub.id,
  sub.exam_id,
  sub.essay_text,
  sub.word_count,
  sub.submitted_at,
  sub.status,
  sub.retry_count,
  sub.updated_at,
  sub.created_at,
  st.id          AS student_uuid,
  st.student_id  AS roll_number,
  st.name        AS student_name
FROM submissions sub
JOIN students st ON st.id = sub.student_id;

-- Create a view for ai_scores that includes student name and roll number via submission
CREATE OR REPLACE VIEW ai_scores_view AS
SELECT
  sc.id,
  sc.grammar_score,
  sc.accuracy_score,
  sc.quality_score,
  sc.overall_score,
  sc.feedback,
  sc.evaluated_at,
  sc.model_version,
  sub.id         AS submission_id,
  sub.status     AS submission_status,
  sub.word_count,
  sub.submitted_at,
  st.student_id  AS roll_number,
  st.name        AS student_name
FROM ai_scores sc
JOIN submissions sub ON sub.id = sc.submission_id
JOIN students st    ON st.id  = sub.student_id;
