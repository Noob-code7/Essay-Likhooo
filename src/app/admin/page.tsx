import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';
import AdminDashboard from './dashboard';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/admin/login');
  }

  const payload = (await verifyJWT(sessionCookie.value)) as any;
  if (!payload || payload.role !== 'admin') {
    redirect('/admin/login');
  }

  // Fetch all students
  const { data: students } = await supabase
    .from('students')
    .select('id, student_id, name, created_at');

  // Fetch all submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*');

  // Fetch all AI scores
  const { data: aiScores } = await supabase
    .from('ai_scores')
    .select('*');

  // Fetch active exam (to display prompt details)
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .limit(1)
    .single();

  const studentsList = students || [];
  const submissionsList = submissions || [];
  const scoresList = aiScores || [];

  // Compute aggregate statistics in memory
  const totalStudents = studentsList.length;
  const totalSubmissions = submissionsList.length;
  const pendingCount = submissionsList.filter(
    (s: any) => s.status === 'pending' || s.status === 'evaluating'
  ).length;
  const completedCount = submissionsList.filter(
    (s: any) => s.status === 'completed'
  ).length;
  const failedCount = submissionsList.filter(
    (s: any) => s.status === 'failed'
  ).length;

  const completedScores = scoresList.map((s: any) => Number(s.overall_score));
  const avgScore = completedScores.length > 0 
    ? Math.round(completedScores.reduce((a: number, b: number) => a + b, 0) / completedScores.length) 
    : 0;

  const metrics = {
    totalStudents,
    totalSubmissions,
    pendingCount,
    completedCount,
    failedCount,
    avgScore,
  };

  // Merge submissions, students, and scores into structured items
  const mergedSubmissions = submissionsList.map((sub: any) => {
    const student = studentsList.find(
      (s: any) => String(s.id) === String(sub.student_id)
    );
    const score = scoresList.find(
      (sc: any) => String(sc.submission_id) === String(sub.id)
    );
    return {
      id: sub.id,
      studentId: student?.student_id || 'N/A',
      studentName: student?.name || 'Unknown',
      essayText: sub.essay_text,
      wordCount: sub.word_count,
      submittedAt: sub.submitted_at,
      status: sub.status,
      retryCount: sub.retry_count,
      scores: score ? {
        grammarScore: score.grammar_score,
        accuracyScore: score.accuracy_score,
        qualityScore: score.quality_score,
        overallScore: score.overall_score,
        feedback: score.feedback,
        modelVersion: score.model_version,
        evaluatedAt: score.evaluated_at,
      } : null,
    };
  });

  return (
    <AdminDashboard 
      metrics={metrics} 
      submissions={mergedSubmissions} 
      exam={exam} 
    />
  );
}
