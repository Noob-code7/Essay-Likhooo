import { NextRequest } from 'next/server';
import { POST as reevaluateHandler } from '../src/app/api/admin/re-evaluate/route';
import { GET as exportCsvHandler } from '../src/app/api/admin/export-csv/route';
import { supabase } from '../src/lib/db';
import { signJWT } from '../src/lib/auth-helpers';

async function runTests() {
  console.log('--- STARTING PHASE 4 AUTOMATED API HANDLER TESTS ---');

  try {
    // 1. Setup mock JWT session tokens
    const adminToken = await signJWT({
      id: 'admin',
      role: 'admin',
      name: 'Administrator'
    });

    const studentToken = await signJWT({
      id: 'student-id-123',
      role: 'student',
      name: 'Student Test',
      extraId: 'STU999'
    });

    // Fetch active exam and student to setup a mock submission
    const { data: student } = await supabase.from('students').select('*').limit(1).single();
    const { data: exam } = await supabase.from('exams').select('*').limit(1).single();

    if (!student || !exam) {
      throw new Error('Test environment needs seeded student and exam. Run seed script first.');
    }

    // Upsert a completed submission to test re-evaluation
    console.log('Setting up mock completed submission in database...');
    // Clear first
    const { data: oldSub } = await supabase.from('submissions').select('id').eq('student_id', student.id).eq('exam_id', exam.id).single();
    if (oldSub) {
      await supabase.from('ai_scores').delete().eq('submission_id', oldSub.id);
      await supabase.from('submissions').delete().eq('id', oldSub.id);
    }

    // Insert submission
    const { data: submission } = await supabase.from('submissions').insert({
      student_id: student.id,
      exam_id: exam.id,
      essay_text: 'This is a test essay to verify admin manual triggers.',
      word_count: 10,
      status: 'completed'
    });

    // Insert score
    await supabase.from('ai_scores').insert({
      submission_id: submission.id,
      grammar_score: 25,
      accuracy_score: 24,
      quality_score: 23,
      overall_score: 82,
      feedback: 'Good work.',
      model_version: 'mock-evaluator-v1'
    });

    console.log(`Mock submission set up (id: ${submission.id})`);

    // TEST 1: Re-evaluate with no session cookie -> expect 401
    console.log('\n[TEST 1] Re-evaluate: Request with no cookies (expect 401)');
    const req1 = new NextRequest('http://localhost/api/admin/re-evaluate', {
      method: 'POST',
      body: JSON.stringify({ submissionId: submission.id })
    });
    const res1 = await reevaluateHandler(req1);
    if (res1.status !== 401) {
      throw new Error(`Expected status 401, got ${res1.status}`);
    }
    console.log('✓ TEST 1 PASSED: Unauthenticated request rejected.');

    // TEST 2: Re-evaluate with student session -> expect 401
    console.log('\n[TEST 2] Re-evaluate: Request with student session (expect 401)');
    const req2 = new NextRequest('http://localhost/api/admin/re-evaluate', {
      method: 'POST',
      body: JSON.stringify({ submissionId: submission.id }),
      headers: {
        cookie: `session=${studentToken}`
      }
    });
    const res2 = await reevaluateHandler(req2);
    if (res2.status !== 401) {
      throw new Error(`Expected status 401, got ${res2.status}`);
    }
    console.log('✓ TEST 2 PASSED: Student request rejected.');

    // TEST 3: Re-evaluate with admin session -> expect 200, verify state changes
    console.log('\n[TEST 3] Re-evaluate: Request with admin session (expect 200)');
    const req3 = new NextRequest('http://localhost/api/admin/re-evaluate', {
      method: 'POST',
      body: JSON.stringify({ submissionId: submission.id }),
      headers: {
        cookie: `session=${adminToken}`
      }
    });
    const res3 = await reevaluateHandler(req3);
    if (res3.status !== 200) {
      throw new Error(`Expected status 200, got ${res3.status}`);
    }

    // Verify DB states: status becomes pending, score is deleted
    const { data: updatedSub } = await supabase.from('submissions').select('*').eq('id', submission.id).single();
    const { data: deletedScore } = await supabase.from('ai_scores').select('*').eq('submission_id', submission.id).single();

    if (!updatedSub || updatedSub.status !== 'pending' || updatedSub.retry_count !== 0) {
      throw new Error('Expected submission status to become "pending" and retry_count to reset to 0');
    }
    if (deletedScore) {
      throw new Error('Expected AI score record to be deleted');
    }
    console.log('✓ TEST 3 PASSED: Submission successfully reset, scores cleared, state transitioned to pending.');

    // TEST 4: Export CSV with student session -> expect 401
    console.log('\n[TEST 4] Export CSV: Request with student session (expect 401)');
    const req4 = new NextRequest('http://localhost/api/admin/export-csv', {
      method: 'GET',
      headers: {
        cookie: `session=${studentToken}`
      }
    });
    const res4 = await exportCsvHandler(req4);
    if (res4.status !== 401) {
      throw new Error(`Expected status 401, got ${res4.status}`);
    }
    console.log('✓ TEST 4 PASSED: Student CSV export request rejected.');

    // TEST 5: Export CSV with admin session -> expect 200 with headers and data
    console.log('\n[TEST 5] Export CSV: Request with admin session (expect 200 with attachment)');
    const req5 = new NextRequest('http://localhost/api/admin/export-csv', {
      method: 'GET',
      headers: {
        cookie: `session=${adminToken}`
      }
    });
    const res5 = await exportCsvHandler(req5);
    if (res5.status !== 200) {
      throw new Error(`Expected status 200, got ${res5.status}`);
    }

    const contentType = res5.headers.get('content-type');
    const contentDisposition = res5.headers.get('content-disposition');
    const csvContent = await res5.text();

    if (!contentType || !contentType.includes('text/csv')) {
      throw new Error('Expected Content-Type text/csv, got: ' + contentType);
    }
    if (!contentDisposition || !contentDisposition.includes('attachment') || !contentDisposition.includes('essay_results.csv')) {
      throw new Error('Expected Content-Disposition attachment, got: ' + contentDisposition);
    }
    if (!csvContent.includes('Student ID') || !csvContent.includes('Submission Status')) {
      throw new Error('CSV contents is missing headers');
    }
    console.log('✓ TEST 5 PASSED: CSV results spreadsheet generated and attachment streamed successfully.');

    console.log('\n--- ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    process.exit(1);
  }
}

runTests();
