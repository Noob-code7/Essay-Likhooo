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

    const normalizedStudentId = studentId.trim().toUpperCase();

    // Validate Student ID Format: starts with IT, CSE, ECE, CSEAI followed by 4-digit year (e.g. 2022, 2023, 2024) and roll number (2-3 digits)
    const studentIdRegex = /^(IT|CSE|ECE|CSEAI)(20\d{2})\d{2,3}$/;
    if (!studentIdRegex.test(normalizedStudentId)) {
      return NextResponse.json(
        { error: 'Invalid Student ID format. Expected format like IT2024034 (Prefix + Year + Roll Number).' },
        { status: 400 }
      );
    }

    // Query student from database
    let { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', normalizedStudentId)
      .single();

    if (error || !student) {
      // If student is not found, we auto-create them if the password is correct ('student123')
      if (password !== 'student123') {
        return NextResponse.json(
          { error: 'Invalid credentials. Please verify your ID and password and try again.' },
          { status: 401 }
        );
      }

      // Create new student
      const passwordHash = '$2b$10$sjRIE7ebUQX.HGss1BSuveCY2O28jmXdt2Yx3Miit8ZuEjs7Gj1N2'; // bcrypt for student123
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          student_id: normalizedStudentId,
          name: `Student ${normalizedStudentId}`,
          password_hash: passwordHash
        })
        .select()
        .single();

      if (createError || !newStudent) {
        console.error('Failed to auto-create student:', createError);
        return NextResponse.json({ error: 'Failed to initialize student account' }, { status: 500 });
      }
      student = newStudent;
    } else {
      // Compare password hash for existing student
      const isMatch = await comparePassword(password, student.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please verify your ID and password and try again.' },
          { status: 401 }
        );
      }
    }

    // Sign session token
    const token = await signJWT({
      id: student.id,
      role: 'student',
      name: student.name,
      extraId: student.student_id
    });

    // Detect if student still has the default auto-generated name and needs to set their real name
    const needsSetup = student.name.startsWith(`Student ${normalizedStudentId}`);
    const response = NextResponse.json({ success: true, name: student.name, needsSetup });

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
