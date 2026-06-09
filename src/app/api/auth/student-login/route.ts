import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { comparePassword, signJWT } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const { studentId, password } = await req.json();

    if (!studentId || !password) {
      return NextResponse.json(
        { error: 'Student ID and password are required' },
        { status: 400 }
      );
    }

    // Query student from database
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your ID and password and try again.' },
        { status: 401 }
      );
    }

    // Compare password hash
    const isMatch = await comparePassword(password, student.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your ID and password and try again.' },
        { status: 401 }
      );
    }

    // Sign session token
    const token = await signJWT({
      id: student.id,
      role: 'student',
      name: student.name,
      extraId: student.student_id
    });

    const response = NextResponse.json({ success: true, name: student.name });

    // Set cookie
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (err) {
    console.error('Login API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
