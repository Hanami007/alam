import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/services/db/admin.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pending = await adminDbService.getPendingVerifications();
    return NextResponse.json(pending);
  } catch (err: any) {
    console.error('[API /api/admin/verifications] Error:', err);
    return NextResponse.json({ error: err.message || 'Error loading verifications' }, { status: 500 });
  }
}
