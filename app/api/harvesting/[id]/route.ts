import { connectDB } from '@/lib/mongodb';
import { Harvesting } from '@/lib/schemas';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeNameFields } from '@/lib/normalize';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const record = await Harvesting.findOne({ _id: id, userId });
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(normalizeNameFields(record.toObject(), ['village', 'farmerName']));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const record = await Harvesting.findOneAndUpdate(
      { _id: id, userId },
      normalizeNameFields(data, ['village', 'farmerName']),
      { new: true, runValidators: true }
    );

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const record = await Harvesting.findOneAndDelete({ _id: id, userId });
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Record deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
