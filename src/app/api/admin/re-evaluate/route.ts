import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyJWT } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionCookie.value) as any;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    // 1. Delete existing AI score details if any
    const { error: deleteError } = await supabase
      .from('ai_scores')
      .delete()
      .eq('submission_id', submissionId);

    if (deleteError) {
      console.error('Error clearing old scores:', deleteError);
      return NextResponse.json({ error: 'Failed to clear old scores' }, { status: 500 });
    }

    // 2. Set submission status back to pending, reset retry count
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'pending',
        retry_count: 0
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error resetting submission state:', updateError);
      return NextResponse.json({ error: 'Failed to reset submission state' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Re-evaluation triggered successfully.' });
  } catch (err) {
    console.error('Re-evaluate API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
