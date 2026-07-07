import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/questions/:id - full history for one question
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      topics: true,
      solveLogs: {
        orderBy: { firstSolvedAt: 'desc' },
        include: { revisions: { orderBy: { dueDate: 'asc' } } },
      },
    },
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  return NextResponse.json({ question });
}

// DELETE /api/questions/:id - remove a question and its solve/revision history
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
