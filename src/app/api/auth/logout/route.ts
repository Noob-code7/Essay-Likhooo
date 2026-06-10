import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url), 303);
  
  // Clear the cookie
  response.cookies.delete('session');
  
  return response;
}
