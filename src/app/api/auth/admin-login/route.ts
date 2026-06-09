import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, signJWT } from '@/lib/auth-helpers';

const DEFAULT_ADMIN_HASH = '$2a$10$w4rU8qB5wE2sQG9bEefHze0tqZ2g8Bw.x2Kj5Mh2o4Z0X3T9xZ.9y'; // bcrypt hash for 'admin123'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_HASH;

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your ID and password and try again.' },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await comparePassword(password, adminPasswordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your ID and password and try again.' },
        { status: 401 }
      );
    }

    // Sign session token
    const token = await signJWT({
      id: 'admin-id',
      role: 'admin',
      name: 'Administrator',
      extraId: adminUsername
    });

    const response = NextResponse.json({ success: true, name: 'Administrator' });

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
    console.error('Admin Login API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
