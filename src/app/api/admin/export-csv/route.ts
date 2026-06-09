import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyJWT } from '@/lib/auth-helpers';

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Double-quote wrap and escape existing double quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyJWT(sessionCookie.value) as any;
    if (!payload || payload.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Retrieve database datasets
    const { data: students } = await supabase.from('students').select('*');
    const { data: submissions } = await supabase.from('submissions').select('*');
    const { data: aiScores } = await supabase.from('ai_scores').select('*');

    const studentsList = students || [];
    const submissionsList = submissions || [];
    const scoresList = aiScores || [];

    // Construct CSV content
    const headers = [
      'Student ID',
      'Student Name',
      'Submission Status',
      'Submitted At',
      'Word Count',
      'Grammar Score (30)',
      'Accuracy Score (30)',
      'Quality Score (30)',
      'Overall Score (100)',
      'Feedback Remarks',
      'Essay Text'
    ];

    let csvContent = headers.join(',') + '\n';

    submissionsList.forEach((sub: any) => {
      const student = studentsList.find((s: any) => String(s.id) === String(sub.student_id));
      const score = scoresList.find((sc: any) => String(sc.submission_id) === String(sub.id));

      const row = [
        escapeCsvValue(student?.student_id || 'N/A'),
        escapeCsvValue(student?.name || 'Unknown'),
        escapeCsvValue(sub.status),
        escapeCsvValue(sub.submitted_at || 'N/A'),
        sub.word_count,
        score ? score.grammar_score : '',
        score ? score.accuracy_score : '',
        score ? score.quality_score : '',
        score ? score.overall_score : '',
        escapeCsvValue(score ? score.feedback : ''),
        escapeCsvValue(sub.essay_text)
      ];

      csvContent += row.join(',') + '\n';
    });

    // Return text/csv attachment response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=essay_results.csv',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err) {
    console.error('CSV Export API Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
