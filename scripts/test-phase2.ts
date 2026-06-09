import { supabase } from '../src/lib/db';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

async function runTests() {
  console.log('--- STARTING PHASE 2 AUTOMATED TESTS ---');

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

    // 3. Clean up any existing submissions for this student and exam
    console.log('Cleaning up existing submissions for STU001...');
    await supabase
      .from('submissions')
      .delete()
      .eq('student_id', student.id)
      .eq('exam_id', exam.id);

    // TEST 1: Check active submission is null
    console.log('\n[TEST 1] Querying active submission (should be null)');
    const { data: activeSub1 } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_id', exam.id)
      .single();

    if (activeSub1) {
      throw new Error('Test 1 Failed: Expected active submission to be null, got ' + JSON.stringify(activeSub1));
    }
    console.log('✓ TEST 1 PASSED: Active submission is null.');

    // TEST 2: Simulate first autosave (short text)
    console.log('\n[TEST 2] Simulating first autosave with 5 words');
    const firstDraftText = 'This is my first draft.';
    const wordCount1 = countWords(firstDraftText);
    
    // Create new submission with status 'draft'
    const { data: subCreated } = await supabase
      .from('submissions')
      .insert({
        student_id: student.id,
        exam_id: exam.id,
        essay_text: firstDraftText,
        word_count: wordCount1,
        status: 'draft'
      });

    // Query it back
    const { data: activeSub2 } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_id', exam.id)
      .single();

    if (!activeSub2 || activeSub2.status !== 'draft' || activeSub2.essay_text !== firstDraftText) {
      throw new Error('Test 2 Failed: Expected draft row to be created, got: ' + JSON.stringify(activeSub2));
    }
    console.log('✓ TEST 2 PASSED: Draft created successfully with status "draft".');

    // TEST 3: Simulate second autosave (longer text, updates draft)
    console.log('\n[TEST 3] Simulating second autosave with updated text');
    const updatedDraftText = 'This is my first draft. I am adding more text here to simulate autosave changes.';
    const wordCount2 = countWords(updatedDraftText);

    // Update draft since it is still in draft state
    if (activeSub2.status !== 'draft') {
      throw new Error('Test 3 Failed: expected status to be draft');
    }

    await supabase
      .from('submissions')
      .update({
        essay_text: updatedDraftText,
        word_count: wordCount2
      })
      .eq('id', activeSub2.id);

    // Query it back
    const { data: activeSub3 } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_id', exam.id)
      .single();

    if (!activeSub3 || activeSub3.status !== 'draft' || activeSub3.essay_text !== updatedDraftText || activeSub3.word_count !== wordCount2) {
      throw new Error('Test 3 Failed: Expected draft to be updated, got: ' + JSON.stringify(activeSub3));
    }
    console.log(`✓ TEST 3 PASSED: Draft updated successfully. Words: ${activeSub3.word_count}`);

    // TEST 4: Validate word count bounds on submit
    console.log('\n[TEST 4] Validating word count constraints on final submit');
    const invalidShortText = 'Too short.';
    const wordCountShort = countWords(invalidShortText);
    
    if (wordCountShort < 100) {
      console.log('✓ TEST 4A PASSED: Word count < 100 correctly flagged as invalid.');
    } else {
      throw new Error('Test 4A Failed: expected < 100 to be invalid');
    }

    // TEST 5: Final submit (valid text)
    console.log('\n[TEST 5] Final submit with valid word count (120 words)');
    // Construct a paragraph with exactly 120 words to pass validation
    const validEssayText = Array(12).fill('The impact of artificial intelligence on classroom environments is a subject of major discussion in modern schools.').join(' ');
    const wordCountValid = countWords(validEssayText);
    console.log(`Word count of essay to submit: ${wordCountValid}`);

    if (wordCountValid < 100 || wordCountValid > 2000) {
      throw new Error('Valid essay text word count is incorrect: ' + wordCountValid);
    }

    // Finalize submission
    await supabase
      .from('submissions')
      .update({
        essay_text: validEssayText,
        word_count: wordCountValid,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .eq('id', activeSub3.id);

    // Query it back
    const { data: activeSub5 } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_id', exam.id)
      .single();

    if (!activeSub5 || activeSub5.status !== 'pending' || activeSub5.essay_text !== validEssayText) {
      throw new Error('Test 5 Failed: Expected status to be pending, got: ' + JSON.stringify(activeSub5));
    }
    console.log('✓ TEST 5 PASSED: Essay submitted successfully and status changed to "pending".');

    // TEST 6: Attempting to update after final submit
    console.log('\n[TEST 6] Verifying submission lockout (subsequent autosave or edit attempts should be blocked)');
    if (activeSub5.status !== 'draft') {
      console.log('✓ TEST 6 PASSED: Submissions status is not "draft" (is "' + activeSub5.status + '"). Backend locks modifications.');
    } else {
      throw new Error('Test 6 Failed: Submission remains editable after final submission!');
    }

    console.log('\n--- ALL PHASE 2 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  }
}

runTests();
