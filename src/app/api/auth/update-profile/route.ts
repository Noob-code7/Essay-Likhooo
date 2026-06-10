import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, signJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await verifyJWT(sessionCookie.value)) as any;
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Update name in database
    const { error } = await supabase
      .from('students')
      .update({ name: trimmedName })
      .eq('id', payload.id);

    if (error) {
      console.error('Failed to update student name:', error);
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
    }

    // Re-issue JWT with updated name
    const newToken = await signJWT({
      id: payload.id,
      role: 'student',
      name: trimmedName,
      extraId: payload.extraId,
    });

    const response = NextResponse.json({ success: true, name: trimmedName });
    response.cookies.set({
      name: 'session',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
