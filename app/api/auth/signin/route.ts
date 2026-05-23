import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { comparePassword, comparePin, setAuthCookie, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { username, password, pin } = body;

    // Validation
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!password && !pin) {
      return NextResponse.json(
        { error: 'Password or PIN is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password or PIN
    let authenticated = false;

    if (password) {
      authenticated = await comparePassword(password, user.passwordHash);
    } else if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be exactly 4 digits' },
          { status: 400 }
        );
      }
      authenticated = await comparePin(pin, user.pinHash);
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create token and set cookie
    const token = createToken(user._id.toString());
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        userId: user._id,
        username: user.username,
        usernameHi: user.usernameHi || '',
        usernameTe: user.usernameTe || '',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Signin error:', error);
    const databaseError = getDatabaseErrorMessage(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Signin failed' },
      { status: 500 }
    );
  }
}
