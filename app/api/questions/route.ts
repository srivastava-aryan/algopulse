import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchLeetCodeMeta } from '@/lib/leetcode';
import { buildRevisionSchedule } from '@/lib/revisions';

// GET /api/questions - list all questions with their latest solve log and revisions
export async function GET() {
  const questions = await prisma.question.findMany({
    include: {
      topics: true,
      solveLogs: {
        orderBy: { firstSolvedAt: 'desc' },
        take: 1,
        include: { revisions: { orderBy: { dueDate: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ questions });
}

// POST /api/questions
// Body: { url: string, notes?: string }
// Fetches metadata from LeetCode, upserts the Question + its Topics,
// creates a SolveLog for "today", and generates the 3 revision rows.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string | undefined = body?.url;
    const notes: string | undefined = body?.notes;

    if (!url) {
      return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 });
    }

    const meta = await fetchLeetCodeMeta(url);

    const question = await prisma.question.upsert({
      where: { slug: meta.slug },
      update: { notes: notes ?? undefined },
      create: {
        title: meta.title,
        slug: meta.slug,
        url: meta.url,
        difficulty: meta.difficulty,
        notes,
        topics: {
          connectOrCreate: meta.topics.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { topics: true },
    });

    const firstSolvedAt = new Date();
    const schedule = buildRevisionSchedule(firstSolvedAt);

    const solveLog = await prisma.solveLog.create({
      data: {
        questionId: question.id,
        firstSolvedAt,
        revisions: {
          create: schedule,
        },
      },
      include: { revisions: true },
    });

    return NextResponse.json({ question, solveLog }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
