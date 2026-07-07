import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/revisions/:id
// Body: { confidence: number } (1-5)
// Marks a due revision as completed today and records how well you remembered it.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const confidence: number | undefined = body?.confidence;

    if (confidence === undefined || confidence < 1 || confidence > 5) {
      return NextResponse.json({ error: 'confidence must be an integer between 1 and 5' }, { status: 400 });
    }

    const revision = await prisma.revision.update({
      where: { id: params.id },
      data: {
        completedAt: new Date(),
        confidence,
      },
    });

    return NextResponse.json({ revision });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
