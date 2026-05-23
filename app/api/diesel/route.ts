import { connectDB } from '@/lib/mongodb';
import { Diesel } from '@/lib/schemas';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const village = searchParams.get('village');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = { userId };

    if (village) {
      query.village = village;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await Diesel.find(query).sort({ date: -1 });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch diesel records' },
      { status: 500 }
    );
  }
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
    const data = await req.json();

    const record = new Diesel({ ...data, userId });
    await record.save();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create diesel record' },
      { status: 500 }
    );
  }
}
