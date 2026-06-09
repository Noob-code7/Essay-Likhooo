import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyJWT } from '@/lib/auth-helpers';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionCookie.value) as any;
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { essayText } = await req.json();
    if (!essayText) {
      return NextResponse.json({ error: 'Essay text is required' }, { status: 400 });
    }

    const wordCount = countWords(essayText);
    if (wordCount < 100 || wordCount > 2000) {
      return NextResponse.json(
        { error: `Essay word count must be between 100 and 2000 words. (Current word count: ${wordCount})` },
        { status: 400 }
      );
    }

    // Fetch active exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id')
      .limit(1)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'No active examination found' }, { status: 404 });
    }

    // Check if submission already exists
    const { data: existingSub, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', payload.id)
      .eq('exam_id', exam.id)
      .single();

    if (existingSub) {
      // If already submitted (not a draft), block submission
      if (existingSub.status !== 'draft') {
        return NextResponse.json({ error: 'Examination has already been submitted and is locked.' }, { status: 403 });
      }

      // Update the draft to final submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          essay_text: essayText,
          word_count: wordCount,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to finalize submission' }, { status: 500 });
      }
    } else {
      // Insert new final submission
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: payload.id,
          exam_id: exam.id,
          essay_text: essayText,
          word_count: wordCount,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (err) {
    console.error('Submit API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
