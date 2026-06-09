import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyJWT } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionCookie.value) as any;
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the active exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id')
      .limit(1)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'No active examination found' }, { status: 404 });
    }

    // Fetch the submission for this student and exam
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', payload.id)
      .eq('exam_id', exam.id)
      .single();

    // If it's not found, subError is returned. In our mock DB or Supabase, single() handles empty.
    if (subError && subError.code !== 'PGRST116') {
      // If error is not "row not found", return error
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(submission || null);
  } catch (err) {
    console.error('Active Submission API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
