import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { newUsername, usernameHi = '', usernameTe = '' } = await req.json();

    if (!newUsername || newUsername.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername, usernameHi, usernameTe },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      username: newUsername,
      usernameHi: user.usernameHi || '',
      usernameTe: user.usernameTe || '',
    });
  } catch (error: any) {
    console.log('[v0] Update username error:', error);
    return NextResponse.json(
      { error: 'Failed to update username' },
      { status: 500 }
    );
  }
}
