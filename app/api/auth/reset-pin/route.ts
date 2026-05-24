import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { comparePassword, hashPin } from '@/lib/auth';
import { exactNameRegex, normalizeName } from '@/lib/normalize';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { password, newPin } = body;
    const username = normalizeName(body.username);

    // Validation
    if (!username || !password || !newPin) {
      return NextResponse.json(
        { error: 'Username, password, and new PIN are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ username: exactNameRegex(username) });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const authenticated = await comparePassword(password, user.passwordHash);
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Hash new PIN
    const pinHash = await hashPin(newPin);

    // Update user
    await User.findByIdAndUpdate(user._id, { pinHash }, { new: true });

    return NextResponse.json(
      { success: true, message: 'PIN reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Reset PIN error:', error);
    return NextResponse.json(
      { error: 'Reset PIN failed' },
      { status: 500 }
    );
  }
}
