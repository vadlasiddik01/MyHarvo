import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/lib/schemas';
import { setAuthCookie, createToken } from '@/lib/auth';
import { verifyGoogleAccessToken } from '@/lib/googleAuth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const googleProfile = await verifyGoogleAccessToken(body.googleAccessToken);

    if (!googleProfile) {
      return NextResponse.json(
        { error: 'Google sign in could not be verified' },
        { status: 401 }
      );
    }

    const user = await User.findOne({
      $or: [{ googleSub: googleProfile.sub }, { googleEmail: googleProfile.email }],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account is linked to this Google email. Please sign up first.' },
        { status: 404 }
      );
    }

    let changed = false;
    if (user.googleSub !== googleProfile.sub) {
      user.googleSub = googleProfile.sub;
      changed = true;
    }
    if (user.googleEmail !== googleProfile.email) {
      user.googleEmail = googleProfile.email;
      changed = true;
    }
    if (googleProfile.name && user.googleName !== googleProfile.name) {
      user.googleName = googleProfile.name;
      changed = true;
    }
    if (googleProfile.picture && user.googlePicture !== googleProfile.picture) {
      user.googlePicture = googleProfile.picture;
      changed = true;
    }
    if (changed) {
      await user.save();
    }

    const token = createToken(user._id.toString());
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        userId: user._id,
        username: user.username,
        googleEmail: user.googleEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Google signin error:', error);
    const databaseError = getDatabaseErrorMessage(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Google sign in failed' },
      { status: 500 }
    );
  }
}

