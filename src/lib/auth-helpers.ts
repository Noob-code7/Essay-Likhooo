import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'super-secret-jwt-key-minimum-32-chars-long';
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    return false;
  }
}

// JWT Token Signing
export async function signJWT(payload: { id: string; role: 'student' | 'admin'; name: string; extraId?: string }): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey);
}

// JWT Token Verification
export async function verifyJWT(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}
