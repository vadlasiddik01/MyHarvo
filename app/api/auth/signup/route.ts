import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { hashPassword, hashPin, setAuthCookie, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { username, usernameHi = '', usernameTe = '', password, pin } = body;

    // Validation
    if (!username || !password || !pin) {
      return NextResponse.json(
        { error: 'Username, password, and PIN are required' },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password and PIN
    const passwordHash = await hashPassword(password);
    const pinHash = await hashPin(pin);

    // Create user
    const newUser = new User({
      username,
      usernameHi,
      usernameTe,
      passwordHash,
      pinHash,
    });

    await newUser.save();

    // Create token and set cookie
    const token = createToken(newUser._id.toString());
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        userId: newUser._id,
        username: newUser.username,
        usernameHi: newUser.usernameHi || '',
        usernameTe: newUser.usernameTe || '',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
