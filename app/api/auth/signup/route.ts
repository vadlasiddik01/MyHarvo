import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { hashPassword, hashPin, setAuthCookie, createToken } from '@/lib/auth';
import { exactNameRegex, normalizeName } from '@/lib/normalize';
import { verifyGoogleAccessToken } from '@/lib/googleAuth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { password, pin, googleAccessToken } = body;
    const username = normalizeName(body.username);
    const googleProfile = googleAccessToken ? await verifyGoogleAccessToken(googleAccessToken) : null;

    if (googleAccessToken && !googleProfile) {
      return NextResponse.json(
        { error: 'Google sign-up could not be verified' },
        { status: 401 }
      );
    }

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
    const existingUser = await User.findOne({ username: exactNameRegex(username) });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    if (googleProfile) {
      const existingGoogleUser = await User.findOne({
        $or: [{ googleSub: googleProfile.sub }, { googleEmail: googleProfile.email }],
      });

      if (existingGoogleUser) {
        return NextResponse.json(
          { error: 'This Google account is already linked to an account' },
          { status: 409 }
        );
      }
    }

    // Hash password and PIN
    const passwordHash = await hashPassword(password);
    const pinHash = await hashPin(pin);

    // Create user
    const newUser = new User({
      username,
      passwordHash,
      pinHash,
      ...(googleProfile
        ? {
            googleEmail: googleProfile.email,
            googleSub: googleProfile.sub,
            googleName: googleProfile.name,
            googlePicture: googleProfile.picture,
          }
        : {}),
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Signup error:', error);
    const databaseError = getDatabaseErrorMessage(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
