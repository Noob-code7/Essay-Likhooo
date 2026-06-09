import { supabase } from '../src/lib/db';
import { spawn } from 'child_process';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

async function runTest() {
  console.log('--- STARTING PHASE 3 ASYNCHRONOUS WORKER INTEGRATION TESTS ---');

  let workerProcess: any = null;

  try {
    // 1. Fetch STU001 student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', 'STU001')
      .single();

    if (studentError || !student) {
      throw new Error('Could not fetch test student STU001: ' + (studentError?.message || 'not found'));
    }
    console.log(`✓ Fetched student STU001 (id: ${student.id})`);

    // 2. Fetch active exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .limit(1)
      .single();

    if (examError || !exam) {
      throw new Error('Could not fetch active exam: ' + (examError?.message || 'not found'));
    }
    console.log(`✓ Fetched active exam (id: ${exam.id})`);

    // 3. Clean up any existing submissions and scores for this student and exam
    console.log('Cleaning up existing submissions and scores for STU001...');
    
    // Fetch old submission if exists to delete scores
    const { data: oldSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('student_id', student.id)
      .eq('exam_id', exam.id)
      .single();

    if (oldSub) {
      await supabase.from('ai_scores').delete().eq('submission_id', oldSub.id);
    }
    await supabase.from('submissions').delete().eq('student_id', student.id).eq('exam_id', exam.id);

    // 4. Insert a new pending submission
    console.log('\nInserting new pending submission for STU001...');
    const testEssayText = Array(10).fill('The role of AI in classrooms presents several pros and cons for students and educators. While it can help automate grading and explain complex ideas, it might reduce student writing critical analysis skills. Overall, classrooms must learn how to integrate it responsibly.').join(' ');
    const wordCount = countWords(testEssayText);

    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        student_id: student.id,
        exam_id: exam.id,
        essay_text: testEssayText,
        word_count: wordCount,
        status: 'pending'
      });

    if (insertError || !submission) {
      throw new Error('Failed to insert pending submission: ' + insertError?.message);
    }
    console.log(`✓ Pending submission created (id: ${submission.id})`);

    // 5. Spawn background AI worker process
    console.log('\nSpawning background AI worker (scripts/worker.ts) as child process...');
    workerProcess = spawn('npx', ['tsx', 'scripts/worker.ts'], {
      shell: true,
      env: { ...process.env } // Pass environment (including GEMINI_API_KEY if configured)
    });

    workerProcess.stdout.on('data', (data: any) => {
      console.log(`[Worker Output]: ${data.toString().trim()}`);
    });

    workerProcess.stderr.on('data', (data: any) => {
      console.error(`[Worker Error]: ${data.toString().trim()}`);
    });

    // 6. Poll database until submission is completed
    console.log('\nPolling database to wait for status to transition to "completed" (max 15 seconds)...');
    
    const maxPollAttempts = 8;
    let attempt = 0;
    let isCompleted = false;
    let finalSubmissionState: any = null;

    while (attempt < maxPollAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempt++;
      console.log(`Polling attempt ${attempt}/${maxPollAttempts}...`);

      const { data: sub } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submission.id)
        .single();

      if (sub) {
        console.log(`  Current submission status: ${sub.status}`);
        if (sub.status === 'completed') {
          isCompleted = true;
          finalSubmissionState = sub;
          break;
        }
        if (sub.status === 'failed') {
          throw new Error('Submission processing failed in worker (status set to failed)');
        }
      }
    }

    if (!isCompleted) {
      throw new Error('Timeout: Submission was not processed by the worker within 15 seconds.');
    }
    console.log('✓ Status successfully transitioned to "completed".');

    // 7. Verify AI Score entry is written correctly
    console.log('\nVerifying score entry in ai_scores table...');
    const { data: score, error: scoreError } = await supabase
      .from('ai_scores')
      .select('*')
      .eq('submission_id', submission.id)
      .single();

    if (scoreError || !score) {
      throw new Error('Failed to find score entry for processed submission: ' + (scoreError?.message || 'not found'));
    }

    console.log(`✓ Score record found (id: ${score.id})`);
    console.log(`  Grammar Score: ${score.grammar_score} / 30`);
    console.log(`  Accuracy Score: ${score.accuracy_score} / 30`);
    console.log(`  Quality Score: ${score.quality_score} / 30`);
    console.log(`  Overall Score: ${score.overall_score} / 100`);
    console.log(`  Feedback: ${score.feedback.substring(0, 100)}...`);

    // Bounds asserts
    if (score.grammar_score < 0 || score.grammar_score > 30) throw new Error('Invalid grammar score range');
    if (score.accuracy_score < 0 || score.accuracy_score > 30) throw new Error('Invalid accuracy score range');
    if (score.quality_score < 0 || score.quality_score > 30) throw new Error('Invalid quality score range');
    if (score.overall_score < 0 || score.overall_score > 100) throw new Error('Invalid overall score range');
    if (!score.feedback || score.feedback.trim() === '') throw new Error('Feedback is empty');

    console.log('\n--- ALL PHASE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    if (workerProcess) {
      console.log('Killing worker process...');
      workerProcess.kill();
    }
    process.exit(1);
  } finally {
    if (workerProcess) {
      console.log('Terminating background worker...');
      // On Windows, spawned processes in shells might need force kill
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(workerProcess.pid), '/f', '/t']);
      } else {
        workerProcess.kill();
      }
    }
  }
}

runTest();
